import { upsaleSelectors, userNameSelector } from "../constants";
import { ExtensionMessage, ExtensionState } from "../types";
import AdPlaceholder from "./ad-placeholder";
import Button from "./dispatch-btn";
import { observeDOMChanges, resetObserver } from "./mutation-observer";
import { getSettingsManager } from "./settings-manager";
import { isUserOwnAccount, getTweet, hasAdSpan, dispatch, getCurrentState, toggleInvisible } from "./utils";

/**
 * Add mute and block buttons to user names, as well as applying current Ad policy
 */
export async function processUsername(userNameElement: HTMLElement) {
    if (userNameElement.hasAttribute("messedWith") || isUserOwnAccount(userNameElement)) return;
    const tweet = getTweet(userNameElement)!
    if (hasAdSpan(tweet)) {
        const behaviour = await getSettingsManager()
        behaviour.subscribe(['promotedContentAction'], ({ promotedContentAction }) => {
            switch (promotedContentAction) {
                case "nothing": break;
                case "hide": {
                    const notification = AdPlaceholder(userNameElement)
                    tweet.parentNode?.insertBefore(notification, tweet)
                    tweet.style.height = '0'
                    break;
                }
                case "block": {
                    dispatch(userNameElement, "block")
                    break;
                }

            }
        })
    }

    userNameElement.setAttribute("messedWith", "true");

    userNameElement.appendChild(Button("Mute", "mute", userNameElement));
    userNameElement.appendChild(Button("Block", "block", userNameElement));
}


async function applySettings(state: ExtensionState) {
    if (!state.isBlockMuteEnabled) {
        cleanup();
        return;
    }
    const settingsManager = await getSettingsManager()
    setTimeout(() => {
        settingsManager.subscribe(["hideSubscriptionOffers"], ({ hideSubscriptionOffers }) => toggleInvisible(upsaleSelectors, hideSubscriptionOffers))

        const userNames = document.querySelectorAll(userNameSelector);
        userNames.forEach((userName) =>
            processUsername(userName as HTMLElement)
        );
        observeDOMChanges(state)
    }, 1000)
}

function cleanup(): void {
    resetObserver()
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
    console.log('[XQuickBlock] DOM content loaded, starting initialization...');
    const state = (await getSettingsManager()).getState();
    applySettings(state);
    console.log('[XQuickBlock] Initialized with settings:', state);
}

window.addEventListener("load", init)

// Listen for messages to update the shared state
chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, sender, sendResponse) => {
        if (message.type === "stateUpdate") {
            getSettingsManager().then(m => m.update(message.payload))
            sendResponse({ message: "State updated successfully" });
        }
        return true;
    }
);

