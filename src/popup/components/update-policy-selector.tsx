import { FormControl, FormLabel, Select, SelectChangeEvent, MenuItem } from "@mui/material";
import React from "react";
import { UpdatePolicy } from "types";

const AutomaticPolicySelector: React.FC<{
    value: UpdatePolicy;
    onChange: (value: UpdatePolicy) => void;
  }> = ({ value, onChange }) => (
    <FormControl fullWidth sx={{ mt: 2 }}>
      <FormLabel>Automatic Update Policy</FormLabel>
      <Select
        value={value}
        onChange={(e: SelectChangeEvent) =>
          onChange(e.target.value as UpdatePolicy)
        }
        size="small"
        sx={{ mt: 1 }}
      >
        <MenuItem value="daily">Daily</MenuItem>
        <MenuItem value="weekly">Weekly</MenuItem>
        <MenuItem value="monthly">Monthly</MenuItem>
        <MenuItem value="never">Never</MenuItem>
      </Select>
    </FormControl>
  );

  export default AutomaticPolicySelector