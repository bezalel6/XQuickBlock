import { FormControlLabel, Switch } from "@mui/material";
import React from "react";
import { Setting } from "./popup-component";
import { ExtensionSettings } from "../../types";

type BooleanSettings = {
  [K in keyof ExtensionSettings]: ExtensionSettings[K] extends boolean
    ? K
    : never;
}[keyof ExtensionSettings];

type ToggleSwitchProps<K extends BooleanSettings> = {
  onChange: (checked: boolean) => void;
  label: string;
} & Setting<K>;

// Create a reusable toggle component
const ToggleSwitch = <K extends BooleanSettings>({
  onChange,
  label,
  className,
  value,
}: ToggleSwitchProps<K>) => (
  <FormControlLabel
    className={className}
    control={
      <Switch checked={value} onChange={(e) => onChange(e.target.checked)} />
    }
    label={label}
  />
);

export default ToggleSwitch;
