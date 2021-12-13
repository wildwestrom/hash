use std::{collections::HashMap, sync::Arc};

use super::{
    comms::{
        sim_status::{SimStatusRecv, SimStatusSend},
        simulation::SimCtlSend,
    },
    id_store::SimIdStore,
    sim_configurer::SimConfigurer,
    Error, Result,
};
use crate::{
    config::{PersistenceConfig, StoreConfig},
    datastore::prelude::SharedStore,
    env::OrchClient,
    experiment::{
        apply_property_changes,
        package::{ExperimentPackageComms, StepUpdate},
        ExperimentControl,
    },
    output::OutputPersistenceCreatorRepr,
    proto::{EngineMsg, EngineStatus, SimulationShortId},
    simulation::{
        comms::Comms,
        controller::{runs::SimulationRuns, sim_control::SimControl, SimulationController},
        package::creator::PackageCreators,
        status::SimStatus,
        Error as SimulationError,
    },
    worker::runner::comms::{
        DatastoreSimulationPayload, ExperimentInitRunnerMsgBase, NewSimulationRun,
    },
    workerpool::{
        self,
        comms::{
            experiment::{ExpMsgSend, ExperimentToWorkerPoolMsg},
            top::{WorkerPoolMsgRecv, WorkerPoolToExpCtlMsg},
            TerminateRecv,
        },
    },
    Environment, ExperimentConfig,
};

pub struct ExperimentController<P: OutputPersistenceCreatorRepr> {
    _exp_config: Arc<ExperimentConfig>,
    // TODO: unused, remove?
    exp_base_config: Arc<ExperimentConfig>,
    env: Environment,
    shared_store: Arc<SharedStore>,
    worker_pool_send: ExpMsgSend,
    worker_pool_controller_recv: WorkerPoolMsgRecv,
    experiment_package_comms: ExperimentPackageComms,
    output_persistence_service_creator: P,
    sim_run_tasks: SimulationRuns,
    sim_senders: HashMap<SimulationShortId, SimCtlSend>,
    worker_pool_send_base: workerpool::comms::main::MainMsgSendBase,
    package_creators: PackageCreators,
    sim_id_store: SimIdStore,
    sim_configurer: SimConfigurer,
    sim_status_send: SimStatusSend,
    sim_status_recv: SimStatusRecv,
    terminate_recv: TerminateRecv,
}

impl<P: OutputPersistenceCreatorRepr> ExperimentController<P> {
    /// Handle an inbound message from the orchestrator (or CLI)
    async fn handle_orch_msg(&mut self, orch_msg: EngineMsg) -> Result<()> {
        match orch_msg {
            EngineMsg::Init(_) => Err(Error::from("Unexpected init message")),
            EngineMsg::SimRegistered(short_id, registered_id) => {
                self.sim_id_store
                    .set_registered_id(short_id, registered_id)
                    .await
            }
        }
    }

    async fn handle_experiment_control_msg(&mut self, msg: ExperimentControl) -> Result<()> {
        match msg {
            ExperimentControl::StartSim {
                sim_id,
                changed_properties,
                max_num_steps,
            } => {
                self.start_new_sim_run(sim_id, changed_properties, max_num_steps)
                    .await?;
            }
            ExperimentControl::PauseSim(sim_short_id) => self.pause_sim_run(sim_short_id).await?,
            ExperimentControl::ResumeSim(sim_short_id) => self.resume_sim_run(sim_short_id).await?,
            ExperimentControl::StopSim(sim_short_id) => self.stop_sim_run(sim_short_id).await?,
        }
        Ok(())
    }

    async fn handle_sim_status(&mut self, status: SimStatus) -> Result<()> {
        // Send Step update to experiment package
        let send_step_update = self
            .experiment_package_comms
            .step_update_sender
            .send(StepUpdate {
                sim_id: status.sim_id,
                was_error: status.error.is_some(),
                stop_signal: status.stop_signal,
            })
            .await
            .map_err(|exp_controller_err| {
                Error::from(format!(
                    "Experiment controller error: {:?}",
                    exp_controller_err
                ))
            });

        if let Err(err) = send_step_update {
            if !status.running || status.stop_signal {
                // non-fatal error if the sim is stopping
                log::debug!(
                    "Failed to send the step update to the experiment package, logging rather \
                     than error as simulation has been marked as ending this step: {}",
                    err.to_string()
                )
            } else {
                return Err(err);
            }
        }

        // Send Sim Status to the orchestration client
        Ok(self
            .orch_client()
            .send(EngineStatus::SimStatus(status))
            .await?)
    }

