import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import React from "react";
import ThemeToggle from "./theme-toggle";
import { motion } from "framer-motion";

const title = "Terminator";

const Header: React.FC<{
  theme: "light" | "dark";
}> = ({ theme }) => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  // Theme configurations
  const themeConfig = {
    background:
      theme === "dark"
        ? "linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)"
        : "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
    divider:
      theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
    titleGradient:
      theme === "dark"
        ? "linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)"
        : "linear-gradient(45deg, #1976d2 0%, #2196f3 100%)",
    shadow:
      theme === "dark"
        ? "0 8px 32px rgba(0, 0, 0, 0.4)"
        : "0 8px 32px rgba(0, 0, 0, 0.1)",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 99999,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 3,
          background: themeConfig.background,
          boxShadow: themeConfig.shadow,
          position: "relative",
          gap: 2,
          borderBottom: `2px solid ${themeConfig.divider}`,
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: "-2px",
            left: 0,
            right: 0,
            height: "2px",
            background: themeConfig.background,
            zIndex: 1,
          },
        }}
      >
        {/* Logo and Title Container */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            cursor: "pointer",
          }}
        >
          <img
            src="icons/icon.png"
            alt="XTerminator Logo"
            draggable="false"
            style={{
              width: isMobile ? 48 : 64,
              height: isMobile ? 48 : 64,
              borderRadius: 12,
              backgroundColor:
                theme === "dark"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
              boxShadow:
                theme === "dark"
                  ? "0 4px 12px rgba(0,0,0,0.3)"
                  : "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
        </motion.div>
        <Typography
          variant={isMobile ? "h4" : "h3"}
          component="h1"
          sx={{
            fontWeight: 800,
            letterSpacing: "0.1em",
            textShadow:
              theme === "dark"
                ? "0 2px 8px rgba(74, 144, 226, 0.3)"
                : "0 2px 8px rgba(25, 118, 210, 0.2)",
            userSelect: "none",
          }}
        >
          {title}
        </Typography>
      </Box>
    </motion.div>
  );
};

export default Header;
