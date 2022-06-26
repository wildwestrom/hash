import {
  BlockProtocolAggregateEntitiesFunction,
  BlockProtocolEntity,
} from "blockprotocol";
import { uniqBy } from "lodash";
import { BlockState } from "./state";

export const getEntities = (
  aggregateEntities: BlockProtocolAggregateEntitiesFunction,
  entityTypeId: string,
  accountId: string | null | undefined,
  numPages: number,
  setEntities: (x: any) => void,
  setBlockState: (x: any) => void,
) => {
  const promises = Array(numPages)
    .fill(undefined)
    .map((_, pageNumber) =>
      aggregateEntities({
        accountId,
        operation: {
          entityTypeId,
          pageNumber,
        },
      }),
    );

  Promise.all(promises)
    .then((entitiesResults) => {
      const entities: BlockProtocolEntity[] = entitiesResults.flatMap(
        (entityResult) => entityResult.results,
      );
      if (entities) {
        setEntities(uniqBy(entities, "entityId"));
      } else {
        setBlockState(BlockState.Error);
      }
    })
    .catch((err) => {
      setBlockState(BlockState.Error);
      throw err;
    });
};
