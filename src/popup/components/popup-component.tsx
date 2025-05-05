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
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { ExtensionSettings, Source } from '../../types';
import Header from '../components/header';
import UpdateSection from './updates';
import PromotedContentSelector from '../components/promoted-content-selector';
import ToggleSwitch from '../components/toggle-switch';
import AutomaticPolicySelector from '../components/update-policy-selector';
import SELECTORS from '../../constants';
import SourceSelector from '../components/source-selector';
import Advanced from './advanced-settings';
import Button from './button';
import { getSettingsManager } from '../../settings-manager';
import Footer from './footer';
import Experimental from './experimental';
import BuyMeACoffee from './buy-me-a-coffee';
import ThemeToggle from './theme-toggle';
import { motion } from 'framer-motion';
import { ButtonSwitch } from './button-switch';
import EnvironmentIndicator from './env-indicator';

export type Setting<K extends keyof ExtensionSettings> = {
  value: ExtensionSettings[K];
  onChange: (v: ExtensionSettings[K]) => void;
  className: string;
};
type PopupProps = {
  optionsPage?: boolean;
  highlight?: keyof ExtensionSettings;
};
const Popup: React.FC<PopupProps> = ({ optionsPage, highlight: highlightProp }) => {
  const [state, setState] = useState<ExtensionSettings>({
    isBlockEnabled: true,
    isMuteEnabled: true,
    themeOverride: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    promotedContentAction: 'hide',
    hideSubscriptionOffers: true,
    hideUserSubscriptions: true,
    automaticUpdatePolicy: 'weekly',
    selectors: SELECTORS,
    source: Source.MAIN,
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const urlParams = new URLSearchParams(window.location.search);
    const highlight =
      highlightProp || (urlParams.get('highlight') as keyof ExtensionSettings | null);
    console.log('Highlight:', highlight);
    if (highlight) {
      const element = document.querySelector(`.${highlight}`) as HTMLElement;
      if (element) {
        // Add a highlight effect to the element
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Apply a pulsing highlight animation
          const highlightAnimation = element.animate(
            [
              { backgroundColor: 'rgba(29, 161, 242, 0.3)' },
              { backgroundColor: 'rgba(29, 161, 242, 0.1)' },
              { backgroundColor: 'rgba(29, 161, 242, 0.3)' },
            ],
            {
              duration: 1500,
              iterations: 3,
              easing: 'ease-in-out',
            }
          );

          // Clean up after animation completes
          highlightAnimation.onfinish = () => {
            element.style.backgroundColor = '';
          };
        }, 300);
      }
    }
    async function subscribe() {
      const settingsManager = await getSettingsManager('popup');
      unsubscribe = settingsManager.subscribeToAnyUpdates(s => setState(s));
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
    const settingsManager = await getSettingsManager('popup');
    await settingsManager.update(settings);
    setState(settings);
  };
  const settingField = <K extends keyof ExtensionSettings>(k: K): Setting<K> => {
    return {
      className: k,
      onChange: v => updateState({ [k]: v }),
      value: state[k],
    };
  };

  const toggleTheme = () => {
    updateState({
      themeOverride: state.themeOverride === 'dark' ? 'light' : 'dark',
    });
  };

  // Create theme based on user preference
  const theme = createTheme({
    palette: {
      mode: state.themeOverride,
      primary: {
        main: '#1DA1F2',
      },
      secondary: {
        main: state.themeOverride === 'dark' ? '#8899A6' : '#657786',
      },
    },
    typography: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
  });

  return (
    <Box sx={{ minWidth: 400 }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container
          sx={{
            ...(optionsPage ? { width: 600 } : { width: '100%' }),
            height: '100%',
            position: 'relative',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 1,
              mt: 2,
              mb: 2,
              borderRadius: 2,
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.mode === 'dark' ? '#4a4a4a' : '#c1c1c1',
                borderRadius: '4px',
              },
            }}
          >
            <Header theme={state.themeOverride} />
            {/* Core Functionality */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                my: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <ButtonSwitch {...settingField('isBlockEnabled')} label="Block"></ButtonSwitch>
                <ButtonSwitch {...settingField('isMuteEnabled')} label="Mute"></ButtonSwitch>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <ThemeToggle theme={state.themeOverride} onToggle={toggleTheme} />
                </motion.div>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" component="p" mb={1}>
                  Click the Mute/Block buttons next to usernames to take action.
                </Typography>
                <Experimental>
                  <Typography variant="body2" color="text.secondary">
                    Hold Ctrl and click an action to apply it to all visible users.
                  </Typography>
                </Experimental>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Content Filtering */}
            <PromotedContentSelector {...settingField('promotedContentAction')} />
            <ToggleSwitch
              {...settingField('hideSubscriptionOffers')}
              label="Hide Subscription Offers"
            />
            <ToggleSwitch
              {...settingField('hideUserSubscriptions')}
              label="Hide User Subscriptions"
            />
            <Divider sx={{ my: 2 }} />
            <UpdateSection
              policyProps={settingField('automaticUpdatePolicy')}
              lastUpdatedSelectors={state.lastUpdatedSelectors}
            />
            <Divider sx={{ my: 2 }} />
            {/* Advanced Settings */}
            <Accordion defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Advanced Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Advanced>
                  <SourceSelector {...settingField('source')}></SourceSelector>
                  <Button
                    onClick={() => {
                      getSettingsManager('popup')
                        .then(sett => sett.resetToDefault())
                        .then(() => alert('Settings reset'));
                    }}
                  >
                    Reset to default
                  </Button>
                </Advanced>
              </AccordionDetails>
            </Accordion>
            <Divider sx={{ my: 2 }} />
            <Footer></Footer>
            <EnvironmentIndicator
              label="Persist Default Selectors"
              {...settingField('overrideDefaultSelectors')}
            />
          </Paper>
        </Container>
      </ThemeProvider>
    </Box>
  );
};
export default Popup;
