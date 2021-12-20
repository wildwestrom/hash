import argparse
import subprocess
import re
import json
import pprint
from enum import Enum
from textwrap import dedent
from pathlib import Path

from typing import List


class Result(Enum):
    FAIL = 0,
    SUCCESS = 1


class CompletedExperiment:
    def __init__(self, res: Result, output_folders: List[Path]):
        self.res = res
        self.output_folders = output_folders

    def __repr__(self):
        return f"CompletedExperiment(res: {self.res}, output_folders: {self.output_folders})"

    def __str__(self):
        return dedent(f"""
        CompletedExperiment(" \
            res: {self.res}" \
            output_folders: {self.output_folders}" \
        """)


def main(project_paths: List[Path], run_all_experiments: bool, cli_args: List[str], cli_run_override: Path):
    # make sure it's built
    build = subprocess.run(['cargo', 'build', '--release'])
    if build.returncode != 0:
        raise Exception("Cargo build failed")

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
                print(f"stderr: \n{process.stderr.decode()}")
                experiment_runs[experiment_name] = Result.FAIL

            else:
                print(f"Running Experiment succeeded")
                try:
                    experiment_id_patt = re.compile(r'Running experiment (\S*)', re.MULTILINE)
                    experiment_id = experiment_id_patt.search(stderr).group(1)
                except Exception as err:
                    print(f"Couldn't extract ExperimentId for {run_cmd}: {err}")
                    return

                try:
                    output_dir_patt = re.compile(r'Making new output directory directory: (\S*)', re.MULTILINE)
                    output_paths = [Path(match) for match in output_dir_patt.findall(stderr)]
                except Exception as err:
                    print(f"Couldn't extract Output paths for {run_cmd}: {err}")
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
    sim_results = main(project_paths=args.project_paths, run_all_experiments=args.run_all_experiments,
                       cli_args=args.cli_args, cli_run_override=args.cli_bin)

    pprint.pprint(sim_results)
