import  { type Selectors } from "./constants";

export type PromotedContentAction = "nothing" | "hide" | "block";

export interface ExtensionSettings {
  isBlockMuteEnabled: boolean;
  themeOverride: "light" | "dark";
  promotedContentAction: PromotedContentAction;
  hideSubscriptionOffers: boolean;
  hideUserSubscriptions: boolean;
  selectors:Selectors
  
}

export interface ExtensionMessage {
  type: "stateUpdate";
  payload: ExtensionSettings;
}

export type Action = "block" | "mute";
