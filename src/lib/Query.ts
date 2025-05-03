/**
 * Type definitions for Query functionality
 */
type QueryProps = [string, ...string[]]; // At least one selector required
type SrcElement = Element | Document | ParentNode;
type QueryResult<R extends HTMLElement> = R & { query: QueryFunc };
type NullableResult<R extends HTMLElement> = QueryResult<R> | null;

/**
 * Function signature for query methods
 */
interface QueryFunc {
  <R extends HTMLElement>(...selectors: QueryProps): NullableResult<R>;
}

/**
 * Query class provides a fluent interface for DOM manipulation and traversal
 * with chainable methods and extended functionality
 */
class Query {
  /**
   * Create a new Query instance with the given root element
   * @param root The root element to query within
   */
  constructor(readonly root: SrcElement) {
    // Make the instance callable as a function through Proxy
    return new Proxy(this, {
      apply: (target, _, args) => {
        return target.query(...(args as QueryProps));
      },
    });
  }

  /**
   * Get the root element as an HTMLElement
   */
  get src(): HTMLElement {
    return this.root as HTMLElement;
  }

  /**
   * Query for a single element that matches the selector(s)
   * @param selectors One or more CSS selectors to match against
   * @returns A wrapped element or null if not found
   */
  query<R extends HTMLElement>(...selectors: QueryProps): NullableResult<R> {
    return Query.res<R>(this.root.querySelector(selectors.join(', ')));
  }

  /**
   * Query for all elements that match the selector(s)
   * @param selectors One or more CSS selectors to match against
   * @returns An array of wrapped elements
   */
  queryAll<R extends HTMLElement>(...selectors: QueryProps): QueryResult<R>[] {
    return Array.from(this.root.querySelectorAll(selectors.join(', ')))
      .map(el => Query.res<R>(el))
      .filter((el): el is QueryResult<R> => el !== null);
  }

  /**
   * Find the closest ancestor that matches the selector(s)
   * @param selectors One or more CSS selectors to match against
   * @returns A wrapped element or null if not found
   */
  closest<R extends HTMLElement>(...selectors: QueryProps): NullableResult<R> {
    return Query.res<R>(this.src.closest(selectors.join(', ')));
  }

  /**
   * Find all children that match the selector(s)
   * @param selectors One or more CSS selectors to match against
   * @returns An array of wrapped elements
   */
  children<R extends HTMLElement>(...selectors: QueryProps): QueryResult<R>[] {
    const selector = selectors.join(', ');
    return Array.from(this.src.children)
      .filter(child => child.matches(selector))
      .map(el => Query.res<R>(el))
      .filter((el): el is QueryResult<R> => el !== null);
  }

  /**
   * Find all sibling elements that match the selector(s)
   * @param selectors One or more CSS selectors to match against
   * @returns An array of wrapped elements
   */
  siblings<R extends HTMLElement>(...selectors: QueryProps): QueryResult<R>[] {
    const selector = selectors.join(', ');
    const element = this.src;
    const parent = element.parentElement;

    if (!parent) return [];

    return Array.from(parent.children)
      .filter(child => child !== element && child.matches(selector))
      .map(el => Query.res<R>(el))
      .filter((el): el is QueryResult<R> => el !== null);
  }

  /**
   * Find the parent element
   * @returns A wrapped parent element or null if not found
   */
  parent<R extends HTMLElement>(): NullableResult<R> {
    return Query.res<R>(this.src.parentElement);
  }

  /**
   * Find all parent elements up to an optional selector
   * @param selector Optional CSS selector to stop at
   * @returns An array of wrapped parent elements
   */
  parents<R extends HTMLElement>(selector?: string): QueryResult<R>[] {
    const result: Element[] = [];
    let current = this.src.parentElement;

    while (current) {
      if (selector) {
        if (current.matches(selector)) {
          result.push(current);
        }
      } else {
        result.push(current);
      }
      current = current.parentElement;
    }

    return result.map(el => Query.res<R>(el)).filter((el): el is QueryResult<R> => el !== null);
  }

