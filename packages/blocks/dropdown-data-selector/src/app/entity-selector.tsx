import { Select, MenuItem } from "@mui/material";
import { BlockProtocolEntity } from "blockprotocol";

export type EntitySelectorProps = {
  entities: BlockProtocolEntity[];
  selectedEntity: string;
  setSelectedEntity: (x: any) => void;
};

export const EntitySelector: React.FunctionComponent<EntitySelectorProps> = ({
  entities,
  selectedEntity,
  setSelectedEntity,
}) => {
  const handleSelectChange = (event: any) => {
    setSelectedEntity(event.target.value);
  };

  return (
    <Select
      labelId="entity-selector-label"
      id="entity-selector"
      value={selectedEntity}
      label="Entity"
      onChange={handleSelectChange}
    >
      {entities.map((entity) => {
        return (
          <MenuItem key={entity.entityId} value={entity.entityId}>
            {entity.entityId}
          </MenuItem>
        );
      })}
    </Select>
  );
};