    async fn handle_sim_run_stop(&mut self, id: SimulationShortId) -> Result<()> {
        Ok(self.orch_client().send(EngineStatus::SimStop(id)).await?)
    }

    async fn handle_worker_pool_controller_msg(
        &mut self,
        id: Option<SimulationShortId>,
        msg: WorkerPoolToExpCtlMsg,
    ) -> Result<()> {
        let engine_status = match msg {
            WorkerPoolToExpCtlMsg::Errors(errors) => {
                log::debug!("Received Errors Experiment Control Message from Worker Pool");
                let runner_errors = errors.into_iter().map(|w| w.into_sendable(false)).collect();
                EngineStatus::Errors(id, runner_errors)
            }
            WorkerPoolToExpCtlMsg::Warnings(warnings) => {
                log::debug!("Received Warnings Experiment Control Message from Worker Pool");
                let runner_warnings = warnings
                    .into_iter()
                    .map(|w| w.into_sendable(true))
                    .collect();
                EngineStatus::Warnings(id, runner_warnings)
            }
        };
        self.orch_client().send(engine_status).await?;
        Ok(())
    }

    async fn start_new_sim_run(
        &mut self,
        sim_short_id: SimulationShortId,
        changed_properties: serde_json::Value,
        max_num_steps: usize,
    ) -> Result<()> {
        let worker_pool_sender = self.worker_pool_send_base.sender_with_sim_id(sim_short_id);

        // Create the `globals.json` for the simulation
        let globals = Arc::new(
            apply_property_changes(
                self.exp_base_config.base_globals.clone(),
                &changed_properties,
            )
            .map_err(|experiment_err| Error::from(experiment_err.to_string()))?,
        );

        // Create the datastore configuration (requires schemas)
        let store_config =
            StoreConfig::new_sim(&self.exp_base_config, &globals, &self.package_creators)?;
        // Create the persistence configuration
        let persistence_config =
            PersistenceConfig::new_sim(&self.exp_base_config, &globals, &self.package_creators)?;
        // Start the persistence service
        let persistence_service = self
            .output_persistence_service_creator
            .new_simulation(sim_short_id, &persistence_config)?;

        // Create the Simulation top level config
        let sim_config = Arc::new(self.sim_configurer.configure_next(
            &self.exp_base_config,
            sim_short_id,
            (*globals).clone(),
            store_config,
            persistence_config,
            max_num_steps,
        )?);

        let task_comms = Comms::new(sim_short_id, worker_pool_sender)?;

        // Create the packages which will be running in the engine
        let (packages, sim_start_msgs) = self
            .package_creators
            .new_packages_for_sim(&sim_config, task_comms.clone())?;

        let datastore_payload = DatastoreSimulationPayload {
            agent_batch_schema: sim_config.sim.store.agent_schema.clone(),
            message_batch_schema: sim_config.sim.store.message_schema.arrow.clone(),
            context_batch_schema: sim_config.sim.store.context_schema.arrow.clone(),
            shared_store: self.shared_store.clone(),
        };
        // Register the new simulation with the worker pool
        self.worker_pool_send
            .send(ExperimentToWorkerPoolMsg::NewSimulationRun(
                NewSimulationRun {
                    short_id: sim_short_id,
                    engine_config: Arc::clone(&sim_config.sim.engine),
                    packages: sim_start_msgs,
                    datastore: datastore_payload,
                    globals: globals.clone(),
                },
            ))
            .await?;

        let sim_controller = SimulationController::new(
            sim_config,
            task_comms,
            packages,
            self.shared_store.clone(),
            persistence_service,
            self.sim_status_send.clone(),
        )
        .map_err(SimulationError::from)?;
        let sim_sender = sim_controller.sender;
        self.add_sim_sender(sim_short_id, sim_sender)?;
        self.sim_run_tasks.new_run(sim_controller.task_handle);

        // Register run with the orchestrator
        self.orch_client()
            .send(EngineStatus::SimStart {
                sim_id: sim_short_id,
                globals: (*globals).clone(),
            })
            .await?;
        Ok(())
    }

    async fn pause_sim_run(&mut self, sim_short_id: SimulationShortId) -> Result<()> {
        self.send_sim(sim_short_id, SimControl::Pause).await?;
        Ok(())
    }

    async fn resume_sim_run(&mut self, sim_short_id: SimulationShortId) -> Result<()> {
        self.send_sim(sim_short_id, SimControl::Resume).await?;
        Ok(())
    }

