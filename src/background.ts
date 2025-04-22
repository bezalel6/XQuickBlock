import { ExtensionSettings } from './types';
import { getSettingsManager } from './content_script/settings-manager';

// Function to fetch and update JSON data
async function fetchAndUpdateJson() {
  try {
    // // Replace this URL with your actual JSON endpoint
    // const response = await fetch('YOUR_JSON_ENDPOINT');
    // const data = await response.json();
    
    // Get the settings manager instance
    const settingsManager = await getSettingsManager();
    console.log("Background setting:",settingsManager.getState())
    // Update the settings with the fetched data
    settingsManager.update({
        lastUpdatedSeleectors:Date.now()
      // Add any new settings from the fetched data
      // For example:
      // newSetting: data.newSetting,
      // anotherSetting: data.anotherSetting,
    });
    
    console.log('[XQuickBlock] Successfully updated settings from JSON');
  } catch (error) {
    console.error('[XQuickBlock] Error fetching JSON:', error);
  }
}

// Function to check if we need to fetch new data
async function checkAndFetchIfNeeded() {
  const { lastUpdatedSeleectors } = (await getSettingsManager()).getState()
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  
  if (!lastUpdatedSeleectors || Date.now() - lastUpdatedSeleectors > ONE_DAY_MS) {
    await fetchAndUpdateJson();
  }
}

// Initial fetch when the service worker starts
checkAndFetchIfNeeded();

// Set up periodic checking
chrome.alarms.create('checkForUpdates', {
  periodInMinutes: 60 // Check every hour
});

// Listen for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkForUpdates') {
    checkAndFetchIfNeeded();
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'forceUpdate') {
    fetchAndUpdateJson().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep the message channel open for the async response
  }
}); 