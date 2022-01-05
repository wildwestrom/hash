import argparse
import subprocess
import re
import json
import pprint
from enum import Enum
from textwrap import dedent
from pathlib import Path
from typing import List

import psutil

class Result(Enum):
    FAIL = 0,
    SUCCESS = 1


class CompletedExperiment:
    def __init__(self, res: Result, output_folders: List[Path], time_to_completion:):
        self.res = res
        self.output_folders = output_folders
        self.time_to_completion = 

    def __repr__(self):
        return f"CompletedExperiment(res: {self.res}, output_folders: {self.output_folders})"

    def __str__(self):
        return dedent(f"""
        CompletedExperiment(" 
            res: {self.res}" 
            output_folders: {self.output_folders}" 
        """)

# https://stackoverflow.com/questions/13607391/subprocess-memory-usage-in-python
class ProcessTimer:
    def __init__(self,command):
        self.command = command
        self.execution_state = False

    def execute(self):
        self.max_vms_memory = 0
        self.max_rss_memory = 0
        
        self.t1 = None
        self.t0 = time.time()
        self.p = subprocess.Popen(self.command, 
                                  stdout=subprocess.PIPE, 
                                  stderr=subprocess.PIPE
                                  shell=False
                                 )
        self.execution_state = True

    def poll(self):
        if not self.check_execution_state():
            return False

        self.t1 = time.time()

        try:
            pp = psutil.Process(self.p.pid)

            #obtain a list of the subprocess and all its descendants
            descendants = list(pp.get_children(recursive=True))
            descendants = descendants + [pp]

            rss_memory = 0
            vms_memory = 0

            #calculate and sum up the memory of the subprocess and all its descendants 
            for descendant in descendants:
                try:
                    mem_info = descendant.get_memory_info()

                    rss_memory += mem_info[0]
                    vms_memory += mem_info[1]
                except psutil.error.NoSuchProcess:
                    #sometimes a subprocess descendant will have terminated between the time
                    # we obtain a list of descendants, and the time we actually poll this
                    # descendant's memory usage.
                    pass
            self.max_vms_memory = max(self.max_vms_memory,vms_memory)
            self.max_rss_memory = max(self.max_rss_memory,rss_memory)

        except psutil.error.NoSuchProcess:
            return self.check_execution_state()
    
        return self.check_execution_state()


    def is_running(self):
        return psutil.pid_exists(self.p.pid) and self.p.poll() == None
    def check_execution_state(self):
        if not self.execution_state:
            return False
        if self.is_running():
            return True
        self.executation_state = False
        self.t1 = time.time()
        return False

    def close(self, kill=False):
        stdout = p.stdout.decode()
        stderr = p.stderr.decode()
        try:
            pp = psutil.Process(self.p.pid)
            if kill:
                pp.kill()
            else:
                pp.terminate()
        except psutil.error.NoSuchProcess:
            pass
        
        return (stdout, stderr)

def run_experiments(project_paths: List[Path], run_all_experiments: bool, cli_run_override: Path, build_args: List[str] = [], cli_args: List[str] = [], continue_on_fail=False):
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
            process = subprocess.run(run_cmd, capture_output=True)
            stdout = process.stdout.decode()
            stderr = process.stderr.decode()
            
            if process.returncode != 0:
                print(f"Running Experiment failed:")
                print(f"stdout: \n{stdout}")
                print(f"stderr: \n{stderr}")
                experiment_runs[experiment_name] = CompletedExperiment(Result.FAIL, [])
                
                if not continue_on_fail:
                    break

            else:
                print(f"Running Experiment succeeded")
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
                except Exception as err:
                    print(f"Couldn't extract Output paths for {run_cmd}: {err}")
                    print(f"stdout: \n{stdout}")
                    print(f"stderr: \n{stderr}")
                    return

                experiment_runs[experiment_id] = CompletedExperiment(Result.SUCCESS, output_paths)

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
    parser.add_argument('cli_args', nargs="*", type=str, default=[],
                        help=dedent(
                            """A space-separated list of (quoted) arguments to pass to the engine. 
                            E.g. `-- single-run --num-steps 10`"""
                        ))

    args = parser.parse_args()
    sim_results = run_experiments(project_paths=args.project_paths, run_all_experiments=args.run_all_experiments,
                       cli_args=args.cli_args, cli_run_override=args.cli_bin)

    pprint.pprint(sim_results)
