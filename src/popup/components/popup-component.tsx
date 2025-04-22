import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Container,
  createTheme,
  CssBaseline,
  Divider,
  Paper,
  ThemeProvider,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { ExtensionSettings, Source } from "../../types";
import Header from "../components/header";
import InfoSection from "../components/info-section";
import ManualUpdateSection from "../components/manual-update-section";
import PromotedContentSelector from "../components/promoted-content-selector";
import ToggleSwitch from "../components/toggle-switch";
import AutomaticPolicySelector from "../components/update-policy-selector";
import { processPopupUpdate } from "../../message-handler";
import SELECTORS from "../../constants";
import SourceSelector from "../components/source-selector";
import Advanced from "./advanced-settings";
import Button from "./button";
type PopupProps = { optionsPage?: boolean };
const Popup: React.FC<PopupProps> = ({ optionsPage }) => {
  const [state, setState] = useState<ExtensionSettings>({
    isBlockMuteEnabled: false,
    themeOverride: window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
    promotedContentAction: "hide",
    hideSubscriptionOffers: true,
    hideUserSubscriptions: true,
    automaticUpdatePolicy: "weekly",
    selectors: SELECTORS,
    source: Source.MAIN,
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
    const settings = { ...state, ...newState };
    processPopupUpdate(settings);
    setState(settings);
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
      <Container sx={{ ...(optionsPage ? { width: 600 } : { width: 300 }) }}>
        <Paper
          elevation={3}
          sx={{
            p: 1,
            mt: 2,
            mb: 2,
            borderRadius: 2,
          }}
        >
          <Header theme={state.themeOverride} onThemeToggle={toggleTheme} />

          {/* Core Functionality */}
          <ToggleSwitch
            enabled={state.isBlockMuteEnabled}
            onChange={makeOnChange("isBlockMuteEnabled")}
            label={
              state.isBlockMuteEnabled
                ? "Block/Mute Buttons Enabled"
                : "Block/Mute Buttons Disabled"
            }
          />
          <InfoSection />

          <Divider sx={{ my: 2 }} />

          {/* Content Filtering */}
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
          <Divider sx={{ my: 2 }} />

          {/* Update Settings */}
          <AutomaticPolicySelector
            value={state.automaticUpdatePolicy}
            onChange={makeOnChange("automaticUpdatePolicy")}
          />
          <ManualUpdateSection />
          <Divider sx={{ my: 2 }} />

          {/* Advanced Settings */}
          <Accordion defaultExpanded={optionsPage}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Advanced Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Advanced>
                <SourceSelector
                  value={state.source || Source.MAIN}
                  onChange={makeOnChange("source")}
                ></SourceSelector>
                <Button
                  onClick={() => {
                    chrome.storage.sync.clear().then(() => alert("Done"));
                  }}
                >
                  Reset Extension Storage
                </Button>
              </Advanced>
            </AccordionDetails>
          </Accordion>
          <Divider sx={{ my: 2 }} />
        </Paper>
      </Container>
    </ThemeProvider>
  );
};
export default Popup;
