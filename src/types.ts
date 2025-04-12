export type PromotedContentAction = "nothing" | "hide" | "block";

export interface ExtensionState {
  isBlockMuteEnabled: boolean;
  themeOverride: "light" | "dark";
  promotedContentAction: PromotedContentAction;
  hideSubscriptionOffers: boolean;
}

export interface ExtensionMessage {
  type: "stateUpdate";
  payload: ExtensionState;
}

export type Action = "block" | "mute"; 