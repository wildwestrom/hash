import React from "react";
import { TextField } from "@mui/material";

export type VariableStoreProps = {
  disabled: any;
  variableName: string | undefined;
  setVariableName: (x: any) => void;
};

export const VariableStore: React.FunctionComponent<VariableStoreProps> = ({
  disabled,
  variableName,
  setVariableName,
}) => {
  const handleChange = (event: any) => {
    setVariableName(event.target.value);
  };

  return (
    <TextField
      disabled={disabled == null}
      id="selection-variable"
      label="Store Selection under"
      variant="outlined"
      value={variableName ?? ""}
      onChange={handleChange}
    />
  );
};
