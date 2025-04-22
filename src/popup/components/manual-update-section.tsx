import { Box, Typography } from "@mui/material";
import React, { useState } from "react";
import Button from "./button";
import { sendMessageToBackground } from "../../message-handler";

const ManualUpdateSection: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await sendMessageToBackground({ type: "manualUpdate" });
    } catch (error) {
      console.error("Error triggering manual update:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Manual Update
      </Typography>
      <Button onClick={handleUpdate} loading={isUpdating}>
        Update
      </Button>
    </Box>
  );
};

export default ManualUpdateSection;
