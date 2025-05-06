import { default as default_selectors, Selector } from '../constants';
import { Action, ExtensionSettings, Source } from '../types';
import { getSettingsManager } from '../settings-manager';
import Query from 'lib/query';

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
type VisibilityOptions = Partial<{
  debug: boolean;
  // should keep taking up space in the DOM while invisible
  maintainSize: boolean;
}>;
const defaultVisibilityOptions: Required<VisibilityOptions> = {
  debug: false,
  maintainSize: false,
};
const visibilityMap = [
  { property: 'display', value: 'none' },
  { property: 'visibility', value: 'hidden' },
];
/**
 * Toggle visibility of elements matching a selector, using {@link toggleCSSRule}
 */
export function toggleInvisible(
  selector: Selector,
  hide: boolean,
  options?: VisibilityOptions
): void;
export function toggleInvisible(
  element: HTMLElement,
  hide: boolean,
  options?: VisibilityOptions
): void;
export function toggleInvisible(
  selectorOrElement: Selector | HTMLElement,
  hide: boolean,
  _options?: VisibilityOptions
): void {
  const options = { ...defaultVisibilityOptions, ..._options };
  const visibility = visibilityMap[Number(options.maintainSize)];
  if (!visibility) debugger;
  if (selectorOrElement instanceof HTMLElement) {
    toggleElementCSSRule(
      selectorOrElement,
      visibility.property,
      hide ? `${visibility.value} !important` : '',
      hide,
      options.debug
    );
  } else {
    toggleCSSRule(
      selectorOrElement,
      visibility.property,
      hide ? `${visibility.value} !important` : '',
      hide,
      options.debug
    );
  }
}

/**
 * Toggle a CSS rule for a specific HTMLElement
 */
export function toggleElementCSSRule(
  element: HTMLElement,
  property: string,
  value: string,
  enable: boolean,
  debug: boolean
): void {
  // Ensure the element has an ID or data attribute for targeting
  const elementId = element.id || `toggle-target-${generateUniqueId()}`;
  if (!element.id) {
    element.id = elementId;
  }

  // Create a selector for this specific element
  const selector = `#${elementId}`;

  // Use the existing toggleCSSRule function with this specific selector
  toggleCSSRule(selector, property, value, enable, debug);
}

/**
 * Toggle a CSS rule in a dedicated style sheet
 */
export function toggleCSSRule(
  _selector: Selector,
  property: string,
  value: string,
  enable: boolean,
  debug = false
): void {
  // Get or create our dedicated stylesheet
  const stylesheetId = 'toggle-css-utility-stylesheet';
  let styleSheet = document.getElementById(stylesheetId) as HTMLStyleElement;

  if (!styleSheet) {
    // Create new stylesheet if it doesn't exist
    styleSheet = document.createElement('style');
    styleSheet.id = stylesheetId;
    document.head.appendChild(styleSheet);
  }

  const selector = normalizeCss(_selector);
  if (selector === null) return;
  const sheet = styleSheet.sheet as CSSStyleSheet;
  const rules = sheet.cssRules;
  let ruleIndex = -1;

  // Find if the rule already exists in our sheet
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i] as CSSStyleRule;
    const currentNormalized = normalizeCss(rule.selectorText);
    if (currentNormalized === selector) {
      // Check if this rule controls the same property
      if (rule.style.getPropertyValue(property) !== '') {
        ruleIndex = i;
        break;
      }
    }
  }

  if (enable) {
    const debugStyles = debug ? 'border: 3px solid #ff0000 !important;' : '';
    const cssRule = `${selector} { ${property}: ${value}; ${debugStyles} }`;

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
    if (debug) {
      // Add debug-only rule to show the element
      const debugRule = `${selector} { border: 3px solid #ff0000 !important; }`;
      sheet.insertRule(debugRule, rules.length);
    }
    sheet.deleteRule(ruleIndex);
  }
}

/**
 * Helper function for normalizing CSS selectors. Will clear any advanced selectors
 */
function normalizeCss(cssSelector: Selector): string | null {
  let clean = '';
  const cleanCss = (css: string) => css.trim().replace(/\s+/g, ' ');
  if (Array.isArray(cssSelector)) {
    clean = cssSelector
      .filter(s => {
        const ret = !Query.hasAdvancedSelector(s);
        return ret;
      })
      .map(cleanCss)
      .filter(s => !!s.length)
      .join(', ');
    if (!clean.length) return null;
  } else if (typeof cssSelector === 'string') {
    if (Query.hasAdvancedSelector(cssSelector)) return null;
    clean = cssSelector;
  }

  return cleanCss(clean);
}

/**
 * Generate a unique ID for elements that don't have one
 */
function generateUniqueId(): string {
  return `el-${Math.random().toString(36).substring(2, 9)}`;
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
    Query.$(nameElement).closest('[role="link"]') || Query.$(nameElement).closest('article') || null
  );
}

/**
 * Check if an element has an ad span
 */
export function hasAdSpan(parentElement: HTMLElement): boolean {
  return !!Query.from(parentElement)
    .queryAll('span')
    .find(s => s.textContent === 'Ad');
}
/**
 * Extract user details from a user name element
 */
export function extractUserDetails(userNameElement: HTMLElement): {
  fullName: string;
  username: string;
} {
  const fullName =
    Query.from(userNameElement).query('a div span span')?.textContent?.trim() || 'Unknown';
  const username =
    Query.from(userNameElement).query('a[href^="/"]')?.getAttribute('href')?.replace('/', '') ||
    'unknown';
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
    userAvatarContainer.getAttribute('data-testid')?.replace('UserAvatar-Container-', '') || null;
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
    ?.getAttribute('href')
    ?.replace('/', '');
  return currentUsername === elementUsername;
}
/**
 * Perform action on a user (block/mute) with improved error handling
 */
export async function dispatch(nameElement: HTMLElement, action: Action): Promise<void> {
  const { selectors } = (await getSettingsManager('content')).getState();
  try {
    toggleInvisible(selectors.userMenuSelector, true);
    const moreButton = Query.from(getTweet(nameElement)).query(selectors.userMenuSelector);
    if (!moreButton) {
      console.warn('More button not found for user');
      return;
    }
    moreButton.click();
    await waitFor('[role="menu"]');

    let button: HTMLElement | null = null;
    if (action === 'mute') {
      button = Query.from(document)
        .queryAll('[role="menuitem"]')
        .find(item => item.textContent?.includes('Mute @'));
    } else {
      button = await waitFor(`[data-testid="${action}"]`);
    }

    if (!button) {
      console.warn(`${action} button not found`);
      return;
    }

    button.click();
    if (action === 'mute') return;

    await waitFor(selectors.confirmDialogConfirmSelector).then(e => e.click());
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
type MessSrc = 'static-selectors' | 'advanced-selectors';
type MessSelector = '*' | MessSrc;
export function isMessedWith(node: Element, by: MessSelector = '*') {
  const res = node.getAttribute('messedWith');
  if (res && by !== '*') return by === res;
  return !!res;
}
export function setMessedWith(
  node: Element,
  messedWith = true,
  by: MessSelector = 'static-selectors'
) {
  if (!node) return false;
  if (messedWith) return node.setAttribute('messedWith', by);
  node.removeAttribute('messedWith');
}
