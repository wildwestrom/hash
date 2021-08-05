import { ApolloError } from "apollo-server-express";

import { QueryPageArgs, Resolver, Visibility } from "../../apiTypes.gen";
import { DbPage } from "../../../types/dbTypes";
import { GraphQLContext } from "../../context";
import { entity } from "../entity/";

export const page: Resolver<
  Promise<DbPage>,
  {},
  GraphQLContext,
  QueryPageArgs
> = async (_, args, ctx, info) => {
  const ent = await entity({}, args, ctx, info);
  if (ent.type !== "Page") {
    throw new ApolloError(`Entity ${ent.id} is type "${ent.type}" not "Page"`);
  }

  // TODO: get visibility from entity metadata
  return {
    ...ent,
    visibility: Visibility.Public,
  } as DbPage;
};
