type QueryProps = [string, ...string[]];
type SrcElement = Element | Document | ParentNode;

type QueryResult<R extends HTMLElement> = R & { query: QueryFunc };

type NullableResult<R extends HTMLElement> = QueryResult<R> | null;

class Query {
  constructor(readonly root: SrcElement) {
    // Make the instance callable
    return new Proxy(this, {
      apply: (target, _, args) => {
        return target.query(...(args as QueryProps));
      },
    });
  }

  get src() {
    return this.root as HTMLElement;
  }

  query<R extends HTMLElement>(...selectors: QueryProps): NullableResult<R> {
    return Query.res<R>(this.root.querySelector(selectors.join(', ')));
  }

  queryAll<R extends HTMLElement>(...selectors: QueryProps): QueryResult<R>[] {
    return Array.from(this.root.querySelectorAll(selectors.join(', '))).map(el => Query.res<R>(el));
  }

  closest<R extends HTMLElement>(...selectors: QueryProps): NullableResult<R> {
    return Query.res<R>(this.src.closest(selectors.join(', ')));
  }

  // Map a query result object
  protected static res<R extends HTMLElement>(res: Element): NullableResult<R> {
    if (!res) return null;

    const t = res as QueryResult<R>;
    t.query = (...s) => Query.from(t).query(...s);
    return t;
  }

  static from(element: SrcElement): Query {
    return new Query(element);
  }

  static $(root: SrcElement = document): Query {
    return new Query(root);
  }
}

interface OperationHandler {
  encode: (text: string) => string;
  decode: (text: string) => string;
  query: (selector: string, text: string) => Element | undefined;
}

export class AdvancedSelector {
  private static readonly TEMPLATE = '$-$';
  private static readonly OPERATION_SEPARATOR = '::';

  private static readonly operations: Record<string, OperationHandler> = {
    containsText: {
      encode: (text: string) => `:contains("${text}")`,
      decode: (text: string) => text,
      query: (selector: string, text: string) =>
        [...document.querySelectorAll(selector)].find(e => e.textContent?.includes(text)),
    },
    // Add more operations here as needed
  };

  static encode(operation: string, text: string): string {
    if (!this.operations[operation]) {
      throw new Error(`Unknown operation: ${operation}`);
    }
    const encodedText = this.operations[operation].encode(text);
    return `${this.TEMPLATE}${operation}${this.OPERATION_SEPARATOR}${encodedText}${this.TEMPLATE}`;
  }

  static decode(selector: string): { operation: string; text: string } | null {
    const pattern = new RegExp(
      `${this.TEMPLATE}(.*?)${this.OPERATION_SEPARATOR}(.*?)${this.TEMPLATE}`
    );
    const match = selector.match(pattern);
    if (!match) return null;

    const [_, operation, encodedText] = match;
    if (!this.operations[operation]) {
      throw new Error(`Unknown operation: ${operation}`);
    }

    return {
      operation,
      text: this.operations[operation].decode(encodedText),
    };
  }

  static execute(selector: string, text: string): Element | undefined {
    const decoded = this.decode(selector);
    if (!decoded) return undefined;

    const operation = this.operations[decoded.operation];
    if (!operation) {
      throw new Error(`Unknown operation: ${decoded.operation}`);
    }

    return operation.query(selector, text);
  }

  // Convenience method for containsText operation
  static containsText(txt: TemplateStringsArray): string {
    const text = txt.raw.join('');
    return this.encode('containsText', text);
  }

  // Convenience method for querying with containsText
  static queryContainsText(selector: string, text: string): Element | undefined {
    return this.execute(this.encode('containsText', text), text);
  }
}

interface QueryFunc {
  <R extends HTMLElement>(...selectors: QueryProps): NullableResult<R>;
}
// For TypeScript to properly understand the callable functionality
// Add this interface declaration
declare interface Query extends QueryFunc {}

export default Query;
