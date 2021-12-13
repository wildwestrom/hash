use std::fmt::{Debug, Formatter};

use serde::{Deserialize, Serialize};
use serde_json::Value as SerdeValue;

use crate::{config::Globals, hash_types::worker::RunnerError, simulation::status::SimStatus};

pub type SerdeMap = serde_json::Map<String, SerdeValue>;

pub type ExperimentRegisteredId = String;
pub type SimulationRegisteredId = String;
pub type SimulationShortId = u32;

use crate::simulation::enum_dispatch::*;

/// The message type sent from the engine to the orchestrator.
#[derive(Serialize, Deserialize, Debug)]
pub struct OrchestratorMsg {
    pub experiment_id: String,
    pub body: EngineStatus,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub enum EngineStatus {
    Started,
    SimStatus(SimStatus),
    Exit,
    ProcessError(String),
    Stopping,
    SimStart {
        sim_id: SimulationShortId,
        globals: Globals,
    },
    SimStop(SimulationShortId),
    // TODO: OS - Confirm are these only Runner/Simulation errors, if so rename
    Errors(Option<SimulationShortId>, Vec<RunnerError>),
    Warnings(Option<SimulationShortId>, Vec<RunnerError>),
}

/// The message type sent from the orchestrator to the engine.
#[derive(Serialize, Deserialize, Debug)]
pub enum EngineMsg {
    Init(InitMessage),
    SimRegistered(SimulationShortId, SimulationRegisteredId),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InitMessage {
    pub experiment: ExperimentRunRepr,
    pub env: ExecutionEnvironment,
    pub dyn_payloads: serde_json::Map<String, serde_json::Value>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ExecutionEnvironment {
    Local { port: u16 },
    Staging,
    Production,
    None,
}

impl Default for ExecutionEnvironment {
    fn default() -> Self {
        ExecutionEnvironment::None
    }
}

impl EngineStatus {
    pub fn kind(&self) -> &'static str {
        match self {
            EngineStatus::Started => "Started",
            EngineStatus::SimStatus(_) => "SimStatus",
            EngineStatus::Exit => "Exit",
            EngineStatus::ProcessError(_) => "ProcessError",
            EngineStatus::Stopping => "Stopping",
            EngineStatus::SimStart {
                sim_id: _,
                globals: _,
            } => "SimStart",
            EngineStatus::SimStop(_) => "SimStop",
            EngineStatus::Errors(..) => "Errors",
            EngineStatus::Warnings(..) => "Warnings",
        }
    }
}

#[derive(Deserialize, Serialize, Clone)]
pub struct SharedDataset {
    pub name: Option<String>,
    pub shortname: String,
    pub filename: String,
    pub url: Option<String>,
    /// Whether the downloadable dataset is a csv
    pub raw_csv: bool,
    pub data: Option<String>,
}

impl Debug for SharedDataset {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SharedDataset")
            .field("name", &self.name)
            .field("shortname", &self.shortname)
            .field("filename", &self.filename)
            .field("url", &self.url)
            .field("raw_csv", &self.raw_csv)
            .field("data", &CleanOption(&self.data))
            .finish()
    }
}

// #[derive(Deserialize, Serialize, Debug, Clone)]
pub struct FetchedDataset {
    pub name: Option<String>,
    pub shortname: String,
    pub filename: String,
    pub contents: String,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct SharedBehavior {
    /// This is the unique identifier (also the file/path) that, in the case of Cloud runs, is used
    /// by the HASH API
    pub id: String,
    /// This is the full name of the file (can be used to refer to the behavior).
    /// It is often the case that self.id = self.name (except sometimes for dependencies by
    /// `@hash`).
    pub name: String,
    /// These are alternative representations on how one can refer to this behavior
    pub shortnames: Vec<String>,
    pub behavior_src: Option<String>, // Source code for the behaviors
    pub behavior_keys_src: Option<String>, // Behavior key definition for this behavior
}

impl Debug for SharedBehavior {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SharedBehavior")
            .field("id", &self.id)
            .field("name", &self.name)
            .field("shortnames", &self.shortnames)
            .field("behavior_src", &CleanOption(&self.behavior_src))
            .field("behavior_keys_src", &CleanOption(&self.behavior_keys_src))
            .finish()
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct SimPackageArgs {
    pub name: String,
    pub data: serde_json::Value,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub enum InitialStateName {
    InitJson,
    InitPy,
    InitJs,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct InitialState {
    pub name: InitialStateName,
    pub src: String,
}

/// Analogous to `SimulationSrc` in the web editor
/// This contains all of the source code for a specific simulation, including
/// initial state source, analysis source, experiment source, properties source (globals.json),
/// dependencies source and the source for all running behaviors
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ProjectBase {
    pub initial_state: InitialState,
    pub globals_src: String,
    pub dependencies_src: Option<String>,
    pub experiments_src: Option<String>,
    pub behaviors: Vec<SharedBehavior>,
    pub datasets: Vec<SharedDataset>,
    pub packages: Vec<SimPackageArgs>,
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
pub struct PackageDataField {
    pub name: String,
    /// Discrete values to explore
    pub values: Option<Vec<serde_json::Value>>,
    /// A range of values to explore
    pub range: Option<String>,
}

#[derive(Eq, PartialEq, Debug, Clone)]
pub enum MetricObjective {
    Max,
    Min,
    Other(String),
}

impl Serialize for MetricObjective {
    fn serialize<S: serde::Serializer>(&self, ser: S) -> std::result::Result<S::Ok, S::Error> {
        ser.serialize_str(match self {
            MetricObjective::Max => "max",
            MetricObjective::Min => "min",
            MetricObjective::Other(s) => s,
        })
    }
}

impl<'de> Deserialize<'de> for MetricObjective {
    fn deserialize<D: ::serde::Deserializer<'de>>(
        deserializer: D,
    ) -> std::result::Result<Self, D::Error> {
        let s = <String>::deserialize(deserializer)?;
        match s.as_str() {
            "max" => Ok(MetricObjective::Max),
            "min" => Ok(MetricObjective::Min),
            _ => Ok(MetricObjective::Other(s)),
        }
    }
}

#[derive(Serialize, Deserialize, Eq, PartialEq, Debug, Clone)]
pub struct SimpleExperimentConfig {
    /// The experiment name
    pub experiment_name: String,
    /// The properties changed for each simulation run
    #[serde(rename = "changedProperties")]
    pub changed_properties: Vec<SerdeValue>,
    /// Number of steps each run should go for
    #[serde(rename = "numSteps")]
    pub num_steps: usize,
}

#[derive(Serialize, Deserialize, Eq, PartialEq, Debug, Clone)]
pub struct SingleRunExperimentConfig {
    /// Number of steps the run should go for
    #[serde(rename = "numSteps")]
    pub num_steps: usize,
}

#[derive(Serialize, Deserialize, Eq, PartialEq, Debug, Clone)]
pub struct OptimizationExperimentConfigPayload {
    /// The metric to optimize for
    #[serde(rename = "metricName")]
    pub metric_name: Option<String>,
    /// The objective for the metric
    #[serde(rename = "metricObjective")]
    pub metric_objective: Option<MetricObjective>,
    /// The maximum number of runs to try in an experiment
    #[serde(rename = "maxRuns")]
    pub max_runs: Option<i64>,
    /// The maximum number of steps a run should go for
    #[serde(rename = "maxSteps")]
    pub max_steps: Option<i64>,
    /// The minimum number of steps a run should go for
    #[serde(rename = "minSteps")]
    pub min_steps: Option<i64>,
    /// The fields to explore as hyperparameters
    pub fields: Option<Vec<PackageDataField>>,
    /// Combinations of parameter values to use for the first runs
    #[serde(rename = "initialPoints")]
    pub initial_points: Option<Vec<SerdeValue>>,
}

#[derive(Serialize, Deserialize, Eq, PartialEq, Debug, Clone)]
pub struct OptimizationExperimentConfig {
    /// The experiment name
    pub experiment_name: String,
    pub payload: OptimizationExperimentConfigPayload,
    /// Number of simulation runs that are to be run in parallel
    pub num_parallel_runs: usize,
}

#[derive(Serialize, Eq, PartialEq, Debug, Clone)]
pub enum PackageConfig<'a> {
    EmptyPackageConfig,
    ExperimentPackageConfig(&'a ExperimentPackageConfig),
    ExtendedExperimentPackageConfig(&'a ExtendedExperimentPackageConfig),
}

#[derive(Serialize, Deserialize, Eq, PartialEq, Debug, Clone)]
pub enum ExperimentPackageConfig {
    Simple(SimpleExperimentConfig),
    SingleRun(SingleRunExperimentConfig),
}

#[derive(Serialize, Deserialize, Eq, PartialEq, Debug, Clone)]
pub enum ExtendedExperimentPackageConfig {
    Basic(ExperimentPackageConfig),
    Optimization(OptimizationExperimentConfig),
}

#[enum_dispatch(ExperimentRunTrait)]
#[derive(Clone, Serialize, Deserialize, Debug)]
pub enum ExperimentRunRepr {
    ExperimentRunBase,
    ExperimentRun,
    ExtendedExperimentRun,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ExperimentRunBase {
    pub id: ExperimentRegisteredId,
    pub project_base: ProjectBase,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ExperimentRun {
    pub base: ExperimentRunBase,
    pub package_config: ExperimentPackageConfig,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ExtendedExperimentRun {
    pub base: ExperimentRunBase,
    pub package_config: ExtendedExperimentPackageConfig,
}

#[enum_dispatch]
pub trait ExperimentRunTrait: Clone + for<'a> Deserialize<'a> + Serialize {
    fn base(&self) -> &ExperimentRunBase;
    fn base_mut(&mut self) -> &mut ExperimentRunBase;
    fn package_config(&self) -> PackageConfig<'_>;
}

impl ExperimentRunTrait for ExperimentRunBase {
    fn base(&self) -> &ExperimentRunBase {
        self
    }

    fn base_mut(&mut self) -> &mut ExperimentRunBase {
        self
    }

    fn package_config(&self) -> PackageConfig<'_> {
        PackageConfig::EmptyPackageConfig
    }
}

impl ExperimentRunTrait for ExperimentRun {
    fn base(&self) -> &ExperimentRunBase {
        &self.base
    }

    fn base_mut(&mut self) -> &mut ExperimentRunBase {
        &mut self.base
    }

    fn package_config(&self) -> PackageConfig<'_> {
        PackageConfig::ExperimentPackageConfig(&self.package_config)
    }
}

impl ExperimentRunTrait for ExtendedExperimentRun {
    fn base(&self) -> &ExperimentRunBase {
        &self.base
    }

    fn base_mut(&mut self) -> &mut ExperimentRunBase {
        &mut self.base
    }

    fn package_config(&self) -> PackageConfig<'_> {
        PackageConfig::ExtendedExperimentPackageConfig(&self.package_config)
    }
}

impl<E: ExperimentRunTrait> From<&E> for ExperimentRunBase {
    fn from(value: &E) -> Self {
        value.base().clone()
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ProcessedExperimentRun {
    pub experiment: ExperimentRun,
    /// The compute usage when the user initialized the run
    /// This is only valid at the start of the run
    pub compute_usage_remaining: i64,
}

// TODO: Replace with UUID?
pub type ExperimentId = String;

/// A wrapper around an Option to avoid displaying the inner for Debug outputs,
/// i.e. debug::Debug now outputs: `Some(..)`
struct CleanOption<'a, T>(&'a Option<T>);

impl<T> Debug for CleanOption<'_, T> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self.0 {
            Some(_) => f.write_str("Some(..)"),
            None => f.write_str("None"),
        }
    }
}