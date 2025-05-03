import React, { useState } from "react";
import { Tooltip } from "@mui/material";
import Button from "./button";
import UpdateIcon from "@mui/icons-material/Update";
import { sleep } from "content_script/utils";

interface UpdateButtonProps {
  onUpdate: () => Promise<void>;
  buttonLabel?: {
    updating?: string;
    default?: string;
  };
  tooltipLabel?: string;
  minimal?: boolean;
}

const UpdateButton: React.FC<UpdateButtonProps> = ({
  onUpdate,
  buttonLabel = {
    updating: "Updating...",
    default: "Update Now",
  },
  tooltipLabel = "Check for updates",
  minimal = false,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await Promise.all([onUpdate(), sleep(500)]);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Tooltip title={tooltipLabel} placement="top" arrow>
      <span>
        <Button
          onClick={handleUpdate}
          disabled={isUpdating}
          startIcon={
            <UpdateIcon
              sx={{
                fontSize: minimal ? 20 : undefined,
                margin: 0,
                animation: isUpdating ? "spin 1s linear infinite" : "none",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
          }
          variant="contained"
          color="primary"
          sx={{
            minWidth: minimal ? "auto" : 120,
            width: minimal ? 40 : "auto",
            height: minimal ? 40 : "auto",
            padding: minimal ? 1 : undefined,
            transition: "transform 0.2s",
            "& .MuiButton-startIcon": {
              marginRight: minimal ? 0 : undefined,
            },
            "&:hover": {
              transform: "scale(1.05)",
            },
          }}
        >
          {!!minimal
            ? null
            : isUpdating
              ? buttonLabel.updating
              : buttonLabel.default}
        </Button>
      </span>
    </Tooltip>
  );
};

export default UpdateButton;
