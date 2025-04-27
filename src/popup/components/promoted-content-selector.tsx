import {
  FormControl,
  FormLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
} from "@mui/material";
import React from "react";
import { PromotedContentAction } from "types";
import { Setting } from "./popup-component";

// Create a reusable promoted content selection component
const PromotedContentSelector: React.FC<Setting<"promotedContentAction">> = ({
  value,
  className,
  onChange,
}) => (
  <FormControl className={className} fullWidth sx={{}}>
    <FormLabel>Promoted Content</FormLabel>
    <Select
      value={value}
      onChange={(e: SelectChangeEvent) =>
        onChange(e.target.value as PromotedContentAction)
      }
      size="small"
      sx={{ mt: 1 }}
    >
      <MenuItem value="nothing">Do nothing</MenuItem>
      <MenuItem value="hide">Hide</MenuItem>
      <MenuItem value="block">Block</MenuItem>
    </Select>
  </FormControl>
);

export default PromotedContentSelector;
