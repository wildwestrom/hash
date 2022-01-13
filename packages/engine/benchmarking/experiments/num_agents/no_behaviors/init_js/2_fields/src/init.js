const init = (context) => {
  const globals = context.globals();

  return [...new Array(globals.num_agents).keys()].map((_) => ({
    field_1: 0,
    field_2: 0
  }));
};
