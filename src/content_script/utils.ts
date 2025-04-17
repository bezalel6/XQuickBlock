import { userMenuSelector, confirmDialogConfirmSelector } from "../constants";
import { Action, ExtensionState } from "../types";

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Toggle visibility of elements matching a selector, using {@link toggleCSSRule}
 */
export function toggleInvisible(selector: string, hide: boolean): void {
    toggleCSSRule(selector, "display", hide ? "none" : "", hide);
}

/**
 * Toggle a CSS rule in a style sheet
 */
export function toggleCSSRule(
  selector: string,
  property: string,
  value: string,
  enable: boolean
): void {
  const styleSheet = document.styleSheets[0];
  const rules = styleSheet.cssRules;
  let ruleIndex = -1;

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i] as CSSStyleRule;
    if (rule.selectorText === selector) {
      ruleIndex = i;
      break;
    }
  }

  if (enable) {
    if (ruleIndex === -1) {
      styleSheet.insertRule(
        `${selector} { ${property}: ${value}; }`,
        rules.length
      );
    }
  } else if (ruleIndex !== -1) {
    styleSheet.deleteRule(ruleIndex);
  }
}

/**
 * Wait for an element to appear in the DOM with improved error handling
 */
export async function waitFor(
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
 * Get the tweet element from a user name element
 */
export function getTweet(nameElement: HTMLElement): HTMLElement | null {
  return nameElement.closest('[role="link"]') || nameElement.closest("article") || null;
}

/**
 * Check if an element has an ad span
 */
export function hasAdSpan(parentElement: HTMLElement): boolean {
  return !!Array.from(parentElement.querySelectorAll("span")).find(
    (s) => s.textContent === "Ad"
  );
}

/**
 * Extract user details from a user name element
 */
export function extractUserDetails(userNameElement: HTMLElement): {
  fullName: string;
  username: string;
} {
  const fullName =
    userNameElement.querySelector("a div span span")?.textContent?.trim() ||
    "Unknown";
  const username =
    userNameElement
      .querySelector('a[href^="/"]')
      ?.getAttribute("href")
      ?.replace("/", "") || "unknown";
  return { fullName, username };
}

let cachedUsername: string | null = null;

/**
 * Get the current user's username from the account switcher button
 */
function getCurrentUsername(): string | null {
  if (cachedUsername) return cachedUsername;

  const accountSwitcher = document.querySelector(
    '[data-testid="SideNav_AccountSwitcher_Button"]'
  );
  if (!accountSwitcher) {
    return null;
  }

  const userAvatarContainer = accountSwitcher.querySelector(
    '[data-testid^="UserAvatar-Container-"]'
  );
  if (!userAvatarContainer) {
    return null;
  }

  cachedUsername =
    userAvatarContainer
      .getAttribute("data-testid")
      ?.replace("UserAvatar-Container-", "") || null;
  return cachedUsername;
}
/**
 * Check if the given element belongs to the user's own account
 */
export function isUserOwnAccount(element: HTMLElement): boolean {
  const currentUsername = getCurrentUsername();
  if (!currentUsername) return false;

  const elementUsername = element
    .closest('[data-testid="User-Name"]')
    ?.querySelector('a[href^="/"]')
    ?.getAttribute("href")
    ?.replace("/", "");
  return currentUsername === elementUsername;
}

/**
 * Perform action on a user (block/mute) with improved error handling
 */
export async function dispatch(
  nameElement: HTMLElement,
  action: Action
): Promise<void> {
  try {
    toggleInvisible(userMenuSelector, true);
    const moreButton = getTweet(nameElement)?.querySelector(
      userMenuSelector
    ) as HTMLElement;
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

    await waitFor(confirmDialogConfirmSelector).then((e) => e.click());
  } catch (error) {
    console.error(`Error performing ${action} action:`, error);
  } finally {
    toggleInvisible(userMenuSelector, false);
  }
}

/**
 * Get the current extension state from storage with defaults
 */
export async function getCurrentState(): Promise<ExtensionState> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (data: Partial<ExtensionState>) => {
      const defaultState: ExtensionState = {
        isBlockMuteEnabled: true,
        themeOverride: "dark",
        promotedContentAction: "hide",
        hideSubscriptionOffers: true,
        hideUserSubscriptions: true,
      };

      const finalState = {
        ...defaultState,
        ...data,
      };

      resolve(finalState);
    });
  });
}
