import { Box, Typography, Tooltip, Fade, Zoom } from "@mui/material";
import React, { useRef, useState, useEffect } from "react";
import Button from "./button";
import { sendMessageToBackground } from "../../message-handler";
import { motion, AnimatePresence } from "framer-motion";
import UpdateIcon from "@mui/icons-material/Update";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import SyncIcon from "@mui/icons-material/Sync";
import { getSettingsManager } from "../../settings-manager";
import { ExtensionSettings } from "types";
import AutomaticPolicySelector from "./update-policy-selector";
import { Setting } from "./popup-component";

const UpdateSection: React.FC<{
  lastUpdatedSelectors: ExtensionSettings["lastUpdatedSelectors"];
  policyProps: Setting<"automaticUpdatePolicy">;
}> = ({ lastUpdatedSelectors, policyProps }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [diff, setDiff] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  useEffect(() => {
    if (lastUpdatedSelectors) {
      const date = new Date(lastUpdatedSelectors);
      setLastUpdateTime(date.toLocaleString());
    }
  }, [lastUpdatedSelectors]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateStatus("idle");
    setDiff(null);
    try {
      const updatePromise = sendMessageToBackground({
        type: "manualUpdate",
        sentFrom: "popup",
      });

      // Create a minimum delay of 1 second
      const minDelayPromise = new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      // Wait for both the update and minimum delay to complete
      const res = await Promise.all([updatePromise, minDelayPromise]).then(
        ([result]) => result
      );

      console.log("Background:", res);
      const { diff, success } = res;
      setDiff(diff);
      setUpdateStatus("success");
    } catch (error) {
      console.error("Error triggering manual update:", error);
      setUpdateStatus("error");
    } finally {
      setIsUpdating(false);
    }
  };

  const StatusIcon = () => {
    if (updateStatus === "error") return <ErrorIcon color="error" />;
    if (diff === 0) return <SyncIcon color="action" />;
    if (diff && diff > 0) return <AddIcon color="success" />;
    if (diff && diff < 0) return <RemoveIcon color="warning" />;
    return <InfoIcon color="info" />;
  };

  const getStatusMessage = () => {
    if (updateStatus === "error") return "Update failed";
    if (diff === 0) return "Already up to date";
    if (diff && diff > 0)
      return `Added ${diff} new selector${diff === 1 ? "" : "s"}`;
    if (diff && diff < 0)
      return `Removed ${Math.abs(diff)} selector${
        Math.abs(diff) === 1 ? "" : "s"
      }`;
    return "Update successful!";
  };

  const getStatusColor = () => {
    if (updateStatus === "error") return "error.main";
    if (diff === 0) return "text.secondary";
    if (diff && diff > 0) return "success.main";
    if (diff && diff < 0) return "warning.main";
    return "success.main";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
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
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <UpdateIcon sx={{ mr: 1, mb: "0.35em", color: "primary.main" }} />
          <Typography variant="h6" color="primary" gutterBottom>
            Updates
          </Typography>
        </Box>
        <Typography variant="body2" color="info.dark">
          We do not collect any information. Updates are only used to keep up
          with X's UI changes.
        </Typography>
        {/* Update Settings */}
        <AutomaticPolicySelector {...policyProps} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click the button below to manually check for and apply any available
          updates.
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Tooltip title="Check for updates" placement="top" arrow>
            <span>
              <Button
                onClick={handleUpdate}
                loading={isUpdating}
                startIcon={
                  <UpdateIcon
                    sx={{
                      animation: isUpdating
                        ? "spin 1s linear infinite"
                        : "none",
                      "@keyframes spin": {
                        "0%": {
                          transform: "rotate(0deg)",
                        },
                        "100%": {
                          transform: "rotate(360deg)",
                        },
                      },
                    }}
                  />
                }
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
                  <Typography variant="body2" color={getStatusColor()}>
                    {getStatusMessage()}
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

export default UpdateSection;
