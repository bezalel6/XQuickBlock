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

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: "center",
          gap: { xs: 2, sm: 0 },
          mb: 3,
          p: 2,
          borderRadius: 2,
          background:
            theme === "dark"
              ? "linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)"
              : "linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)",
          boxShadow:
            theme === "dark"
              ? "0 4px 20px rgba(0, 0, 0, 0.3)"
              : "0 4px 20px rgba(0, 0, 0, 0.1)",
          userSelect: "none",
        }}
      >
        <Box sx={{ width: { xs: "96px", sm: "96px" } }}>
          <motion.img
            src="icon128.png"
            alt="XQuickBlock Logo"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: 4,
              userSelect: "none",
            }}
            whileHover={{ rotate: 360, scale: 1 }}
            whileTap={{ scale: 1.3 }}
            transition={{ duration: 0.5 }}
          />
        </Box>

        <Box
          sx={{ display: "flex", justifyContent: "center", userSelect: "none" }}
        >
          <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
            <Typography
              variant={isMobile ? "h4" : "h4"}
              component="h1"
              color="primary"
              sx={{
                fontWeight: 700,
                letterSpacing: "0.5px",
                background:
                  theme === "dark"
                    ? "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)"
                    : "linear-gradient(45deg, #1976D2 30%, #2196F3 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                userSelect: "none",
              }}
            >
              {title}
            </Typography>
          </motion.div>
        </Box>

        <Box
          sx={{
            width: { xs: "64px", sm: "96px" },
            display: "flex",
            justifyContent: "flex-end",
            userSelect: "none",
          }}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          </motion.div>
        </Box>
      </Box>
    </motion.div>
  );
};

export default Header;
