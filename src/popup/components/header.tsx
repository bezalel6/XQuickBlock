import { Box, Typography } from '@mui/material';
import React from 'react'
import ThemeToggle from './theme-toggle';
// Create a reusable header component
const Header: React.FC<{
    title: string;
    theme: "light" | "dark";
    onThemeToggle: () => void;
  }> = ({ title, theme, onThemeToggle }) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
      }}
    >
      <Typography variant="h5" component="h1" color="primary">
        {title}
      </Typography>
      <ThemeToggle theme={theme} onToggle={onThemeToggle} />
    </Box>
  );
  export default Header