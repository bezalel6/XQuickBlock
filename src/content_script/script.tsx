import { ExtensionMessage, ExtensionSettings } from "../types";
import AdPlaceholder, { adPlaceHolderClassName } from "./ad-placeholder";
import Button from "./dispatch-btn";
import {
  createMutationCallback,
  observeDOMChanges,
  resetObserver,
} from "./mutation-observer";
import { getSettingsManager, SettingsManger } from "../settings-manager";
import {
  closestMessedWith,
  dispatch,
  getTweet,
  hasAdSpan,
  isMessedWith,
  isUserOwnAccount,
  setMessedWith,
  sleep,
  toggleCSSRule,
  toggleInvisible,
  waitFor,
} from "./utils";
import { injectPromo } from "./extension-promo";
const BTNS = "BUTTONS_WRAPPER";
const AD = "AD";

function processAd(
  tweet: HTMLElement,
  userNameElement: HTMLElement,
  settings: SettingsManger
) {
  const { promotedContentAction } = settings.getState();
  // First, clean up any previous hide effects
  const existingNotification = tweet.parentNode?.querySelector(
    `.${adPlaceHolderClassName}`
  );
  if (existingNotification) {
    existingNotification.remove();
  }
  tweet.classList.add(AD);
  tweet.style.height = "";

  // Then apply new effects based on the new setting
  switch (promotedContentAction) {
    case "nothing":
      break;
    case "hide": {
      tweet.classList.add("hidden-tweet");
      const notification = AdPlaceholder(userNameElement);
      tweet.parentNode?.insertBefore(notification, tweet);
      // tweet.style.height = "0";
      break;
    }
    case "block": {
      dispatch(userNameElement, "block");
      break;
    }
  }
}
/**
 * Add mute and block buttons to user names, as well as applying current Ad policy
 */
export async function processUsername(userNameElement: HTMLElement) {
  const settings = await getSettingsManager("content");
  const tweet = getTweet(userNameElement)!;
  const selector = settings.getState().selectors.userMenuSelector;
  const moreBtn = await waitFor(selector);
  if (
    !moreBtn ||
    isMessedWith(userNameElement) ||
    isUserOwnAccount(userNameElement)
  )
    return;
  setMessedWith(userNameElement);
  if (hasAdSpan(tweet)) {
    processAd(tweet, userNameElement, settings);
  }
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add(BTNS);
  buttonContainer.style.display = "inline-flex";
  buttonContainer.style.alignItems = "center";
  buttonContainer.style.marginLeft = "4px";

  const btns = [
    Button("Mute", "mute", userNameElement),
    Button("Block", "block", userNameElement),
  ];
  btns.forEach((btn) => buttonContainer.appendChild(btn));
  userNameElement.parentElement?.parentElement?.appendChild(buttonContainer);
}

async function applySettings(state: ExtensionSettings) {
  const settings = await getSettingsManager("content");
  settings.subscribe(["selectors"], ({ selectors }) => {
    if (selectors.test) toggleCSSRule(selectors.test, "color", "aqua", true);
  });
  settings.subscribe(
    ["hideSubscriptionOffers"],
    ({ hideSubscriptionOffers, selectors }) =>
      toggleInvisible(selectors.upsaleSelectors, hideSubscriptionOffers)
  );
  settings.subscribe(
    ["hideUserSubscriptions"],
    ({ hideUserSubscriptions, selectors }) => {
      toggleInvisible(
        selectors.subscribeToButtonSelector,
        hideUserSubscriptions
      );
    }
  );
  settings.subscribe(
    ["isBlockMuteEnabled"],
    ({ isBlockMuteEnabled, selectors: { userNameSelector } }) => {
      toggleInvisible(`.${BTNS}`, !isBlockMuteEnabled);
      if (isBlockMuteEnabled) {
        const userNames = document.querySelectorAll(userNameSelector);
        userNames.forEach((userName) => {
          // console.log("[XTerminator] Processing username element:", userName);
          processUsername(userName as HTMLElement);
        });
      } else {
        const buttons = document.querySelectorAll(`.${BTNS}`);
        // console.log("[XTerminator] Found buttons to remove:", buttons.length);
        buttons.forEach((b) => {
          const parent = closestMessedWith(b as HTMLElement);
          setMessedWith(parent, false);
          b.remove();
        });
      }
    }
  );
  settings.subscribe(
    ["promotedContentAction"],
    ({ promotedContentAction, selectors: { userNameSelector } }) => {
      document.querySelectorAll(`.${AD}`).forEach((ad) => {
        processAd(
          ad as HTMLElement,
          ad.querySelector(userNameSelector),
          settings
        );
      });
    }
  );
  (window as any).injectPromo = injectPromo;
  observeDOMChanges(state);
}

function cleanup({ selectors }: ExtensionSettings): void {
  resetObserver();
  document.querySelectorAll('[messedWith="true"]').forEach((e) => {
    setMessedWith(e, false);
  });

  document
    .querySelectorAll(selectors.userNameSelector)
    .forEach((userNameElement) => {
      setMessedWith(userNameElement, false);
      userNameElement
        .querySelectorAll("button")
        .forEach((button) => button.remove());
    });
}

export default async function init() {
  console.log("[XTerminator] DOM content loaded, starting initialization...");
  const state = (await getSettingsManager("content")).getState();
  applySettings(state);
  console.log("[XTerminator] Initialized with settings:", state);
}
