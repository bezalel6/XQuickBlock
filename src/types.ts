export type PromotedContentAction = "nothing" | "hide" | "block";

export interface ExtensionState {
  isBlockMuteEnabled: boolean;
  themeOverride: "light" | "dark";
  promotedContentAction: PromotedContentAction;
  hideSubscriptionOffers: boolean;
  hideUserSubscriptions: boolean;
}

export interface ExtensionMessage {
  type: "stateUpdate";
  payload: ExtensionState;
}

export type Action = "block" | "mute";
