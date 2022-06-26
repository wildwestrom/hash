import React, { useEffect, useState } from "react";
import { BlockComponent } from "blockprotocol/react";
import { Container } from "@mui/material";
import { BlockProtocolEntity, BlockProtocolEntityType } from "blockprotocol";
import { getEntityTypes } from "./app/get-entity-types";
import { BlockState } from "./app/state";
import { EntityTypeSelector } from "./app/entity-type-selector";
import { getEntities } from "./app/get-entities";
import { EntitySelector } from "./app/entity-selector";
import { VariableStore } from "./app/variable-store";

type BlockEntityProperties = {};

export const App: BlockComponent<BlockEntityProperties> = ({
  // entityId,
  accountId,
  aggregateEntityTypes,
  aggregateEntities,
}) => {
  const [blockState, setBlockState] = useState(BlockState.Loading);
  const [entityTypes, setEntityTypes] = useState<BlockProtocolEntityType[]>();
  const [selectedEntityType, setSelectedEntityType] = useState("");
  const [entities, setEntities] = useState<BlockProtocolEntity[]>();
  const [selectedEntity, setSelectedEntity] = useState();
  const [variableName, setVariableName] = useState();

  useEffect(() => {
    if (!entityTypes && aggregateEntityTypes) {
      getEntityTypes(
        aggregateEntityTypes,
        accountId,
        5,
        setEntityTypes,
        setBlockState,
      );
    }
  }, [accountId, aggregateEntityTypes, entityTypes, setEntityTypes]);

  useEffect(() => {
    // if selectedEntityType changes, remove entity selection
    setEntities(undefined);
    setSelectedEntity(undefined);
  }, [selectedEntityType, setEntities, setSelectedEntity]);

  useEffect(() => {
    if (selectedEntityType && aggregateEntities) {
      getEntities(
        aggregateEntities,
        selectedEntityType,
        accountId,
        5,
        setEntities,
        setBlockState,
      );
    }
  }, [accountId, aggregateEntities, selectedEntityType, setEntities]);

  switch (blockState) {
    case BlockState.Error:
      return <>"Oops error"</>;
    case BlockState.Loading:
      return <>"Loading"</>;
    case BlockState.Selector:
      return (
        <Container>
          <EntityTypeSelector
            entityTypes={entityTypes!}
            selectedEntityType={selectedEntityType}
            setSelectedEntityType={setSelectedEntityType}
          />
          <EntitySelector
            entities={entities}
            selectedEntity={selectedEntity}
            setSelectedEntity={setSelectedEntity}
          />
          <VariableStore
            disabled={selectedEntity}
            variableName={variableName}
            setVariableName={setVariableName}
          />
        </Container>
      );
  }
};
