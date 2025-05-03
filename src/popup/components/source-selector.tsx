import {
  FormControl,
  FormLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  Box,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Source } from "../../types";
import { Setting } from "./popup-component";
import UpdateButton from "./update-button";
const BRANCHES = "https://api.github.com/repos/bezalel6/XTerminator/branches";
const fetchBranches = async () => {
  return fetch(BRANCHES)
    .then((r) => r.json() as unknown as { name: string }[])
    .then((b) => b.map((bb) => bb.name))
    .then(async (branches) => {
      await chrome.storage.sync.set({ branches });
      return branches;
    });
};
const SourceSelector: React.FC<Setting<"source">> = ({
  value,
  onChange,
  className,
}) => {
  const [branches, setBranches] = useState(["main"]);
  useEffect(() => {
    chrome.storage.sync.get("branches").then((obj: { branches?: string[] }) => {
      if (obj.branches) setBranches(obj.branches);
    });
  }, []);
  async function onUpdate() {
    const branches = await fetchBranches();
    setBranches(branches);
  }
  return (
    <FormControl className={className} fullWidth sx={{ mt: 2 }}>
      <Box
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        flexDirection={"row"}
        gap={1}
      >
        <FormLabel>Selectors Source</FormLabel>
        <UpdateButton
          onUpdate={onUpdate}
          tooltipLabel="Fetch available sources"
          minimal
        ></UpdateButton>
      </Box>
      <Select
        value={value || Source.MAIN}
        onChange={(e: SelectChangeEvent) => onChange(e.target.value as Source)}
        size="small"
        sx={{ mt: 1 }}
      >
        {branches.map((src) => (
          <MenuItem key={src} value={src}>
            {src}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SourceSelector;
