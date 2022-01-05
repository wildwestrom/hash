const init = (context) => {
    const globals = context.globals();

    throw new Error("Number of agents: "+ globals.num_agents)
    return [... new Array(globals.num_agents.map(_ => ({
        age: 0
    }))) + { age: 1 }]
}