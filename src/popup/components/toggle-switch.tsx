import { FormControlLabel, Switch } from "@mui/material";
import React from "react";
// Create a reusable toggle component
const ToggleSwitch: React.FC<{
    enabled: boolean;
    onChange: (checked: boolean) => void;
    label: string;
  }> = ({ enabled, onChange, label }) => (
    <FormControlLabel
      control={
        <Switch
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          color="primary"
        />
      }
      label={label}
    />
  );

  export default ToggleSwitch