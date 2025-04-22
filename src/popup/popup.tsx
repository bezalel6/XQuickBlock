import {
  Container,
  createTheme,
  CssBaseline,
  Divider,
  Paper,
  ThemeProvider,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { ExtensionSettings } from "../types";
import Header from "./components/header";
import InfoSection from "./components/info-section";
import PromotedContentSelector from "./components/promoted-content-selector";
import ToggleSwitch from "./components/toggle-switch";
import AutomaticPolicySelector from "./components/update-policy-selector";

const Popup: React.FC = () => {
  const [state, setState] = useState<ExtensionSettings>({
    isBlockMuteEnabled: false,
    themeOverride: window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
    promotedContentAction: "hide",
    hideSubscriptionOffers: true,
    hideUserSubscriptions: true,
    automaticUpdatePolicy: "weekly",
  });

  useEffect(() => {
    chrome.storage.sync.get(
      Object.keys(state),
      (data: Partial<ExtensionSettings>) => {
        setState((prev) => ({
          ...prev,
          ...data,
        }));
      }
    );
  }, []);

  const updateState = (newState: Partial<ExtensionSettings>) => {
    setState((prev) => {
      const updatedState = { ...prev, ...newState };
      chrome.storage.sync.set(updatedState, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: "stateUpdate",
              payload: updatedState,
            });
          }
        });
      });
      return updatedState;
    });
  };
  const makeOnChange = <K extends keyof ExtensionSettings>(k: K) => {
    return (value: ExtensionSettings[K]) => {
      updateState({ [k]: value });
    };
  };

  const toggleTheme = () => {
    updateState({
      themeOverride: state.themeOverride === "dark" ? "light" : "dark",
    });
  };

  // Create theme based on user preference
  const theme = createTheme({
    palette: {
      mode: state.themeOverride,
      primary: {
        main: "#1DA1F2",
      },
      secondary: {
        main: state.themeOverride === "dark" ? "#8899A6" : "#657786",
      },
    },
    typography: {
      fontFamily: "Arial, sans-serif",
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container sx={{ minWidth: 300 }}>
        <Paper
          elevation={3}
          sx={{
            p: 1,
            mt: 2,
            mb: 2,
            borderRadius: 2,
          }}
        >
          <Header
            title="XQuickBlock"
            theme={state.themeOverride}
            onThemeToggle={toggleTheme}
          />
          <ToggleSwitch
            enabled={state.isBlockMuteEnabled}
            onChange={makeOnChange("isBlockMuteEnabled")}
            label={
              state.isBlockMuteEnabled
                ? "Block/Mute Buttons Enabled"
                : "Block/Mute Buttons Disabled"
            }
          />
          <Divider sx={{ my: 2 }} />

          <AutomaticPolicySelector
            value={state.automaticUpdatePolicy}
            onChange={makeOnChange("automaticUpdatePolicy")}
          />
          <PromotedContentSelector
            value={state.promotedContentAction}
            onChange={makeOnChange("promotedContentAction")}
          />
          <ToggleSwitch
            enabled={state.hideSubscriptionOffers}
            onChange={makeOnChange("hideSubscriptionOffers")}
            label="Hide Subscription Offers"
          />
          <ToggleSwitch
            enabled={state.hideUserSubscriptions}
            onChange={makeOnChange("hideUserSubscriptions")}
            label="Hide User Subscriptions"
          />
          <InfoSection />
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
