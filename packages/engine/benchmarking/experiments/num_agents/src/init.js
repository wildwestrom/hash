const init = (context) => {
    const globals = context.globals();

    return [...new Array(globals.num_agents).keys()].map(_ => ({
        age: 0
    }))
}