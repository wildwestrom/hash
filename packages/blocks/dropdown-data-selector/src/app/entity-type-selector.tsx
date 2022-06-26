import React from "react";

import { Select, MenuItem } from "@mui/material";
import { BlockProtocolEntityType } from "blockprotocol";

export type EntityTypeSelectorProps = {
  entityTypes: BlockProtocolEntityType[];
  selectedEntityTypeId: string;
  setSelectedEntityTypeId: (x: any) => void;
};

export const EntityTypeSelector: React.FunctionComponent<
  EntityTypeSelectorProps
> = ({ entityTypes, selectedEntityTypeId, setSelectedEntityTypeId }) => {
  const handleSelectChange = (event: any) => {
    console.log(`Selecting Entity Type: ${event.target.value}`);
    setSelectedEntityTypeId(event.target.value);
  };

  return (
    <Select
      labelId="entity-type-selector-label"
      id="entity-type-selector"
      value={selectedEntityTypeId}
      label="Entity Type"
      onChange={handleSelectChange}
    >
      {entityTypes.map((entityType) => {
        return (
          <MenuItem
            key={entityType.entityTypeId}
            value={entityType.entityTypeId}
          >
            {entityType.title}
          </MenuItem>
        );
      })}
    </Select>
  );
};
