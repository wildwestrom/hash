import { Box } from "@mui/material";
import { VoidFunctionComponent } from "react";
import { JsonSchema } from "../../lib/json-utils";

type BlockConfigMenuProps = {
  blockSchema: JsonSchema;
  closeMenu: () => void;
  updateConfig: () => void;
};

export const BlockConfigMenu: VoidFunctionComponent<BlockConfigMenuProps> = ({
  blockSchema,
  closeMenu,
  updateConfig,
}) => {
  console.log({ blockSchema });

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
      Configure
    </Box>
  );
};
