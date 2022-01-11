import argparse
import subprocess
import re
import json
import pprint
import time
from enum import Enum
from textwrap import dedent
from pathlib import Path
from typing import List

import psutil

class Result(Enum):
    FAIL = 0,
    SUCCESS = 1


class CompletedExperiment:
    def __init__(self, res: Result, output_folders: List[Path], time_to_completion: float, max_vms_memory: float,
                 max_rss_memory: float, max_shared_memory: float, max_uss_memory: float):
        self.res = res
        self.output_folders = output_folders
        self.time_to_completion = time_to_completion
        self.max_vms_memory = max_vms_memory
        self.max_rss_memory = max_rss_memory
        self.max_shared_memory = max_shared_memory
        self.max_uss_memory = max_uss_memory

    def __repr__(self):
        return f"CompletedExperiment(res: {self.res}, output_folders: {self.output_folders}, " + \
               f"completion_time: {self.time_to_completion}, max_vms_memory: {self.max_vms_memory}, " + \
               f"max_rss_memory: {self.max_rss_memory}, max_shared_memory: {self.max_shared_memory}, " + \
               f"max_uss_memory: {self.max_uss_memory})"

    def __str__(self):
        return dedent(f"""
        CompletedExperiment( 
            res: {self.res} 
            output_folders: {self.output_folders} 
            completion_time: {self.time_to_completion}
            max_vms_memory: {self.max_vms_memory}
            max_rss_memory: {self.max_rss_memory}
            max_shared_memory: {self.max_shared_memory}
            max_uss_memory: {self.max_uss_memory}
        """)


# https://stackoverflow.com/questions/13607391/subprocess-memory-usage-in-python
class ProcessTimer:
    def __init__(self, command):
        self.command = command
        self.execution_state = False
        self.max_vms_memory = None
        self.max_rss_memory = None
        self.max_shared_memory = None
        self.max_uss_memory = None
        self.t0 = None
        self.t1 = None
        self.p = None
        self.execution_state = False

    def execute(self):
        self.max_vms_memory = 0
        self.max_rss_memory = 0
        self.max_shared_memory = 0
        self.max_uss_memory = 0

        self.t1 = None
        self.t0 = time.time()
        self.p = subprocess.Popen(self.command,
                                  stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE,
                                  shell=False
                                  )
        self.execution_state = True

    def poll(self):
        if not self.check_execution_state():
            return False

        self.t1 = time.time()

        try:
            pp = psutil.Process(self.p.pid)

            # obtain a list of the subprocess and all its descendants
            descendants = list(pp.children(recursive=True))
            descendants = descendants + [pp]

            rss_memory = 0
            vms_memory = 0
            shared_memory = 0
            uss_memory = 0

            # calculate and sum up the memory of the subprocess and all its descendants
            for descendant in descendants:
                try:
                    # todo memory_full_info
                    mem_info = descendant.memory_full_info()
                    # mem_info = descendant.memory_info()

                    rss_memory += mem_info.rss
                    vms_memory += mem_info.vms
                    try:  # only works on linux
                        shared_memory += mem_info.shared
                        uss_memory += mem_info.uss
                    except AttributeError:
                        shared_memory = None
                except psutil.NoSuchProcess:
                    # sometimes a subprocess descendant will have terminated between the time
                    # we obtain a list of descendants, and the time we actually poll this
                    # descendant's memory usage.
                    pass
            self.max_vms_memory = max(self.max_vms_memory, vms_memory)
            self.max_rss_memory = max(self.max_rss_memory, rss_memory)
            if shared_memory is not None:
                self.max_shared_memory = max(self.max_shared_memory, shared_memory)
            else:
                self.max_shared_memory = None
            if uss_memory is not None:
                self.max_uss_memory = max(self.max_uss_memory, uss_memory)
            else:
                self.max_uss_memory = None

        except psutil.NoSuchProcess:
            return self.check_execution_state()

        return self.check_execution_state()

    def is_running(self):
        return psutil.pid_exists(self.p.pid) and self.p.poll() is None

    def check_execution_state(self):
        if not self.execution_state:
            return False
        if self.is_running():
            return True
        self.execution_state = False
        self.t1 = time.time()
        return False

    def close(self, kill=False):
        try:
            pp = psutil.Process(self.p.pid)
            if kill:
                pp.kill()
            else:
                pp.terminate()
        except psutil.NoSuchProcess:
            pass