  /**
   * Add event listener to the current element
   * @param type Event type
   * @param listener Event listener function
   * @param options Event listener options
   * @returns This query instance for chaining
   */
  on<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): this {
    this.src.addEventListener(type, listener, options);
    return this;
  }

  /**
   * Remove event listener from the current element
   * @param type Event type
   * @param listener Event listener function
   * @param options Event listener options
   * @returns This query instance for chaining
   */
  off<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): this {
    this.src.removeEventListener(type, listener, options);
    return this;
  }

  /**
   * Add CSS classes to the current element
   * @param classes One or more CSS classes to add
   * @returns This query instance for chaining
   */
  addClass(...classes: string[]): this {
    this.src.classList.add(...classes);
    return this;
  }

  /**
   * Remove CSS classes from the current element
   * @param classes One or more CSS classes to remove
   * @returns This query instance for chaining
   */
  removeClass(...classes: string[]): this {
    this.src.classList.remove(...classes);
    return this;
  }

  /**
   * Toggle CSS classes on the current element
   * @param classes One or more CSS classes to toggle
   * @returns This query instance for chaining
   */
  toggleClass(...classes: string[]): this {
    classes.forEach(cls => this.src.classList.toggle(cls));
    return this;
  }

  /**
   * Check if the current element has a CSS class
   * @param className CSS class to check for
   * @returns True if the element has the class, false otherwise
   */
  hasClass(className: string): boolean {
    return this.src.classList.contains(className);
  }

  /**
   * Get or set the text content of the current element
   * @param value Optional text content to set
   * @returns The text content if getting, or this query instance if setting
   */
  text(value?: string): string | this {
    if (value === undefined) {
      return this.src.textContent || '';
    }
    this.src.textContent = value;
    return this;
  }

  /**
   * Get or set the HTML content of the current element
   * @param value Optional HTML content to set
   * @returns The HTML content if getting, or this query instance if setting
   */
  html(value?: string): string | this {
    if (value === undefined) {
      return this.src.innerHTML;
    }
    this.src.innerHTML = value;
    return this;
  }

  /**
   * Get or set an attribute on the current element
   * @param name Attribute name
   * @param value Optional attribute value to set
   * @returns The attribute value if getting, or this query instance if setting
   */
  attr(name: string, value?: string): string | null | this {
    if (value === undefined) {
      return this.src.getAttribute(name);
    }
    this.src.setAttribute(name, value);
    return this;
  }

  /**
   * Remove an attribute from the current element
   * @param name Attribute name to remove
   * @returns This query instance for chaining
   */
  removeAttr(name: string): this {
    this.src.removeAttribute(name);
    return this;
  }

  /**
   * Get or set a data attribute on the current element
   * @param key Data attribute key (without 'data-' prefix)
   * @param value Optional data attribute value to set
   * @returns The data attribute value if getting, or this query instance if setting
   */
  data(key: string, value?: string): string | null | this {
    const dataKey = `data-${key}`;
    if (value === undefined) {
      return this.src.getAttribute(dataKey);
    }
    this.src.setAttribute(dataKey, value);
    return this;
  }

  /**
   * Get or set CSS properties on the current element
   * @param prop CSS property name or object of properties
   * @param value Optional CSS property value to set
   * @returns The CSS property value if getting, or this query instance if setting
   */
  css(prop: string | Record<string, string>, value?: string): string | this {
    if (typeof prop === 'string') {
      if (value === undefined) {
        return getComputedStyle(this.src).getPropertyValue(prop);
      }
      this.src.style.setProperty(prop, value);
      return this;
    }

    // Handle object of properties
    Object.entries(prop).forEach(([key, val]) => {
      this.src.style.setProperty(key, val);
    });
    return this;
  }

  /**
   * Wrap an element for query chaining
   * @param res Element to wrap
   * @returns A wrapped element or null if the input is falsy
   */
  protected static res<R extends HTMLElement>(res: Element | null): NullableResult<R> {
    if (!res) return null;

    const t = res as QueryResult<R>;
    t.query = (...s) => Query.from(t).query(...s);
    return t;
  }

  /**
   * Create a new Query instance from an element
   * @param element Source element
   * @returns A new Query instance
   */
  static from(element: SrcElement): Query {
    return new Query(element);
  }

  /**
   * Create a Query instance from a selector or default root
   * @param root Root element or selector
   * @returns A new Query instance
   */
  static $(root: SrcElement | string = document): Query {
    if (typeof root === 'string') {
      const element = document.querySelector(root);
      return new Query(element || document);
    }
    return new Query(root);
  }
}

// Ensure that the Query interface includes the QueryFunc interface
// This is necessary for TypeScript to understand the callable functionality
interface Query extends QueryFunc {
  advancedQuery<R extends HTMLElement>(selector: string): R | null;
  advancedQueryAll<R extends HTMLElement>(selector: string): R[];
}

export default Query;
