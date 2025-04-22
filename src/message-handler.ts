import { ExtensionMessage, ExtensionSettings } from "./types";
import { getSettingsManager } from "./content_script/settings-manager";

/**
 * Send a message to the background script
 * @param message The message to send
 * @returns Promise that resolves with the response
 */
export async function sendMessageToBackground(
  message: ExtensionMessage
): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}
/**
 * Handle settings changes from the popup
 * @param settings The updated settings
 */
export async function handleSettingsChange(
  settings: ExtensionSettings
): Promise<void> {
  await chrome.storage.sync.set(settings);
  const message = {
    type: "stateUpdate",
    payload: settings,
  } as const;
  await Promise.all([
    sendMessageToContentScript(message).catch(() =>
      console.log("content script is not available atm")
    ),
    sendMessageToBackground(message),
  ]);
}

/**
 * Process settings update from popup
 * @param payload The settings payload from popup
 */
export async function processPopupUpdate(
  payload: ExtensionSettings
): Promise<void> {
  // Update local storage and propagate changes
  await handleSettingsChange(payload);
}

/**
 * Send a message to the active content script
 * @param message The message to send
 * @returns Promise that resolves with the response
 */
export async function sendMessageToContentScript(
  message: ExtensionMessage
): Promise<any> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) {
    throw new Error("No active tab found");
  }

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id!, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Handle state updates in the content script
 * @param payload The new state to apply
 */
export async function handleStateUpdate(
  payload: ExtensionSettings
): Promise<ExtensionSettings> {
  const settingsManager = await getSettingsManager();
  settingsManager.update(payload);
  return settingsManager.getState();
}

/**
 * Handle manual update requests
 */
export async function handleManualUpdate(): Promise<void> {
  const settingsManager = await getSettingsManager();
  settingsManager.update({
    lastUpdatedSeleectors: Date.now(),
  });
}
