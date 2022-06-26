import {
  BlockProtocolAggregateEntityTypesFunction,
  BlockProtocolEntityType,
} from "blockprotocol";
import { uniqBy } from "lodash";
import { BlockState } from "./state";

export const getEntityTypes = (
  aggregateEntityTypes: BlockProtocolAggregateEntityTypesFunction,
  accountId: string | null | undefined,
  numPages: number,
  setEntityTypes: (x: any) => void,
  setBlockState: (x: any) => void,
) => {
  const promises = Array(numPages)
    .fill(undefined)
    .map((_, pageNumber) =>
      aggregateEntityTypes({
        accountId,
        operation: {
          pageNumber,
        },
      }),
    );

  Promise.all(promises)
    .then((entityTypesResults) => {
      const entityTypes: BlockProtocolEntityType[] = entityTypesResults.flatMap(
        (entityTypeResult) => entityTypeResult.results,
      );
      if (entityTypes) {
        setEntityTypes(uniqBy(entityTypes, "entityTypeId"));
        setBlockState(BlockState.Selector);
      } else {
        setBlockState(BlockState.Error);
      }
    })
    .catch((err) => {
      throw err;
    });
};
