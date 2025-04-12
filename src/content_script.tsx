import { sleep, toggleCSSRule, toggleInvisible } from "./utils";
import { Action, ExtensionMessage, ExtensionState } from "./types";
import { confirmDialogConfirmSelector, confirmDialogSelector, upsaleSelector, userMenuSelector } from "./constants";
import { html, render } from './lit.js'
let observer: MutationObserver | null = null;
const USER_NAME_SELECTOR = "*[data-testid=User-Name]";
let cachedUsername: string | null = null;

/**
 * Wait for an element to appear in the DOM with improved error handling
 */
async function waitFor(
  selector: string,
  maxAttempts = 10,
  delay = 50
): Promise<HTMLElement> {
  for (let i = 0; i < maxAttempts; i++) {
    const element = document.querySelector(selector);
    if (element) return element as HTMLElement;
    await sleep(delay);
  }
  throw new Error(`Element not found: ${selector}`);
}
function getTweet(nameElement: HTMLElement): HTMLElement | null {
  return nameElement.closest('article') || null
}
/**
 * Perform action on a user (block/mute) with improved error handling
 */
async function doToUser(
  nameElement: HTMLElement,
  action: Action
): Promise<void> {
  try {
    toggleInvisible(userMenuSelector, true)
    const moreButton = getTweet(nameElement)?.querySelector(
      userMenuSelector
    ) as HTMLElement
    if (!moreButton) {
      console.warn("More button not found for user");
      return;
    }
    moreButton.click();
    await waitFor('[role="menu"]');

    let button: HTMLElement | null = null;
    if (action === "mute") {
      button = Array.from(document.querySelectorAll('[role="menuitem"]')).find(
        (item) => item.textContent?.includes("Mute @")
      ) as HTMLElement;
    } else {
      button = await waitFor(`[data-testid="${action}"]`);
    }

    if (!button) {
      console.warn(`${action} button not found`);
      return;
    }

    button.click();
    if (action === "mute") return;

    await waitFor(confirmDialogConfirmSelector).then((e) =>
      e.click()
    );
  } catch (error) {
    console.error(`Error performing ${action} action:`, error);
  } finally {
    toggleInvisible(userMenuSelector, false)
  }
}

/**
 * Create a styled button with improved hover effects and accessibility
 */
function createButton(
  icon: string,
  action: Action,
  nameElement: HTMLElement
): HTMLButtonElement {
  const button = document.createElement("button");
  button.innerHTML = icon;
  button.setAttribute("aria-label", `${action} user`);
  button.setAttribute("title", `Click to ${action} user (Ctrl+Click for all)`);

  Object.assign(button.style, {
    marginLeft: "10px",
    padding: "2px 5px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#1DA1F2",
    color: "white",
    fontSize: "12px",
    transition: "background-color 0.2s",
  });

  const handleHover = (e: MouseEvent) => {
    button.style.backgroundColor = "#0c85d0";
    if (e.ctrlKey) {
      button.innerHTML = `${icon} All In Here`;
    }
  };

  const resetButton = () => {
    button.style.backgroundColor = "#1DA1F2";
    button.innerHTML = icon;
  };

  button.addEventListener("mouseenter", handleHover);
  button.addEventListener("mouseleave", resetButton);
  button.addEventListener("mousemove", handleHover);

  button.addEventListener("click", async (e) => {
    try {
      toggleInvisible(confirmDialogSelector, true)
      if (e.ctrlKey) {
        const users = Array.from(document.querySelectorAll(USER_NAME_SELECTOR))
          .filter(
            (e) => e instanceof HTMLElement && e.style?.display !== "none"
          )
          .sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            return rectB.y - rectA.y;
          }) as HTMLElement[];

        for (const user of users) {
          user.scrollIntoView({ behavior: "smooth" });
          await sleep(100);
          await doToUser(user, action);
          await sleep(100);
        }
      } else {
        await doToUser(nameElement, action);
      }
    } catch (error) {
      console.error("Error handling button click:", error);
    } finally {
      toggleInvisible(confirmDialogSelector, false)
    }
  });

  return button;
}

/**
 * Get the current user's username from the account switcher button
 */
function getCurrentUsername(): string | null {
  function g() {
    if (cachedUsername) return cachedUsername;

    const accountSwitcher = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    if (!accountSwitcher) {
      return null;
    }

    const userAvatarContainer = accountSwitcher.querySelector('[data-testid^="UserAvatar-Container-"]');
    if (!userAvatarContainer) {
      return null;
    }

    cachedUsername = userAvatarContainer.getAttribute('data-testid')?.replace('UserAvatar-Container-', '') || null;
    return cachedUsername;
  }
  const username = g()
  document.title = username!!
  return username
}

function hasAdSpan(parentElement: HTMLElement) {
  return !!Array.from(parentElement.querySelectorAll('span')).find(s => s.textContent === "Ad")
}
/**
 * Check if the given element belongs to the user's own account
 */
