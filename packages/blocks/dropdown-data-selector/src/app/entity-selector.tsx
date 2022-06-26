import React from "react";

import { Select, MenuItem } from "@mui/material";
import { BlockProtocolEntity } from "blockprotocol";

export type EntitySelectorProps = {
  entities: BlockProtocolEntity[] | undefined;
  selectedEntityId: string | undefined;
  setSelectedEntityId: (x: any) => void;
};

export const EntitySelector: React.FunctionComponent<EntitySelectorProps> = ({
  entities,
  selectedEntityId,
  setSelectedEntityId,
}) => {
  const handleSelectChange = (event: any) => {
    console.log(`Selecting Entity: ${event.target.value}`);
    setSelectedEntityId(event.target.value);
  };

  return (
    <Select
      labelId="entity-selector-label"
      id="entity-selector"
      value={selectedEntityId ?? ""}
      label="Entity"
      onChange={handleSelectChange}
      disabled={entities == null}
    >
      {entities != null
        ? entities.map((entity) => {
            return (
              <MenuItem key={entity.entityId} value={entity.entityId}>
                {entity.entityId}
              </MenuItem>
            );
          })
        : undefined}
    </Select>
  );
};
