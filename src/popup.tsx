import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Box,
  Container,
  Typography,
  Switch,
  FormControlLabel,
  IconButton,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  FormControl,
  Select,
  MenuItem,
  FormLabel,
  Divider,
  SelectChangeEvent,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { ExtensionSettings, PromotedContentAction } from "./types";

// Create a reusable theme toggle component
const ThemeToggle: React.FC<{
  theme: "light" | "dark";
  onToggle: () => void;
}> = ({ theme, onToggle }) => (
  <IconButton onClick={onToggle} color="inherit" aria-label="toggle theme">
    {theme === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
  </IconButton>
);

// Create a reusable header component
const Header: React.FC<{
  title: string;
  theme: "light" | "dark";
  onThemeToggle: () => void;
}> = ({ title, theme, onThemeToggle }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 3,
    }}
  >
    <Typography variant="h5" component="h1" color="primary">
      {title}
    </Typography>
    <ThemeToggle theme={theme} onToggle={onThemeToggle} />
  </Box>
);

// Create a reusable toggle component
const ToggleSwitch: React.FC<{
  enabled: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}> = ({ enabled, onChange, label }) => (
  <FormControlLabel
    control={
      <Switch
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        color="primary"
      />
    }
    label={label}
  />
);

// Create a reusable promoted content selection component
const PromotedContentSelector: React.FC<{
  value: PromotedContentAction;
  onChange: (value: PromotedContentAction) => void;
}> = ({ value, onChange }) => (
  <FormControl fullWidth sx={{ mt: 2 }}>
    <FormLabel>Promoted Content</FormLabel>
    <Select
      value={value}
      onChange={(e: SelectChangeEvent) =>
        onChange(e.target.value as PromotedContentAction)
      }
      size="small"
      sx={{ mt: 1 }}
    >
      <MenuItem value="nothing">Do nothing</MenuItem>
      <MenuItem value="hide">Hide</MenuItem>
      <MenuItem value="block">Block</MenuItem>
    </Select>
  </FormControl>
);

// Create a reusable info section component
const InfoSection: React.FC = () => (
  <Box sx={{ mt: 3 }}>
    <Typography variant="body2" color="text.secondary" paragraph>
      Click the Mute/Block buttons next to usernames to take action.
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Hold Ctrl and click to apply to all visible users.
    </Typography>
  </Box>
);

const Popup: React.FC = () => {
  const [state, setState] = useState<ExtensionSettings>({
    isBlockMuteEnabled: false,
    themeOverride: window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
    promotedContentAction: "hide",
    hideSubscriptionOffers: true,
    hideUserSubscriptions: true,
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

  const handleToggleChange = (checked: boolean) => {
    updateState({ isBlockMuteEnabled: checked });
  };

  const handlePromotedContentChange = (action: PromotedContentAction) => {
    updateState({ promotedContentAction: action });
  };

  const handleSubscriptionOffersChange = (checked: boolean) => {
    updateState({ hideSubscriptionOffers: checked });
  };

  const handleUserSubscriptionsChange = (checked: boolean) => {
    updateState({ hideUserSubscriptions: checked });
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
            onChange={handleToggleChange}
            label={
              state.isBlockMuteEnabled
                ? "Block/Mute Buttons Enabled"
                : "Block/Mute Buttons Disabled"
            }
          />
          <Divider sx={{ my: 2 }} />
          <PromotedContentSelector
            value={state.promotedContentAction}
            onChange={handlePromotedContentChange}
          />
          <ToggleSwitch
            enabled={state.hideSubscriptionOffers}
            onChange={handleSubscriptionOffersChange}
            label="Hide Subscription Offers"
          />
          <ToggleSwitch
            enabled={state.hideUserSubscriptions}
            onChange={handleUserSubscriptionsChange}
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
