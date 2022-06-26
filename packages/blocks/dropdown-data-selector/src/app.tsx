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

type BlockEntityProperties = {
  selectedEntityTypeId?: string;
  selectedEntityId?: string;
  variableName?: string;
};

export const App: BlockComponent<BlockEntityProperties> = ({
  entityId,
  entityTypeId,
  accountId,
  updateEntities,
  aggregateEntityTypes,
  aggregateEntities,
  createLinkedAggregations,
  createLinks,
  selectedEntityTypeId: storedSelectedEntityTypeId,
  selectedEntityId: storedSelectedEntityId,
  variableName: storedVariableName,
}) => {
  console.log(entityId);
  const [blockState, setBlockState] = useState(BlockState.Loading);
  const [entityTypes, setEntityTypes] = useState<BlockProtocolEntityType[]>();
  const [selectedEntityTypeId, setSelectedEntityTypeId] = useState(
    storedSelectedEntityTypeId ?? "",
  );
  const [entities, setEntities] = useState<BlockProtocolEntity[]>();
  const [selectedEntityId, setSelectedEntityId] = useState(
    storedSelectedEntityId,
  );
  const [variableName, setVariableName] = useState(storedVariableName);

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
    if (selectedEntityTypeId !== storedSelectedEntityTypeId) {
      setEntities(undefined);
      setSelectedEntityId(undefined);
    }
  }, [
    selectedEntityTypeId,
    storedSelectedEntityTypeId,
    setEntities,
    setSelectedEntityId,
  ]);

  useEffect(() => {
    if (selectedEntityTypeId && aggregateEntities) {
      getEntities(
        aggregateEntities,
        selectedEntityTypeId,
        accountId,
        5,
        setEntities,
        setBlockState,
      );
    }
  }, [accountId, aggregateEntities, selectedEntityTypeId, setEntities]);

  useEffect(() => {
    if (variableName && createLinkedAggregations && createLinks) {
      createLinkedAggregations([
        {
          sourceAccountId: accountId,
          sourceEntityId: entityId,
          sourceEntityTypeId: entityTypeId,
          path: "$.queryEntityType",
          operation: {
            entityTypeId: selectedEntityTypeId,
            itemsPerPage: 100,
          },
        },
      ])
        .then((res) =>
          console.log(`Made LinkedAggregation: ${JSON.stringify(res[0])}`),
        )
        .catch((err) => {
          console.log(err);
        });

      createLinks([
        {
          sourceAccountId: accountId,
          sourceEntityId: entityId,
          path: "$.selectedEntity",
          destinationEntityId: selectedEntityId!,
        },
      ])
        .then((res) => console.log(`Made Link: ${JSON.stringify(res[0])}`))
        .catch((err) => {
          console.log(err);
        });
    }
  }, [
    entityId,
    entityTypeId,
    accountId,
    createLinkedAggregations,
    createLinks,
    selectedEntityId,
    selectedEntityTypeId,
    variableName,
    setBlockState,
  ]);

  useEffect(() => {
    if (
      updateEntities &&
      selectedEntityTypeId &&
      selectedEntityId &&
      variableName
    ) {
      updateEntities([
        {
          entityId,
          accountId,
          data: {
            selectedEntityTypeId,
            selectedEntityId,
            variableName,
          },
        },
      ]).catch((err) => {
        throw err;
      });
    }
  }, [
    accountId,
    entityId,
    updateEntities,
    selectedEntityId,
    selectedEntityTypeId,
    variableName,
  ]);

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
            selectedEntityTypeId={selectedEntityTypeId}
            setSelectedEntityTypeId={setSelectedEntityTypeId}
          />
          <EntitySelector
            entities={entities}
            selectedEntityId={selectedEntityId}
            setSelectedEntityId={setSelectedEntityId}
          />
          <VariableStore
            disabled={selectedEntityId}
            variableName={variableName}
            setVariableName={setVariableName}
          />
        </Container>
      );
  }
};
