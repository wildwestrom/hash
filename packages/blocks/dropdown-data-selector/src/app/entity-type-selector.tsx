import React from "react";

import { Select, MenuItem } from "@mui/material";
import { BlockProtocolEntityType } from "blockprotocol";

export type EntityTypeSelectorProps = {
  entityTypes: BlockProtocolEntityType[];
  selectedEntityType: string;
  setSelectedEntityType: (x: any) => void;
};

export const EntityTypeSelector: React.FunctionComponent<
  EntityTypeSelectorProps
> = ({ entityTypes, selectedEntityType, setSelectedEntityType }) => {
  const handleSelectChange = (event: any) => {
    console.log(`Selecting Entity Type: ${event.target.value}`);
    setSelectedEntityType(event.target.value);
  };

  return (
    <Select
      labelId="entity-type-selector-label"
      id="entity-type-selector"
      value={selectedEntityType}
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
