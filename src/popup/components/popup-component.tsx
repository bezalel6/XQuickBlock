import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  createTheme,
  CssBaseline,
  Divider,
  IconButton,
  Paper,
  ThemeProvider,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { ExtensionSettings, Source } from "../../types";
import Header from "../components/header";
import ManualUpdateSection from "../components/manual-update-section";
import PromotedContentSelector from "../components/promoted-content-selector";
import ToggleSwitch from "../components/toggle-switch";
import AutomaticPolicySelector from "../components/update-policy-selector";
import SELECTORS from "../../constants";
import SourceSelector from "../components/source-selector";
import Advanced from "./advanced-settings";
import Button from "./button";
import { getSettingsManager } from "../../settings-manager";
import Footer from "./footer";
import Experimental from "./experimental";
import BuyMeACoffee from "./buy-me-a-coffee";
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
    let unsubscribe: (() => void) | undefined;

    async function subscribe() {
      const settingsManager = await getSettingsManager("popup");
      unsubscribe = settingsManager.subscribeToAnyUpdates((s) => setState(s));
    }

    subscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const updateState = async (newState: Partial<ExtensionSettings>) => {
    const settings = { ...state, ...newState };
    const settingsManager = await getSettingsManager("popup");
    await settingsManager.update(settings);
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
      <Container
        sx={{
          ...(optionsPage ? { width: 600 } : { width: "100%" }),
        }}
      >
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
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" component="p">
              Click the Mute/Block buttons next to usernames to take action.
            </Typography>
            <Experimental>
              <Typography variant="body2" color="text.secondary">
                Hold Ctrl and click an action to apply it to all visible users.
              </Typography>
            </Experimental>
          </Box>

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
          <ManualUpdateSection
            lastUpdatedSelectors={state.lastUpdatedSelectors}
          />
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
                    getSettingsManager("popup")
                      .then((sett) => sett.resetToDefault())
                      .then(() => alert("Settings reset"));
                  }}
                >
                  Reset to default
                </Button>
              </Advanced>
            </AccordionDetails>
          </Accordion>
          <Divider sx={{ my: 2 }} />
          <Footer></Footer>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};
export default Popup;
