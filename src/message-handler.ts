import { ExtensionMessage, InternalExtensionMessage } from "./types";

export async function sendMessageToBackground(
  message: Omit<InternalExtensionMessage, "sentTo">
): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { ...message, sentTo: "background" } as InternalExtensionMessage,
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      }
    );
  });
}

/**
 * Send a message to the active content script
 * @param message The message to send
 * @returns Promise that resolves with the response
 */
export async function sendMessageToContentScript(
  message: InternalExtensionMessage
): Promise<any> {
  const tabs = await chrome.tabs.query({ active: true });
  if (!tabs.length) {
    throw new Error("No active tab found");
  }

  return new Promise((resolve, reject) => {
    Promise.all(
      tabs.map((tab) => {
        return new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tab.id!, message, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
      })
    )
      .then(resolve)
      .catch(reject);
  });
}
