import {
  FormControl,
  FormLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
} from "@mui/material";
import React from "react";
import { Source } from "../../types";
import { Setting } from "./popup-component";

const SourceSelector: React.FC<Setting<"source">> = ({
  value,
  onChange,
  className,
}) => (
  <FormControl className={className} fullWidth sx={{ mt: 2 }}>
    <FormLabel>Settings Source</FormLabel>
    <Select
      value={value || Source.MAIN}
      onChange={(e: SelectChangeEvent) => onChange(e.target.value as Source)}
      size="small"
      sx={{ mt: 1 }}
    >
      {Object.values(Source).map((src) => (
        <MenuItem key={src} value={src}>
          {src}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default SourceSelector;
