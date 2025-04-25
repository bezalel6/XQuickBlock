import React from "react";
import { IconButton } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
// Create a reusable theme toggle component
const ThemeToggle: React.FC<{
  theme: "light" | "dark";
  onToggle: () => void;
}> = ({ theme, onToggle }) => (
  <IconButton
    onClick={onToggle}
    size="small"
    color="inherit"
    aria-label="toggle theme"
    sx={{ ml: -2 }}
  >
    {theme === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
  </IconButton>
);

export default ThemeToggle;
