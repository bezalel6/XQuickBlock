import {
  FormControl,
  FormLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
} from "@mui/material";
import React from "react";
import { Source } from "../../types";

const SourceSelector: React.FC<{
  value: Source;
  onChange: (value: Source) => void;
}> = ({ value, onChange }) => (
  <FormControl fullWidth sx={{ mt: 2 }}>
    <FormLabel>Settings Source</FormLabel>
    <Select
      value={value}
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
