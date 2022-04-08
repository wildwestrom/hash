import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { VoidFunctionComponent } from "react";
import { EntityStoreType } from "@hashintel/hash-shared/entityStore";
import { JSONValue } from "blockprotocol";

import { JsonSchema } from "../../lib/json-utils";
import { TextField } from "../../shared/ui/text-field";
import { BlockEntity } from "@hashintel/hash-shared/entity";

const extractConfigPropertySchemas = (blockSchema: JsonSchema) =>
  Object.entries(blockSchema.properties ?? {}).filter(([name]) =>
    blockSchema.config?.includes(name),
  );

const ConfigurationInput: VoidFunctionComponent<{
  name: string;
  schema: JsonSchema;
  value?: JSONValue | null;
}> = ({ name, schema: { type }, value }) => {
  switch (type) {
    case "boolean":
      return (
        <FormControlLabel
          control={
            <Checkbox
              onChange={(event) =>
                console.log("New value", name, event.target.value)
              }
              checked={typeof value === "boolean" ? value : false}
            />
          }
          label={name}
        />
      );

    case "string":
      return (
        <TextField
          label={name}
          onChange={(event) =>
            console.log("New value", name, event.target.value)
          }
          variant="outlined"
          value={value ?? ""}
        />
      );

    case "number":
      return (
        <TextField
          label={name}
          onChange={(event) =>
            console.log("New value", name, event.target.value)
          }
          type="number"
          variant="outlined"
          value={value ?? ""}
        />
      );

    default:
      throw new Error(`Property type ${type} config input not implemented`);
  }
};

type BlockConfigMenuProps = {
  blockData: EntityStoreType | null;
  blockSchema: JsonSchema;
  closeMenu: () => void;
  updateConfig: () => void;
};

export const BlockConfigMenu: VoidFunctionComponent<BlockConfigMenuProps> = ({
  blockData,
  blockSchema,
  closeMenu,
  updateConfig,
}) => {
  const configProperties = extractConfigPropertySchemas(blockSchema);

  const entityData = (blockData?.properties as any).entity.properties;

  console.log({ entityData, blockData });

  return (
    <Box
      sx={({ borderRadii, palette }) => ({
        position: "absolute",
        width: 200,
        height: 150,
        zIndex: 10,
        borderRadius: borderRadii.lg,
        border: `1px solid ${palette.gray[30]}`,
        padding: 1,
      })}
    >
      <Typography variant="smallTextLabels">Configure</Typography>
      {configProperties.map(([name, schema]) => (
        <ConfigurationInput
          key={name}
          name={name}
          schema={schema}
          value={entityData[name]}
        />
      ))}
    </Box>
  );
};
