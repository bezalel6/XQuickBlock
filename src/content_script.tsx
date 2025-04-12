import { sleep, toggleCSSRule, toggleInvisible } from "./utils";
import { Action, ExtensionMessage, ExtensionState } from "./types";
import { confirmDialogConfirmSelector, confirmDialogSelector, upsaleSelector, userMenuSelector } from "./constants";
import { Facebook } from "@mui/icons-material";

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

/**
 * Perform action on a user (block/mute) with improved error handling
 */
async function doToUser(
  nameElement: HTMLElement,
  action: Action
): Promise<void> {
  try {
    toggleInvisible(userMenuSelector, true)
    const moreButton =
      nameElement.parentElement?.parentElement?.parentElement?.querySelector(
        userMenuSelector
      );
    if (!moreButton) {
      console.warn("More button not found for user");
      return;
    }

    (moreButton as HTMLElement).click();
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
  console.log("My username:", username)
  return username
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
 * Add mute and block buttons to user names with improved error handling
 */
function addButtonsToUserName(userNameElement: HTMLElement): void {
  if (userNameElement.hasAttribute("messedWith") || isUserOwnAccount(userNameElement)) return;
  userNameElement.setAttribute("messedWith", "true");

  userNameElement.appendChild(createButton("Mute", "mute", userNameElement));
  userNameElement.appendChild(createButton("Block", "block", userNameElement));
}

/**
 * Observe DOM changes and add buttons to new user names
 */
function observeDOMChanges(): void {
  const targetNode = window.document.body;
  const config = { childList: true, subtree: true };

  observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const userNames = node.querySelectorAll(USER_NAME_SELECTOR);
            userNames.forEach((userName) =>
              addButtonsToUserName(userName as HTMLElement)
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
      addButtonsToUserName(userName as HTMLElement)
    );
    observeDOMChanges()
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

// Initialize based on saved state
function init() {
  console.log('[XQuickBlock] DOM content loaded, starting initialization...');

  chrome.storage.sync.get(null, (data: Partial<ExtensionState>) => {
    console.log('[XQuickBlock] Retrieved storage data:', data);

    const defaultState: ExtensionState = {
      isBlockMuteEnabled: true,
      themeOverride: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      promotedContentAction: "hide",
      hideSubscriptionOffers: true,
    };

    const finalState = {
      ...defaultState,
      ...data,
    };

    console.log('[XQuickBlock] Final state to initialize with:', finalState);
    applySettings(finalState);
    console.log('[XQuickBlock] Initialization complete');

    // Force a navigation to ensure page is fully loaded
    window.location.href = window.location.href + '#';
  });
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
