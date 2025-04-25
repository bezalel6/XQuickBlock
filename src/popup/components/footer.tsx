import { Box, IconButton, useTheme, Tooltip, Button } from "@mui/material";
import React from "react";
import BuyMeACoffee from "./buy-me-a-coffee";

const Footer = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Tooltip title="Visit GitHub Repository" placement="top">
          <IconButton
            component="a"
            href="https://github.com/bezalel6/XQuickBlock"
            target="_blank"
            disableRipple
            aria-label="GitHub Repository"
          >
            <img
              src="github.png"
              alt="GitHub"
              width="36"
              height="36"
              style={{
                filter: theme.palette.mode === "dark" ? "invert(1)" : "none",
                opacity: 0.9,
              }}
            />
          </IconButton>
        </Tooltip>
        <Tooltip title="Visit Chrome Web Store" placement="top">
          <IconButton
            component="a"
            href="https://chromewebstore.google.com/detail/fkcppikhgboddjlcoapmibcpcnlhepko?utm_source=item-share-cb"
            target="_blank"
            disableRipple
            aria-label="Chrome Webstore Page"
          >
            <img
              src="chrome-store.png"
              alt="Chrome Webstore"
              width="48"
              height="48"
              style={{
                opacity: 0.9,
              }}
            />
          </IconButton>
        </Tooltip>
        <BuyMeACoffee></BuyMeACoffee>
      </Box>
    </Box>
  );
};

export default Footer;
