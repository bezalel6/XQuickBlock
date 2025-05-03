import React, { useState } from "react";
import { Tooltip } from "@mui/material";
import Button from "./button";
import UpdateIcon from "@mui/icons-material/Update";

interface UpdateButtonProps {
  onUpdate: () => Promise<void>;
  buttonLabel?: {
    updating?: string;
    default?: string;
  };
  tooltipLabel?: string;
}

const UpdateButton: React.FC<UpdateButtonProps> = ({
  onUpdate,
  buttonLabel = {
    updating: "Updating...",
    default: "Update Now",
  },
  tooltipLabel = "Check for updates",
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onUpdate();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Tooltip title={tooltipLabel} placement="top" arrow>
      <span>
        <Button
          onClick={handleUpdate}
          loading={isUpdating}
          startIcon={
            <UpdateIcon
              sx={{
                animation: isUpdating ? "spin 1s linear infinite" : "none",
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
          {isUpdating ? buttonLabel.updating : buttonLabel.default}
        </Button>
      </span>
    </Tooltip>
  );
};

export default UpdateButton;