function isUserOwnAccount(element: HTMLElement): boolean {
  const currentUsername = getCurrentUsername();
  if (!currentUsername) return false;

  // Get the username from the element we're checking
  const elementUsername = element.closest('[data-testid="User-Name"]')?.querySelector('a[href^="/"]')?.getAttribute('href')?.replace('/', '');

  return currentUsername === elementUsername;
}
/**
 * Add mute and block buttons to user names, as well as applying current Ad policy
 */
function gotUsername(userNameElement: HTMLElement, settings: ExtensionState): void {
  if (userNameElement.hasAttribute("messedWith") || isUserOwnAccount(userNameElement)) return;
  const tweet = getTweet(userNameElement)!
  if (hasAdSpan(tweet)) {
    console.log(tweet)
    switch (settings.promotedContentAction) {
      case "nothing": { }
      case "hide": {
        const notification = createAdNotification()
        tweet.parentNode?.insertBefore(notification, tweet)
        tweet.style.display = 'none'
      }
      case "block":
      default: {
        tweet.style.backgroundColor = "aqua"
      }
    }
  }

  userNameElement.setAttribute("messedWith", "true");

  userNameElement.appendChild(createButton("Mute", "mute", userNameElement));
  userNameElement.appendChild(createButton("Block", "block", userNameElement));
}

/**
 * Observe DOM changes and add buttons to new user names
 */
async function observeDOMChanges(settings: ExtensionState) {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  observer = new MutationObserver(async (mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const userNames = node.querySelectorAll(USER_NAME_SELECTOR);
            userNames.forEach((userName) =>
              gotUsername(userName as HTMLElement, settings)
            );
          }
        });
      }
    });
  });

  observer.observe(targetNode, config);
}

function applySettings(state: ExtensionState): void {
  toggleInvisible(upsaleSelector, state.hideSubscriptionOffers)
  if (!state.isBlockMuteEnabled) {
    cleanup();
    return;
  }
  setTimeout(() => {
    const userNames = document.querySelectorAll(USER_NAME_SELECTOR);
    userNames.forEach((userName) =>
      gotUsername(userName as HTMLElement, state)
    );
    observeDOMChanges(state)
  }, 1000)
}

function cleanup(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  document.querySelectorAll('[messedWith="true"]').forEach((e) => {
    e.removeAttribute("messedWith");
  });

  document.querySelectorAll(USER_NAME_SELECTOR).forEach((userNameElement) => {
    userNameElement.removeAttribute("messedWith");
    userNameElement
      .querySelectorAll("button")
      .forEach((button) => button.remove());
  });
}

/**
 * Get the current extension state from storage with defaults
 */
async function getCurrentState(): Promise<ExtensionState> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (data: Partial<ExtensionState>) => {

      const defaultState: ExtensionState = {
        isBlockMuteEnabled: true,
        themeOverride: "dark",
        promotedContentAction: "hide",
        hideSubscriptionOffers: true,
      };

      const finalState = {
        ...defaultState,
        ...data,
      };

      resolve(finalState);
    });
  });
}

// Initialize based on saved state
async function init() {
  console.log('[XQuickBlock] DOM content loaded, starting initialization...');
  const state = await getCurrentState();
  applySettings(state);

  // const container = document.createElement('div');
  // document.body.prepend(container);
  // render(html`<h1>Hello, world!</h1>`, container);
}

window.addEventListener("load", init)

// Listen for messages to update the shared state
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    if (message.type === "stateUpdate") {
      applySettings(message.payload);
      sendResponse({ message: "State updated successfully" });
    }
    return true;
  }
);


function createAdNotification() {
  const container = document.createElement('div');

  const style = document.createElement('style');
  style.textContent = `
    .xquickblock-notification {
      background: rgba(29, 161, 242, 0.1);
      border: 1px solid rgba(29, 161, 242, 0.2);
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0;
      width: 100%;
      box-sizing: border-box;
      transition: all 0.3s ease;
    }
    .xquickblock-notification:hover {
      background: rgba(29, 161, 242, 0.15);
      border-color: rgba(29, 161, 242, 0.3);
    }
    .notification-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .notification-icon {
      width: 24px;
      height: 24px;
      fill: #1DA1F2;
      flex-shrink: 0;
    }
    .notification-text h3 {
      margin: 0;
      font-size: 16px;
      color: #1DA1F2;
      font-weight: 600;
    }
    .notification-text p {
      margin: 4px 0 0;
      font-size: 14px;
      color: #657786;
    }
  `;
  document.head.appendChild(style);

  const template = html`
    <div class="xquickblock-notification">
      <div class="notification-content">
        <svg class="notification-icon" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
        <div class="notification-text">
          <h3>Advertisement Hidden</h3>
          <p>This sponsored content has been hidden based on your preferences.</p>
        </div>
      </div>
    </div>
  `;

  render(template, container);
  return container;
}