import {
  ExtensionMessage,
  ExtensionSettings,
  InternalExtensionMessage,
  Source,
} from "./types";
import { default as default_selectors } from "./constants";
import {
  sendMessageToBackground,
  sendMessageToContentScript,
} from "./message-handler";

// Add logging utility
const log = (context: string, message: string, data?: any) => {
  console.log(`[SettingsManager:${context}] ${message}`, data ? data : "");
};

type Callback<T> = (newValue: T) => void;
type KeyCallbackMap<T> = Map<keyof T, Set<Callback<T>>>;
type MessageHandler = (
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) => Promise<any>;
class StateManager<T extends object> {
  private state: T;
  private callbacks: KeyCallbackMap<T> = new Map();
  private anyChangeCallbacks: Callback<T>[] = [];
  private previousState: Partial<T> = {};

  constructor(initialState: T) {
    log("StateManager", "Initializing with state", initialState);
    this.state = { ...initialState };
    this.previousState = { ...initialState };
  }

  /**
   * Subscribe to changes for specific keys of the state
   * @param keys Array of keys to subscribe to
   * @param callback Function to call when any of the specified keys change
   * @returns Unsubscribe function
   */
  subscribe(keys: (keyof T)[], callback: Callback<T>): () => void {
    log("StateManager", `Subscribing to keys: ${keys.join(", ")}`);
    keys.forEach((key) => {
      if (!this.callbacks.has(key)) {
        this.callbacks.set(key, new Set());
      }
      this.callbacks.get(key)!.add(callback);
    });
    callback(this.getState());
    return () => {
      log("StateManager", `Unsubscribing from keys: ${keys.join(", ")}`);
      keys.forEach((key) => {
        const callbacks = this.callbacks.get(key);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            this.callbacks.delete(key);
          }
        }
      });
    };
  }
  subscribeToAnyUpdates(callback: Callback<T>) {
    log("StateManager", "Subscribing to any updates");
    const l = this.anyChangeCallbacks.push(callback);
    callback(this.getState());
    return () => {
      log("StateManager", "Unsubscribing from any updates");
      this.anyChangeCallbacks = this.anyChangeCallbacks.filter(
        (_, i) => i !== l - 1
      );
    };
  }
  /**
   * Update the state and notify relevant callbacks
   * @param newState Partial state update
   */
  async update(newState: Partial<T>) {
    log("StateManager", "Updating state", newState);
    const changedKeys = new Set<keyof T>();

    // Update state and track changed keys
    Object.entries(newState).forEach(([key, value]) => {
      const typedKey = key as keyof T;
      if (this.state[typedKey] !== value) {
        this.state[typedKey] = value as T[keyof T];
        changedKeys.add(typedKey);
      }
    });
    log("StateManager", "Changed keys", [...changedKeys]);
    if (changedKeys.size >= 1) {
      log("StateManager", "Notifying any-change callbacks");
      this.anyChangeCallbacks.forEach((cb) => cb(this.state));
    }
    // Notify callbacks for changed keys
    const notifiedCallbacks = new Set<Callback<T>>();
    changedKeys.forEach((key) => {
      const callbacks = this.callbacks.get(key);
      if (callbacks) {
        callbacks.forEach((callback) => {
          if (!notifiedCallbacks.has(callback)) {
            notifiedCallbacks.add(callback);
            callback(this.state);
          }
        });
      }
    });

    // Update previous state
    this.previousState = { ...this.state };
    return this;
  }

  /**
   * Get the current state
   */
  getState(): T {
    return { ...this.state };
  }

  /**
   * Get the previous state
   */
  getPreviousState(): Partial<T> {
    return { ...this.previousState };
  }
}
export type End = "content" | "popup" | "background";

const otherEndsMap = {
  background: ["popup", "content"],
  content: ["popup", "background"],
  popup: ["content", "background"],
} as const;

const endMessageCallbacks = {
  content: sendMessageToContentScript,
  background: sendMessageToBackground,
  popup: sendMessageToBackground,
};
const NOT_INTENDED_RECIPIENT = "NOT_INTENDED_RECIPIENT" as const;
class SettingsManager<T extends End> extends StateManager<ExtensionSettings> {
  private static instance: SettingsManager<any> | null = null;
  private messageHandlers: Map<ExtensionMessage["type"], MessageHandler> =
    new Map();

