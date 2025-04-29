import { default as default_selectors } from "../constants";
import { Action, ExtensionSettings, Source } from "../types";
import { getSettingsManager } from "../settings-manager";
import Query from "lib/css++";

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
 * Toggle a CSS rule in a dedicated style sheet
 */
export function toggleCSSRule(
  _selector: string,
  property: string,
  value: string,
  enable: boolean
): void {
  // Get or create our dedicated stylesheet
  const stylesheetId = "toggle-css-utility-stylesheet";
  let styleSheet = document.getElementById(stylesheetId) as HTMLStyleElement;

  if (!styleSheet) {
    // Create new stylesheet if it doesn't exist
    styleSheet = document.createElement("style");
    styleSheet.id = stylesheetId;
    document.head.appendChild(styleSheet);
  }

  const selector = normalizeCss(_selector);
  const sheet = styleSheet.sheet as CSSStyleSheet;
  const rules = sheet.cssRules;
  let ruleIndex = -1;

  // Find if the rule already exists in our sheet
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i] as CSSStyleRule;
    const currentNormalized = normalizeCss(rule.selectorText);
    if (currentNormalized === selector) {
      // Check if this rule controls the same property
      if (rule.style.getPropertyValue(property) !== "") {
        ruleIndex = i;
        break;
      }
    }
  }

  if (enable) {
    const cssRule = `${selector} { ${property}: ${value}; }`;

    if (ruleIndex === -1) {
      // Add new rule if it doesn't exist
      sheet.insertRule(cssRule, rules.length);
    } else {
      // Update existing rule
      sheet.deleteRule(ruleIndex);
      sheet.insertRule(cssRule, rules.length);
    }
  } else if (ruleIndex !== -1) {
    // Remove rule if disable requested
    sheet.deleteRule(ruleIndex);
  }

  // Helper function for normalizing CSS selectors
  function normalizeCss(cssSelector: string): string {
    return cssSelector.trim().replace(/\s+/g, " ");
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
    const element = Query.from(document).query(selector);
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
    Query.$(nameElement).closest('[role="link"]') ||
    Query.$(nameElement).closest("article") ||
    null
  );
}

/**
 * Check if an element has an ad span
 */
export function hasAdSpan(parentElement: HTMLElement): boolean {
  return !!Query.from(parentElement).queryAll("span").find(
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
    Query.from(userNameElement).query("a div span span")?.textContent?.trim() ||
    "Unknown";
  const username =
    Query.from(userNameElement).query('a[href^="/"]')
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

  const accountSwitcher = Query.from(document).query(
    '[data-testid="SideNav_AccountSwitcher_Button"]'
  );
  if (!accountSwitcher) {
    return null;
  }

  const userAvatarContainer = Query.from(accountSwitcher).query(
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
  const elementUsername = Query.from(element)
    .closest('[data-testid="User-Name"]')
    ?.query('a[href^="/"]')
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
    const moreButton = Query.from(getTweet(nameElement)).query(selectors.userMenuSelector)
    if (!moreButton) {
      console.warn("More button not found for user");
      return;
    }
    moreButton.click();
    await waitFor('[role="menu"]');

    let button: HTMLElement | null = null;
    if (action === "mute") {
      button = Query.from((document)).queryAll('[role="menuitem"]').find(
        (item) => item.textContent?.includes("Mute @")
      )
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
export function closestMessedWith(element: HTMLElement): Element | null {
  // Instead of using closest, this is the actual best way in the specific usage context
  return Query.from(element.parentElement).query('[messedWith="true"]');
}

export function isMessedWith(node: Element) {
  return node.getAttribute("messedWith");
}
export function setMessedWith(node: Element, messedWith = true) {
  if (!node) return false;
  if (messedWith) return node.setAttribute("messedWith", "true");
  node.removeAttribute("messedWith");
}
