[![crates.io](https://img.shields.io/crates/v/error-stack)][crates.io]
[![documentation](https://img.shields.io/docsrs/error-stack)][documentation]
[![license](https://img.shields.io/crates/l/error-stack)][license]

[crates.io]: https://crates.io/crates/error-stack
[documentation]: https://docs.rs/error-stack
[license]: ./LICENSE.md

# `error-stack` -- A context-aware error library with abritrary attached user data

Also check out our [Announcement Post] for `error-stack`!

[announcement post]: https://hash.dev/###

`error-stack` is an error-handling library centered around the idea of building a `Report` of the error as it propagates:

```rust
use std::fmt;

use error_stack::{Context, IntoReport, Report, Result, ResultExt};

#[derive(Debug)]
struct ParseExperimentError;

impl fmt::Display for ParseExperimentError {
    fn fmt(&self, fmt: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt.write_str("invalid experiment description")
    }
}

impl Context for ParseExperimentError {}

fn parse_experiment(description: &str) -> Result<(u64, u64), ParseExperimentError> {
    let value = description
        .parse()
        .report()
        .attach_printable_lazy(|| format!("{description:?} could not be parsed as experiment"))
        .change_context(ParseExperimentError)?;

    Ok((value, 2 * value))
}

#[derive(Debug)]
struct ExperimentError;

impl fmt::Display for ExperimentError {
    fn fmt(&self, fmt: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt.write_str("Experiment error: Could not run experiment")
    }
}

impl Context for ExperimentError {}

fn start_experiments(
    experiment_ids: &[usize],
    experiment_descriptions: &[&str],
) -> Result<Vec<u64>, ExperimentError> {
    let experiments = experiment_ids
        .iter()
        .map(|exp_id| {
            let description = experiment_descriptions.get(*exp_id).ok_or_else(|| {
                Report::new(ExperimentError)
                    .attach_printable(format!("Experiment {exp_id} has no valid description"))
            })?;

            let experiment = parse_experiment(description)
                .attach_printable(format!("Experiment {exp_id} could not be parsed"))
                .change_context(ExperimentError)?;

            Ok(move || experiment.0 * experiment.1)
        })
        .collect::<Result<Vec<_>, ExperimentError>>()
        .attach_printable("Unable to setup experiments")?;

    Ok(experiments.iter().map(|experiment| experiment()).collect())
}

fn main() -> Result<(), ExperimentError> {
    let experiment_ids = &[0, 2];
    let experiment_descriptions = &["10", "20", "3o"];
    start_experiments(experiment_ids, experiment_descriptions)?;

    Ok(())
}
```

This will most likely result in an error and print

```text
Error: Experiment error: Could not run experiment
             at examples/demo.rs:54:18
      - Unable to setup experiments

Caused by:
   0: invalid experiment description
             at examples/demo.rs:24:10
      - Experiment 2 could not be parsed
   1: invalid digit found in string
             at examples/demo.rs:22:10
      - "3o" could not be parsed as experiment

```

Please see the [documentation] for a full description.