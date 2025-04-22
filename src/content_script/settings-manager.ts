import { ExtensionSettings } from "types";
import { getCurrentState } from "./utils";

type Callback<T> = (newValue: T) => void;
type KeyCallbackMap<T> = Map<keyof T, Set<Callback<T>>>;
class StateManager<T extends object> {
  private state: T;
  private callbacks: KeyCallbackMap<T> = new Map();
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

  /**
   * Update the state and notify relevant callbacks
   * @param newState Partial state update
   */
  update(newState: Partial<T>): void {
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
class SettingsManager extends StateManager<ExtensionSettings> {
  private static instance: SettingsManager | null = null;

  private constructor(initialState: ExtensionSettings) {
    super(initialState);
  }

  static async getInstance(): Promise<SettingsManager> {
    if (!SettingsManager.instance) {
      const initialState = await getCurrentState();
      SettingsManager.instance = new SettingsManager(initialState);
    }
    return SettingsManager.instance;
  }
}

// Export a function to get the singleton instance
export const getSettingsManager = () =>
  SettingsManager.getInstance().catch((e) => {
    console.error("Error getting the settings manager:", e);
    throw e;
  });
