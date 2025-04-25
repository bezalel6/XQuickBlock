import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";

interface ExperimentalProps {
  children: React.ReactNode;
}

const Experimental: React.FC<ExperimentalProps> = ({ children }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        position: "relative",
        padding: 2,
        borderRadius: 2,
        border: `2px dashed ${
          isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"
        }`,
        backgroundColor: isDark
          ? "rgba(255, 255, 255, 0.05)"
          : "rgba(0, 0, 0, 0.02)",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          top: -10,
          left: 10,
          backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
          padding: "0 8px",
          color: isDark ? "#ff9800" : "#f57c00",
          fontWeight: "bold",
          borderRadius: 1,
          border: `1px solid ${
            isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"
          }`,
        }}
      >
        EXPERIMENTAL
      </Typography>
      {children}
    </Box>
  );
};

export default Experimental;