def run_experiments(project_paths: List[Path], run_all_experiments: bool, cli_run_override: Path,
                    build_args: List[str] = [], cli_args: List[str] = [], continue_on_fail=False):
    # make sure it's built
    build_cmd = ['cargo', 'build', '--release'] + build_args
    build = subprocess.run(build_cmd)
    if build.returncode != 0:
        raise Exception(f"Cargo build failed, cmd: {build_cmd}")

    if cli_run_override:
        base_run_cmd = [str(cli_run_override), '-p']
    else:
        base_run_cmd = ['cargo', 'run', '--release', '--bin', 'cli', '--', '-p']

    results = {}
    for project_path in project_paths:
        project_path_str = str(project_path)

        if run_all_experiments:
            experiments_json = json.loads((project_path / 'experiments.json').read_bytes())
            experiment_names = list(experiments_json.keys())
            # TODO: this is super clumsy, need to figure out a better way, maybe it shouldn't be in experiments.json
            if "max_sims_in_parallel" in experiment_names:
                experiment_names.remove("max_sims_in_parallel")

            if len(experiment_names) > 0:
                print(f"Found the following experiments in {project_path}: {experiment_names}")
                run_cmds = [(experiment_name,
                             (base_run_cmd + [project_path_str, 'simple', '--experiment-name',
                                              experiment_name] + cli_args))
                            for experiment_name in experiment_names]
            else:
                print(f"No experiments were found in {project_path}")
                run_cmds = []

        else:
            run_cmds = [('single-run', base_run_cmd + [project_path_str] + cli_args)]

        experiment_runs = {}

        for (experiment_name, run_cmd) in run_cmds:
            print(f"Running Experiment with cmd: {' '.join(run_cmd)}")

            process_timer = ProcessTimer(run_cmd)

            try:
                process_timer.execute()
                # poll as often as possible; otherwise the subprocess might
                # "sneak" in some extra memory usage while you aren't looking
                while process_timer.poll():
                    time.sleep(.1)
            finally:
                # make sure that we don't leave the process dangling
                process_timer.close()

            stdout = process_timer.p.stdout.read().decode()
            stderr = process_timer.p.stderr.read().decode()
            time_taken = process_timer.t1 - process_timer.t0
            return_code = process_timer.p.returncode

            print(f"Time taken: {time_taken}")
            print(f"max_vms_memory: {process_timer.max_vms_memory}")
            print(f"max_rss_memory: {process_timer.max_rss_memory}")

            if return_code != 0:
                print(f"Running Experiment failed:")
                print(f"stdout: \n{stdout}")
                print(f"stderr: \n{stderr}")
                experiment_runs[experiment_name] = CompletedExperiment(Result.FAIL, [], time_taken,
                                                                       process_timer.max_vms_memory,
                                                                       process_timer.max_rss_memory,
                                                                       process_timer.max_shared_memory,
                                                                       process_timer.max_uss_memory)

                if not continue_on_fail:
                    break

            else:
                print(f"Running Experiment finished")
                try:
                    experiment_id_patt = re.compile(r'Running experiment (( |\S)*)', re.MULTILINE)
                    experiment_id = experiment_id_patt.search(stderr).group(1)
                except Exception as err:
                    print(f"Couldn't extract ExperimentId for {run_cmd}: {err}")
                    print(f"stdout: \n{stdout}")
                    print(f"stderr: \n{stderr}")
                    return

                try:
                    output_dir_patt = re.compile(r'Making new output directory directory: (( |\S)*)', re.MULTILINE)
                    output_paths = [Path(match[0].strip('"')) for match in output_dir_patt.findall(stderr)]
                    if len(output_paths) == 0:
                        raise Exception("No output paths were found")
                except Exception as err:
                    print(f"Couldn't extract Output paths for {run_cmd}: {err}")
                    print(f"stdout: \n{stdout}")
                    print(f"stderr: \n{stderr}")
                    return

                experiment_runs[experiment_id] = CompletedExperiment(Result.SUCCESS, output_paths, time_taken,
                                                                     process_timer.max_vms_memory,
                                                                     process_timer.max_rss_memory,
                                                                     process_timer.max_shared_memory,
                                                                     process_timer.max_uss_memory)

            results[project_path_str] = experiment_runs

        return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='TODO')  # todo
    parser.add_argument('--project-paths', nargs="*", type=Path, required=True,
                        help=dedent(
                            """A space-separated list of paths to experiment projects. 
                            E.g. `--project-paths "./project1" "/users/Foo/home/project2"`"""
                        ))
    parser.add_argument('--run-all-experiments', action='store_true',
                        help=dedent(
                            """When enabled, explores each project directory and parses the `experiments.json`, running 
                            all experiments"""
                        ))
    parser.add_argument('--cli-bin', type=Path,
                        help=dedent(
                            """Path to the CLI executable binary, if not provided it defaults to using: \
                            `cargo run --release --bin cli`"""
                        ))
    parser.add_argument('--no-default-features', action='store_true',
                        help=dedent(
                            """Whether or not to cargo build with default features"""
                        ))
    parser.add_argument('cli_args', nargs="*", type=str, default=[],
                        help=dedent(
                            """A space-separated list of (quoted) arguments to pass to the engine. 
                            E.g. `-- single-run --num-steps 10`"""
                        ))

    args = parser.parse_args()
    sim_results = run_experiments(project_paths=args.project_paths, run_all_experiments=args.run_all_experiments,
                                  build_args=['--no-default-features'] if args.no_default_features else [],
                                  cli_args=args.cli_args, cli_run_override=args.cli_bin)

    pprint.pprint(sim_results)
