import { Box, Typography, Tooltip, Fade, Zoom } from "@mui/material";
import React, { useState } from "react";
import Button from "./button";
import { sendMessageToBackground } from "../../message-handler";
import { motion, AnimatePresence } from "framer-motion";
import UpdateIcon from "@mui/icons-material/Update";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";

const ManualUpdateSection: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateStatus("idle");
    try {
      await sendMessageToBackground({ type: "manualUpdate" });
      setUpdateStatus("success");
      setLastUpdateTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error triggering manual update:", error);
      setUpdateStatus("error");
    } finally {
      setIsUpdating(false);
    }
  };

  const StatusIcon = () => {
    switch (updateStatus) {
      case "success":
        return <CheckCircleIcon color="success" />;
      case "error":
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          bgcolor: "background.paper",
          boxShadow: 1,
          "&:hover": {
            boxShadow: 3,
            transition: "box-shadow 0.3s ease-in-out",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <UpdateIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6" color="primary" gutterBottom>
            Manual Update
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click the button below to manually check for and apply any available
          updates.
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Tooltip title="Check for updates" arrow>
            <span>
              <Button
                onClick={handleUpdate}
                loading={isUpdating}
                startIcon={<UpdateIcon />}
                variant="contained"
                color="primary"
                sx={{
                  minWidth: 120,
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                {isUpdating ? "Updating..." : "Update Now"}
              </Button>
            </span>
          </Tooltip>

          <AnimatePresence>
            {updateStatus !== "idle" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <StatusIcon />
                  <Typography
                    variant="body2"
                    color={
                      updateStatus === "success" ? "success.main" : "error.main"
                    }
                  >
                    {updateStatus === "success"
                      ? "Update successful!"
                      : "Update failed"}
                  </Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {lastUpdateTime && (
          <Fade in={true}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              Last updated: {lastUpdateTime}
            </Typography>
          </Fade>
        )}
      </Box>
    </motion.div>
  );
};

export default ManualUpdateSection;
