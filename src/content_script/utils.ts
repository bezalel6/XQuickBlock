import { default as default_selectors } from "../constants";
import { Action, ExtensionSettings, Source } from "../types";
import { getSettingsManager } from "../settings-manager";

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
  toggleCSSRule(selector, "display", hide ? "none !important" : "", hide);
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
  return (
    nameElement.closest('[role="link"]') ||
    nameElement.closest("article") ||
    null
  );
}

/**
 * Check if an element has an ad span
 */
export function hasAdSpan(parentElement: HTMLElement): boolean {
  return (
    Math.random() > 0.5 ||
    !!Array.from(parentElement.querySelectorAll("span")).find(
      (s) => s.textContent === "Ad"
    )
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
  const { selectors } = (await getSettingsManager("content")).getState();
  try {
    toggleInvisible(selectors.userMenuSelector, true);
    const moreButton = getTweet(nameElement)?.querySelector(
      selectors.userMenuSelector
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

    await waitFor(selectors.confirmDialogConfirmSelector).then((e) =>
      e.click()
    );
  } catch (error) {
    console.error(`Error performing ${action} action:`, error);
  } finally {
    toggleInvisible(selectors.userMenuSelector, false);
  }
}
/**
 * Find the closest ancestor element that has been messed with
 * @param element The element to start searching from
 * @returns The closest ancestor with messedWith attribute, or null if none found
 */
export function closestMessedWith(element: Element): Element | null {
  return element.closest('[messedWith="true"]');
}

export function isMessedWith(node: Element) {
  return node.getAttribute("messedWith");
}
export function setMessedWith(node: Element, messedWith = true) {
  if (!node) return false;
  if (messedWith) return node.setAttribute("messedWith", "true");
  node.removeAttribute("messedWith");
}
