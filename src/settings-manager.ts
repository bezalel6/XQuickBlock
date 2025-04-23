import { ExtensionMessage, ExtensionSettings, Source } from "./types";
import { default as default_selectors } from "./constants";
import {
  sendMessageToBackground,
  sendMessageToContentScript,
} from "./message-handler";
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
    keys.forEach((key) => {
      if (!this.callbacks.has(key)) {
        this.callbacks.set(key, new Set());
      }
      this.callbacks.get(key)!.add(callback);
    });
    callback(this.getState());
    return () => {
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
    const l = this.anyChangeCallbacks.push(callback);
    return () => {
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
    const changedKeys = new Set<keyof T>();

    // Update state and track changed keys
    Object.entries(newState).forEach(([key, value]) => {
      const typedKey = key as keyof T;
      if (this.state[typedKey] !== value) {
        this.state[typedKey] = value as T[keyof T];
        changedKeys.add(typedKey);
      }
    });
    console.log("Chenged keys:", [...changedKeys]);
    if (changedKeys.size >= 1) {
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
type End = "content" | "popup" | "background";

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
class SettingsManager<T extends End> extends StateManager<ExtensionSettings> {
  private static instance: SettingsManager<any> | null = null;
  private messageHandlers: Map<ExtensionMessage["type"], MessageHandler> =
    new Map();

  private constructor(initialState: ExtensionSettings, readonly end: End) {
    super(initialState);
    this.startListening();
  }
  async update(
    newState: Partial<ExtensionSettings>,
    shouldUpdateOtehrs = true
  ) {
    super.update(newState);
    await this.sync(shouldUpdateOtehrs);
    return this;
  }
  // Called SECOND after firing callbacks
  protected async sync(shouldUpdateOtehrs = true) {
    // Update chrome storage
    await chrome.storage.sync.set(this.getState()); //    <==2ND
    if (shouldUpdateOtehrs) await this.updateOthers(); // <==3RD
    return this;
  }
  async updateOthers() {
    const msg: ExtensionMessage = {
      type: "stateUpdate",
      payload: this.getState(),
    };
    return Promise.all(
      this.getOtherEnds()
        .map((e) => endMessageCallbacks[e])
        .map((cb) =>
          cb(msg).catch((err) => {
            console.log(err);
            return "";
          })
        )
    );
  }
  private startListening() {
    chrome.runtime.onMessage.addListener(
      async (message: ExtensionMessage, sender, sendResponse) => {
        console.log(`${this.end} got message: ${message}`);

        // Handle state updates internally
        if (message.type === "stateUpdate") {
          await this.update(message.payload, false);
          sendResponse({ message: "State updated successfully" });
          return true;
        }

        // Handle registered message handlers
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          try {
            const result = await handler(message, sender, sendResponse);
            sendResponse({ success: true, result });
          } catch (error) {
            console.error(`Error handling message ${message.type}:`, error);
            sendResponse({ success: false, error: error.message });
          }
          return true;
        }

        return false;
      }
    );
  }
  static async getInstance<T extends End>(end: T): Promise<SettingsManager<T>> {
    if (!SettingsManager.instance) {
      console.log(
        `initializing a new settings manager instance @${Date.now()} on: ${end}`
      );
      const initialState = await this.fetchSettings();
      SettingsManager.instance = new SettingsManager(initialState, end);
    }
    return SettingsManager.instance;
  }
  private static async fetchSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (data: Partial<ExtensionSettings>) => {
        const finalState = {
          ...defaultSettings,
          ...data,
        };

        resolve(finalState);
      });
    });
  }
  getOtherEnds() {
    return otherEndsMap[this.end];
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
    this.messageHandlers.set(type, handler);
    return this;
  }

  /**
   * Unregister a message handler
   * @param type The message type to remove handler for
   */
  unregisterMessageHandler(type: ExtensionMessage["type"]) {
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
