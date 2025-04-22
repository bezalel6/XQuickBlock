import { Box } from "@mui/material";
import React from "react";
const Advanced: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Box
      display="flex"
      flexDirection={"column"}
      alignItems={"center"}
      sx={{ border: "1px dotted gold", p: 1, borderRadius: 2 }}
    >
      {children}
    </Box>
  );
};

export default Advanced;
