type ElementPredicate = (element: Element) => boolean;

/**
 * Configuration for pseudo-selector templates
 */
interface PseudoSelectorConfig {
  prefix: string;
  suffix: string;
  valueWrapper: string;
}

type GenerateSelector = (selector: typeof AdvancedSelector) => string;
/**
 * AdvancedSelector provides additional selection capabilities beyond standard CSS selectors
 * by implementing custom pseudo-selectors and providing a clean integration with the Query system.
 */
class AdvancedSelector {
  /**
   * Default template configuration for pseudo-selectors
   */
  private static defaultTemplate: PseudoSelectorConfig = {
    prefix: 'advanced-selector-',
    suffix: '',
    valueWrapper: '"',
  };

  /**
   * Current template configuration
   */
  private static template: PseudoSelectorConfig = { ...AdvancedSelector.defaultTemplate };
  static $() {
    return (selector: GenerateSelector) => {
      // Pass the selector to the function and return the result
      return selector(AdvancedSelector);
    };
  }
  /**
   * Registry of custom pseudo-selectors and their implementations
   */
  private static readonly pseudoSelectors: Record<string, (value: string) => ElementPredicate> = {
    // Find elements containing specific text
    contains: (text: string) => (element: Element) =>
      element.textContent?.toLowerCase().includes(text.toLowerCase()) || false,

    // Find elements containing any of the provided texts
    containsAny: (texts: string) => (element: Element) => {
      const searchTexts = texts.split(',').map(t => t.trim().toLowerCase());
      const elementText = element.textContent?.toLowerCase() || '';
      return searchTexts.some(text => elementText.includes(text));
    },

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
   * Configure the template for pseudo-selectors
   * @param config Partial configuration to apply
   */
  static configureTemplate(config: Partial<PseudoSelectorConfig>): void {
    this.template = { ...this.template, ...config };
  }

  /**
   * Reset template configuration to defaults
   */
  static resetTemplate(): void {
    this.template = { ...this.defaultTemplate };
  }

  /**
   * Get current template configuration
   */
  static getTemplate(): PseudoSelectorConfig {
    return { ...this.template };
  }

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
  static getPatternRegex() {
    const { prefix, suffix, valueWrapper } = this.template;

    // Create regex pattern based on current template configuration
    return new RegExp(
      `${prefix}([a-zA-Z]+)${suffix}\\(${valueWrapper}(.*?)${valueWrapper}\\)`,
      'g'
    );
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
    // Create regex pattern based on current template configuration
    const pattern = this.getPatternRegex();

    const pseudos: ElementPredicate[] = [];

    // Replace pseudo-selectors with empty string and collect predicates
    const baseSelector = selector
      .replace(pattern, (match, name, value) => {
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
    const { prefix, suffix, valueWrapper } = this.template;
    return `${prefix}contains${suffix}(${valueWrapper}${text}${valueWrapper})`;
  }

  static containsAny(...texts: string[]): string {
    const { prefix, suffix, valueWrapper } = this.template;
    return `${prefix}containsAny${suffix}(${valueWrapper}${texts.join(',')}${valueWrapper})`;
  }

  static exact(text: string): string {
    const { prefix, suffix, valueWrapper } = this.template;
    return `${prefix}exact${suffix}(${valueWrapper}${text}${valueWrapper})`;
  }

  static startsWith(text: string): string {
    const { prefix, suffix, valueWrapper } = this.template;
    return `${prefix}startsWith${suffix}(${valueWrapper}${text}${valueWrapper})`;
  }

  static endsWith(text: string): string {
    const { prefix, suffix, valueWrapper } = this.template;
    return `${prefix}endsWith${suffix}(${valueWrapper}${text}${valueWrapper})`;
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
