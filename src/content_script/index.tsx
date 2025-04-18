import { upsaleSelectors, userMenuSelector, userNameSelector, subscribeToButtonSelector } from "../constants";
import { ExtensionMessage, ExtensionState } from "../types";
import AdPlaceholder, { adPlaceHolderClassName } from "./ad-placeholder";
import Button from "./dispatch-btn";
import { observeDOMChanges, resetObserver } from "./mutation-observer";
import { getSettingsManager } from "./settings-manager";
import {
    dispatch,
    getTweet,
    hasAdSpan,
    isUserOwnAccount,
    sleep,
    toggleInvisible,
} from "./utils";

/**
 * Add mute and block buttons to user names, as well as applying current Ad policy
 */
export async function processUsername(userNameElement: HTMLElement) {

    const tweet = getTweet(userNameElement)!;
    await sleep(100)
    const moreBtn = tweet.querySelector(userMenuSelector)
    if (
        !moreBtn ||
        userNameElement.hasAttribute("messedWith") ||
        isUserOwnAccount(userNameElement)
    )
        return;
    userNameElement.setAttribute("messedWith", "true");
    const settings = await getSettingsManager();
    if (hasAdSpan(tweet)) {
        settings.subscribe(
            ["promotedContentAction"],
            ({ promotedContentAction }) => {
                // First, clean up any previous hide effects
                const existingNotification = tweet.parentNode?.querySelector(
                    `.${adPlaceHolderClassName}`
                );
                if (existingNotification) {
                    existingNotification.remove();
                }
                tweet.style.height = "";

                // Then apply new effects based on the new setting
                switch (promotedContentAction) {
                    case "nothing":
                        break;
                    case "hide": {
                        const notification = AdPlaceholder(userNameElement);
                        tweet.parentNode?.insertBefore(notification, tweet);
                        tweet.style.height = "0";
                        break;
                    }
                    case "block": {
                        dispatch(userNameElement, "block");
                        break;
                    }
                }
            }
        );
    }
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'inline-flex';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.marginLeft = '4px';

    const btns = [
        Button("Mute", "mute", userNameElement),
        Button("Block", "block", userNameElement),
    ];
    btns.forEach(btn => buttonContainer.appendChild(btn));

    const unsubscribe = settings.subscribe(
        ["isBlockMuteEnabled"],
        ({ isBlockMuteEnabled }) => {
            if (isBlockMuteEnabled) {
                userNameElement.parentElement?.parentElement?.appendChild(buttonContainer);
            } else {
                try {
                    userNameElement.parentElement?.parentElement?.removeChild(buttonContainer);
                } catch (e) {
                    unsubscribe();
                }
            }
        }
    );
}

async function applySettings(state: ExtensionState) {
    if (!state.isBlockMuteEnabled) {
        cleanup();
        return;
    }
    const settingsManager = await getSettingsManager();
    setTimeout(() => {
        settingsManager.subscribe(
            ["hideSubscriptionOffers"],
            ({ hideSubscriptionOffers }) =>
                toggleInvisible(upsaleSelectors, hideSubscriptionOffers)
        );
        settingsManager.subscribe(
            ["hideUserSubscriptions"],
            ({ hideUserSubscriptions }) => {
                toggleInvisible(subscribeToButtonSelector, hideUserSubscriptions)
            }
        );
        const userNames = document.querySelectorAll(userNameSelector);
        userNames.forEach((userName) => processUsername(userName as HTMLElement));
        observeDOMChanges(state);
    }, 1000);
}

function cleanup(): void {
    resetObserver();
    document.querySelectorAll('[messedWith="true"]').forEach((e) => {
        e.removeAttribute("messedWith");
    });

    document.querySelectorAll(userNameSelector).forEach((userNameElement) => {
        userNameElement.removeAttribute("messedWith");
        userNameElement
            .querySelectorAll("button")
            .forEach((button) => button.remove());
    });
}

// Initialize based on saved state
async function init() {
    console.log("[XQuickBlock] DOM content loaded, starting initialization...");
    const state = (await getSettingsManager()).getState();
    applySettings(state);
    console.log("[XQuickBlock] Initialized with settings:", state);
}

window.addEventListener("load", init);

// Listen for messages to update the shared state
chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, sender, sendResponse) => {
        if (message.type === "stateUpdate") {
            getSettingsManager().then((m) => m.update(message.payload));
            sendResponse({ message: "State updated successfully" });
        }
        return true;
    }
);
