import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
} from "@mui/material";
import React from "react";

interface ButtonProps extends Omit<MuiButtonProps, "onClick"> {
  onClick: () => void;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  loading,
  fullWidth = false,
  children,
  disabled,
  ...props
}) => (
  <MuiButton
    variant="contained"
    color="primary"
    onClick={onClick}
    disabled={disabled || loading}
    sx={{
      mt: 2,
      width: fullWidth ? "100%" : "auto",
      ...props.sx,
    }}
    {...props}
  >
    {loading ? "Loading..." : children}
  </MuiButton>
);

export default Button;
