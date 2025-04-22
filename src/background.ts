import {
  ExtensionMessage,
  ExtensionSettings,
  Source,
  UpdatePolicy,
} from "./types";
import { getSettingsManager } from "./content_script/settings-manager";
import { handleManualUpdate, handleStateUpdate } from "./message-handler";

const makeUpdateURL = (source: Source = Source.MAIN) =>
  `https://raw.githubusercontent.com/bezalel6/XQuickBlock/refs/heads/${source}/public/data/constants.json`;

// Function to fetch and update JSON data
async function fetchAndUpdateJson() {
  try {
    // Get the settings manager instance
    const settingsManager = await getSettingsManager();
    const currentSettings = settingsManager.getState();
    console.log("Background setting:", currentSettings);
    const update = await fetch(makeUpdateURL(currentSettings.source)).then(
      (res) => res.json()
    );
    // Update the settings with the current timestamp
    settingsManager.update({
      lastUpdatedSeleectors: Date.now(),
      ...currentSettings, // Preserve existing settings
      ...update,
    });

    console.log("[XQuickBlock] Successfully updated settings");
  } catch (error) {
    console.error("[XQuickBlock] Error updating settings:", error);
  }
}

// Function to check if we need to fetch new data
async function checkAndFetchIfNeeded(alarm = false) {
  const { lastUpdatedSeleectors, automaticUpdatePolicy } = (
    await getSettingsManager()
  ).getState();

  if ((!lastUpdatedSeleectors && automaticUpdatePolicy !== "never") || alarm) {
    await fetchAndUpdateJson();
  }
}

const ALARM_NAME = "checkForUpdates";

// Listen for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    checkAndFetchIfNeeded(true);
  }
});

async function settingsUpdated(settings: ExtensionSettings) {
  // Set up periodic checking based on user's update policy
  const periodInMinutes = getUpdatePolicyInMinutes(
    settings.automaticUpdatePolicy
  );

  if (periodInMinutes) {
    await chrome.alarms.create(ALARM_NAME, {
      periodInMinutes,
    });
  } else {
    // If no policy is set or policy is "never", clear any existing alarm
    await chrome.alarms.clear(ALARM_NAME);
  }
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    console.log("[XQuickBlock] Received message:", message);

    switch (message.type) {
      case "stateUpdate": {
        handleStateUpdate(message.payload)
          .then(settingsUpdated)
          .then(() => sendResponse({ success: true }))
          .catch((error) =>
            sendResponse({ success: false, error: error.message })
          );
        break;
      }
      case "manualUpdate": {
        fetchAndUpdateJson()
          .then(() => sendResponse({ success: true }))
          .catch((error) =>
            sendResponse({ success: false, error: error.message })
          );
        break;
      }
    }

    return true; // Keep the message channel open for the async response
  }
);

// Initialize the alarm when the extension starts
chrome.runtime.onInstalled.addListener(async () => {
  const settingsManager = await getSettingsManager();
  const settings = settingsManager.getState();
  const periodInMinutes = getUpdatePolicyInMinutes(
    settings.automaticUpdatePolicy
  );

  if (periodInMinutes) {
    await chrome.alarms.create(ALARM_NAME, {
      periodInMinutes,
    });
  }
});

// Function to convert update policy to minutes
function getUpdatePolicyInMinutes(policy: UpdatePolicy): number | null {
  switch (policy) {
    case "daily":
      return 24 * 60; // 24 hours
    case "weekly":
      return 7 * 24 * 60; // 7 days
    case "monthly":
      return 30 * 24 * 60; // 30 days
    case "never":
      return null;
  }
}
