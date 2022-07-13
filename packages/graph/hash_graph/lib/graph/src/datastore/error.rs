use std::fmt;

use error_stack::Context;

#[derive(Debug)]
#[must_use]
pub struct InsertionError;

impl fmt::Display for InsertionError {
    fn fmt(&self, fmt: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt.write_str("Could not insert into datastore")
    }
}

impl Context for InsertionError {}

#[derive(Debug)]
#[must_use]
pub struct QueryError;

impl fmt::Display for QueryError {
    fn fmt(&self, fmt: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt.write_str("Could not query from datastore")
    }
}

impl Context for QueryError {}

#[derive(Debug)]
#[must_use]
pub struct UpdateError;

impl fmt::Display for UpdateError {
    fn fmt(&self, fmt: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt.write_str("Could not update datastore")
    }
}

impl Context for UpdateError {}

#[derive(Debug)]
#[must_use]
pub struct BaseUriAlreadyExists;

impl fmt::Display for BaseUriAlreadyExists {
    fn fmt(&self, fmt: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt.write_str("tried to insert a new base URI but it already existed")
    }
}

impl Context for BaseUriAlreadyExists {}

#[derive(Debug)]
#[must_use]
pub struct BaseUriDoesNotExist;

impl fmt::Display for BaseUriDoesNotExist {
    fn fmt(&self, fmt: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt.write_str("base URI does not exist")
    }
}

impl Context for BaseUriDoesNotExist {}

#[derive(Debug)]
#[must_use]
pub struct VersionedUriAlreadyExists;

impl fmt::Display for VersionedUriAlreadyExists {
    fn fmt(&self, fmt: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt.write_str("tried to insert a versioned URI but it already existed")
    }
}

impl Context for VersionedUriAlreadyExists {}