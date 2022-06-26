import React, { useEffect, useState } from "react";
import { BlockComponent } from "blockprotocol/react";
import { BlockState } from "./app/state";

type BlockEntityProperties = {};

export const App: BlockComponent<BlockEntityProperties> = ({
  entityId,
  entityTypeId,
  linkGroups,
  linkedEntities,
  // accountId,
  // aggregateEntityTypes,
  // aggregateEntities,
  // createLinkedAggregations,
  // createLinks,
}) => {
  const [blockState, setBlockState] = useState(BlockState.Loading);

  console.log(linkGroups);
  console.log(linkedEntities);

  switch (blockState) {
    case BlockState.Error:
      return <>"Oops error"</>;
    case BlockState.Loading:
      return <>"Loading"</>;
    case BlockState.Display:
      return <>Temp</>;
  }
};
