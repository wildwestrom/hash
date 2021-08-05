import { useMutation } from "@apollo/client";

import { BlockProtocolCreateFn } from "@hashintel/block-protocol";
import { createEntity } from "../../../graphql/queries/entity.queries";
import { useCallback } from "react";
import {
  CreateEntityMutation,
  CreateEntityMutationVariables,
} from "../../../graphql/apiTypes.gen";

export const useBlockProtocolCreate = (): {
  create: BlockProtocolCreateFn;
  createLoading: boolean;
  createError: any;
} => {
  const [createFn, { loading: createLoading, error: createError }] =
    useMutation<CreateEntityMutation, CreateEntityMutationVariables>(
      createEntity
    );

  const create: BlockProtocolCreateFn = useCallback((actions) => {
    for (const action of actions) {
      createFn({
        variables: {
          properties: action.data,
          type: action.entityType,
          accountId: action.pageAccountId,
          createdById: action.userId,
        },
      });
    }
  }, []);

  return {
    create,
    createLoading,
    createError,
  };
};
