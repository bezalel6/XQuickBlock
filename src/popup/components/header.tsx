import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import React from "react";
import ThemeToggle from "./theme-toggle";
import { motion } from "framer-motion";

const title = "XQuickBlock";

const Header: React.FC<{
  theme: "light" | "dark";
  onThemeToggle: () => void;
}> = ({ theme, onThemeToggle }) => {
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
          justifyContent: "space-between",
          px: isMobile ? 2 : 3,
          py: 2,
          background: themeConfig.background,
          boxShadow: themeConfig.shadow,
          position: "relative",
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
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{ display: "flex", alignItems: "center" }}
        >
          <img
            src="icon128.png"
            alt="XQuickBlock Logo"
            draggable="false"
            style={{
              width: isMobile ? 40 : 48,
              height: isMobile ? 40 : 48,
              borderRadius: 8,
              cursor: "pointer",
              boxShadow:
                theme === "dark"
                  ? "0 2px 8px rgba(0,0,0,0.3)"
                  : "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
        </motion.div>

        {/* Title */}
        <motion.div whileHover={{ scale: 1.02 }}>
          <Typography
            variant={isMobile ? "h5" : "h4"}
            component="h1"
            sx={{
              fontWeight: 800,
              letterSpacing: "0.1em",
              textShadow:
                theme === "dark"
                  ? "0 2px 8px rgba(74, 144, 226, 0.3)"
                  : "0 2px 8px rgba(25, 118, 210, 0.2)",
              px: 2,
              mx: -2,
            }}
          >
            {title}
          </Typography>
        </motion.div>

        {/* Theme Toggle */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default Header;
