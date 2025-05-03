type ElementPredicate = (element: Element) => boolean;

/**
 * AdvancedSelector provides additional selection capabilities beyond standard CSS selectors
 * by implementing custom pseudo-selectors and providing a clean integration with the Query system.
 */
class AdvancedSelector {
  /**
   * Registry of custom pseudo-selectors and their implementations
   */
  private static readonly pseudoSelectors: Record<string, (value: string) => ElementPredicate> = {
    // Find elements containing specific text
    contains: (text: string) => (element: Element) =>
      element.textContent?.toLowerCase().includes(text.toLowerCase()) || false,

    // Find elements with exact text match
    exact: (text: string) => (element: Element) => element.textContent?.trim() === text.trim(),

    // Find elements where text starts with value
    startsWith: (text: string) => (element: Element) =>
      element.textContent?.toLowerCase().trim().startsWith(text.toLowerCase()) || false,

    // Find elements where text ends with value
    endsWith: (text: string) => (element: Element) =>
      element.textContent?.toLowerCase().trim().endsWith(text.toLowerCase()) || false,
  };

  /**
   * Performs a query with advanced selector support
   * @param root The root element to search within
   * @param selector The CSS selector, potentially with custom pseudo-selectors
   * @returns The matching element or null
   */
  static query<R extends HTMLElement>(root: Element | Document, selector: string): R | null {
    const { baseSelector, pseudos } = this.parseSelector(selector);

    // First, get all elements matching the base selector
    const candidates = Array.from(root.querySelectorAll<R>(baseSelector));

    // If no custom pseudo-selectors, return the first match
    if (pseudos.length === 0) {
      return candidates[0] || null;
    }

    // Apply all custom pseudo-selectors
    const match = candidates.find(element => pseudos.every(pseudo => pseudo(element)));

    return match || null;
  }

  /**
   * Performs a query for all elements with advanced selector support
   * @param root The root element to search within
   * @param selector The CSS selector, potentially with custom pseudo-selectors
   * @returns Array of matching elements
   */
  static queryAll<R extends HTMLElement>(root: Element | Document, selector: string): R[] {
    const { baseSelector, pseudos } = this.parseSelector(selector);

    // First, get all elements matching the base selector
    const candidates = Array.from(root.querySelectorAll<R>(baseSelector));

    // If no custom pseudo-selectors, return all matches
    if (pseudos.length === 0) {
      return candidates;
    }

    // Apply all custom pseudo-selectors and filter
    return candidates.filter(element => pseudos.every(pseudo => pseudo(element)));
  }

  /**
   * Parse a selector string into base selector and pseudo-selectors
   * @param selector Full selector string
   * @returns Object with baseSelector and array of predicates
   */
  private static parseSelector(selector: string): {
    baseSelector: string;
    pseudos: ElementPredicate[];
  } {
    // Regex to match our custom pseudo-selectors
    // Format: :pseudoName("value") or :pseudoName('value')
    const pseudoRegex = /:([a-zA-Z]+)\((['"])(.*?)\2\)/g;
    const pseudos: ElementPredicate[] = [];

    // Replace pseudo-selectors with empty string and collect predicates
    const baseSelector = selector
      .replace(pseudoRegex, (match, name, quote, value) => {
        if (this.pseudoSelectors[name]) {
          pseudos.push(this.pseudoSelectors[name](value));
        } else {
          console.warn(`Unknown pseudo-selector: ${name}`);
        }
        return '';
      })
      .trim();

    return { baseSelector, pseudos };
  }

  /**
   * Register a new custom pseudo-selector
   * @param name Name of the pseudo-selector (without the colon)
   * @param handler Function that returns an element predicate
   */
  static register(name: string, handler: (value: string) => ElementPredicate): void {
    this.pseudoSelectors[name] = handler;
  }

  // Convenience methods for common pseudo-selectors
  static contains(text: string): string {
    return `:contains("${text}")`;
  }

  static exact(text: string): string {
    return `:exact("${text}")`;
  }

  static startsWith(text: string): string {
    return `:startsWith("${text}")`;
  }

  static endsWith(text: string): string {
    return `:endsWith("${text}")`;
  }
}

import Query from './Query';
// Add the advanced selector methods to the Query prototype
Query.prototype.advancedQuery = function <R extends HTMLElement>(selector: string): R | null {
  return AdvancedSelector.query<R>(this.root, selector);
};

Query.prototype.advancedQueryAll = function <R extends HTMLElement>(selector: string): R[] {
  return AdvancedSelector.queryAll<R>(this.root, selector);
};

export { AdvancedSelector };
export default Query;
// Example usage:
// const $ = Query.$();
// const element = $.advancedQuery('div.content:contains("Hello world")');
// const allMatches = $.advancedQueryAll('p:startsWith("Once upon")');
