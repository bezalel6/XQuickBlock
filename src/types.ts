import { End } from "settings-manager";
import { type Selectors } from "./constants";

export type PromotedContentAction = "nothing" | "hide" | "block";

export interface ExtensionSettings {
  isBlockMuteEnabled: boolean;
  themeOverride: "light" | "dark";
  promotedContentAction: PromotedContentAction;
  hideSubscriptionOffers: boolean;
  hideUserSubscriptions: boolean;
  lastUpdatedSelectors?: number;
  selectors: Selectors;
  automaticUpdatePolicy: UpdatePolicy;
  source?: Source;
}

export interface ExtensionMessage {
  type: "stateUpdate" | "forceUpdate" | "manualUpdate" | "options";
  payload?: ExtensionSettings | { highlight?: keyof ExtensionSettings };
}
export interface InternalExtensionMessage extends ExtensionMessage {
  sentFrom: End;
  sentTo: End;
}

export type Action = "block" | "mute";

export type UpdatePolicy = "daily" | "weekly" | "monthly" | "never";

export enum Source {
  MAIN = "main",
  TEST = "test",
}