  private constructor(initialState: ExtensionSettings, readonly end: End) {
    super(initialState);
    log("SettingsManager", `Initializing for end: ${end}`);
    this.startListening();
  }
  async update(
    newState: Partial<ExtensionSettings>,
    shouldUpdateOtehrs = true
  ) {
    log("SettingsManager", "Updating settings", {
      newState,
      shouldUpdateOtehrs,
    });
    super.update(newState);
    await this.sync(shouldUpdateOtehrs);
    return this;
  }
  async resetToDefault() {
    return this.update(defaultSettings);
  }
  // Called SECOND after firing callbacks
  protected async sync(shouldUpdateOtehrs = true) {
    log("SettingsManager", "Syncing settings to storage");
    // Update chrome storage
    await chrome.storage.sync.set(this.getState()); //    <==2ND
    if (shouldUpdateOtehrs) await this.updateOthers(); // <==3RD
    return this;
  }
  async updateOthers() {
    const msg: InternalExtensionMessage = {
      type: "stateUpdate",
      payload: this.getState(),
      sentFrom: this.end,
      sentTo: null,
    };
    log("SettingsManager", "Sending update to other ends", msg);
    return Promise.all(
      this.getOtherEnds()
        .map((e) => ({ callback: endMessageCallbacks[e], end: e }))
        .map((data) =>
          data.callback({ ...msg, sentTo: data.end }).catch((err) => {
            log("SettingsManager", `Error updating ${data.end}`, err);
            return "";
          })
        )
    );
  }
  private startListening() {
    log("SettingsManager", "Starting message listener");
    chrome.runtime.onMessage.addListener(
      (message: InternalExtensionMessage, sender, sendResponse) => {
        log("SettingsManager", `Received message: ${message.type}`, message);

        const handleMessage = async (notMyCircus: boolean) => {
          try {
            if (message.type === "stateUpdate") {
              await this.update(message.payload, false);
              if (notMyCircus) return NOT_INTENDED_RECIPIENT;
              return { message: "State updated successfully" };
            }

            if (notMyCircus) return NOT_INTENDED_RECIPIENT;

            const handler = this.messageHandlers.get(message.type);
            if (handler) {
              try {
                log(
                  "SettingsManager",
                  `Executing handler for message type: ${message.type}`
                );
                return handler(message, sender, sendResponse);
              } catch (error) {
                log(
                  "SettingsManager",
                  `Error handling message ${message.type}`,
                  error
                );
                return { success: false, error: error.message };
              }
            } else {
              log(
                "SettingsManager",
                `No handler found for message type: ${message.type}`
              );
              return {
                success: false,
                error: "No handler found for message type",
              };
            }
          } catch (error) {
            log(
              "SettingsManager",
              `Unexpected error in message handling`,
              error
            );
            return { success: false, error: error.message };
          }
        };
        const isMyCircus = message.sentTo === this.end;
        // Execute the handler and send response
        handleMessage(!isMyCircus)
          .then((response) => {
            if (response === NOT_INTENDED_RECIPIENT) return;
            log(
              "SettingsManager",
              `Sending response for ${message.type}`,
              response
            );
            sendResponse(response);
          })
          .catch((error) => {
            log("SettingsManager", `Critical error in message handling`, error);
            sendResponse({ success: false, error: error.message });
          });

        // Return true to indicate we will send a response asynchronously
        return isMyCircus;
      }
    );
  }
  static async getInstance<T extends End>(end: T): Promise<SettingsManager<T>> {
    if (!SettingsManager.instance) {
      log(
        "SettingsManager",
        `initializing a new settings manager instance @${Date.now()} on: ${end}`
      );
      const initialState = await this.fetchSettings();
      SettingsManager.instance = new SettingsManager(initialState, end);
    }
    return SettingsManager.instance;
  }
  private static async fetchSettings(): Promise<ExtensionSettings> {
    log("SettingsManager", "Fetching settings from storage");
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (data: Partial<ExtensionSettings>) => {
        const finalState = {
          ...defaultSettings,
          ...data,
        };
        log("SettingsManager", "Fetched settings", finalState);
        resolve(finalState);
      });
    });
  }
  getOtherEnds() {
    const ends = otherEndsMap[this.end];
    log("SettingsManager", `Getting other ends for ${this.end}`, ends);
    return ends;
  }

  /**
   * Register a handler for a specific message type
   * @param type The message type to handle
   * @param handler The handler function
   */
  registerMessageHandler(
    type: ExtensionMessage["type"],
    handler: MessageHandler
  ) {
    log("SettingsManager", `Registering handler for message type: ${type}`);
    this.messageHandlers.set(type, handler);
    return this;
  }

  /**
   * Unregister a message handler
   * @param type The message type to remove handler for
   */
  unregisterMessageHandler(type: ExtensionMessage["type"]) {
    log("SettingsManager", `Unregistering handler for message type: ${type}`);
    this.messageHandlers.delete(type);
    return this;
  }
}

// Export a function to get the singleton instance
export const getSettingsManager = (end: End) =>
  SettingsManager.getInstance(end).catch((e) => {
    console.error("Error getting the settings manager:", e);
    throw e;
  });
export type SettingsManger = Awaited<
  ReturnType<typeof SettingsManager.getInstance>
>;
const defaultSettings: ExtensionSettings = {
  isBlockMuteEnabled: true,
  themeOverride: "dark",
  promotedContentAction: "hide",
  hideSubscriptionOffers: true,
  hideUserSubscriptions: true,
  selectors: default_selectors,
  automaticUpdatePolicy: "weekly",
  source: Source.MAIN,
};
