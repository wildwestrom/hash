import { MutationCreatePageArgs, ResolverFn } from "../../apiTypes.gen";
import { LoggedInGraphQLContext } from "../../context";
import { Page, UnresolvedGQLEntity } from "../../../model";

export const createPage: ResolverFn<
  Promise<UnresolvedGQLEntity>,
  {},
  LoggedInGraphQLContext,
  MutationCreatePageArgs
> = async (_, { accountId, properties }, { dataSources: { db }, user }) => {
  const page = await Page.createPage(db, {
    accountId,
    createdBy: user,
    properties,
  });

  return page.toGQLUnknownEntity();
};