    async fn stop_sim_run(&mut self, sim_short_id: SimulationShortId) -> Result<()> {
        self.send_sim(sim_short_id, SimControl::Stop).await?;
        Ok(())
    }

    async fn send_sim(&mut self, sim_short_id: SimulationShortId, msg: SimControl) -> Result<()> {
        if let Some(sender) = self.sim_senders.get_mut(&sim_short_id) {
            sender.send(msg).await?;
            Ok(())
        } else {
            Err(Error::from(format!(
                "Simulation with short id {} does not exist",
                sim_short_id
            )))
        }
    }

    pub async fn exp_init_msg_base(&self) -> Result<ExperimentInitRunnerMsgBase> {
        let pkg_start_msgs = self.package_creators.get_worker_exp_start_msgs()?;
        Ok(ExperimentInitRunnerMsgBase {
            experiment_id: (*self.exp_base_config.run_id).clone(),
            shared_context: self.shared_store.clone(),
            package_config: Arc::new(pkg_start_msgs),
        })
    }

    fn add_sim_sender(
        &mut self,
        sim_short_id: SimulationShortId,
        sender: SimCtlSend,
    ) -> Result<()> {
        if self.sim_senders.contains_key(&sim_short_id) {
            let msg = "Cannot mutate a simulation control msg sender";
            log::error!("{}, sim short id: {}", msg, sim_short_id);
            return Err(Error::from(msg));
        }
        self.sim_senders.insert(sim_short_id, sender);
        Ok(())
    }

    fn orch_client(&mut self) -> &mut OrchClient {
        &mut self.env.orch_client
    }
}

impl<P: OutputPersistenceCreatorRepr> ExperimentController<P> {
    pub async fn run(mut self) -> Result<()> {
        let mut terminate_recv = self.terminate_recv.take_recv()?;
        loop {
            tokio::select! {
                Some(msg) = self.experiment_package_comms.ctl_recv.recv() => {
                    log::debug!("Handling experiment control message: {:?}", &msg);
                    self.handle_experiment_control_msg(msg).await?;
                }
                result = self.sim_run_tasks.next() => {
                    if let Some(result) = result.map_err(|_| Error::from("Couldn't join `sim_run_tasks.next()`"))? {
                        self.handle_sim_run_stop(result?).await?;
                    }
                }
                Some(msg) = self.sim_status_recv.recv() => {
                    self.handle_sim_status(msg).await?;
                }
                msg = self.worker_pool_controller_recv.recv() => {
                    if let Some((id, msg)) = msg {
                        self.handle_worker_pool_controller_msg(id, msg).await?;
                    }
                }
                Ok(msg) = self.env.orch_listener.recv::<EngineMsg>() => {
                    self.handle_orch_msg(msg).await?;
                }
                terminate_res = &mut terminate_recv => {
                    terminate_res.map_err(|err| Error::from(format!("Couldn't receive terminate: {:?}", err)))?;
                    log::debug!("Stopping experiment controller");
                    return Ok(())
                }
            }
        }
    }
}

#[allow(clippy::too_many_arguments)]
impl<P: OutputPersistenceCreatorRepr> ExperimentController<P> {
    pub fn new(
        exp_config: Arc<ExperimentConfig>,
        exp_base_config: Arc<ExperimentConfig>,
        env: Environment,
        shared_store: Arc<SharedStore>,
        worker_pool_send: ExpMsgSend,
        worker_pool_controller_recv: WorkerPoolMsgRecv,
        experiment_package_comms: ExperimentPackageComms,
        output_persistence_service_creator: P,
        worker_pool_send_base: workerpool::comms::main::MainMsgSendBase,
        package_creators: PackageCreators,
        sim_id_store: SimIdStore,
        sim_configurer: SimConfigurer,
        sim_status_send: SimStatusSend,
        sim_status_recv: SimStatusRecv,
        terminate_recv: TerminateRecv,
    ) -> Self {
        ExperimentController {
            _exp_config: exp_config,
            exp_base_config,
            env,
            shared_store,
            worker_pool_send,
            worker_pool_controller_recv,
            experiment_package_comms,
            output_persistence_service_creator,
            sim_run_tasks: Default::default(),
            sim_senders: Default::default(),
            worker_pool_send_base,
            package_creators,
            sim_id_store,
            sim_configurer,
            sim_status_send,
            sim_status_recv,
            terminate_recv,
        }
    }
}