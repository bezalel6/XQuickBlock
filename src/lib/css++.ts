type QueryProps = [string, ...string[]];
type SrcElement = Element | Document | ParentNode;

type QueryResult<R extends HTMLElement> = (R & { query: QueryFunc })

type NullableResult<R extends HTMLElement> = QueryResult<R> | null

class Query {
  constructor(readonly root: SrcElement) {
    // Make the instance callable
    return new Proxy(this, {
      apply: (target, _, args) => {
        return target.query(...args as QueryProps);
      }
    });
  }

  get src() {
    return this.root as HTMLElement
  }

  query<R extends HTMLElement>(...selectors: QueryProps): NullableResult<R> {
    return Query.res<R>(this.root.querySelector(selectors.join(", ")))
  }

  queryAll<R extends HTMLElement>(...selectors: QueryProps): QueryResult<R>[] {
    return Array.from(this.root.querySelectorAll(selectors.join(", "))).map(el => Query.res<R>(el))
  }

  closest<R extends HTMLElement>(...selectors: QueryProps): NullableResult<R> {
    return Query.res<R>(this.src.closest(selectors.join(", ")))
  }

  // Map a query result object
  protected static res<R extends HTMLElement>(res: Element): NullableResult<R> {
    if (!res) return null;

    const t = (res as QueryResult<R>)
    t.query = (...s) => Query.from(t).query(...s);
    return t
  }

  static from(element: SrcElement): Query {
    return new Query(element);
  }

  static $(): Query {
    return new Query(document);
  }
}

interface QueryFunc {

  <R extends HTMLElement>(...selectors: QueryProps): NullableResult<R>;
}
// For TypeScript to properly understand the callable functionality
// Add this interface declaration
declare interface Query extends QueryFunc {
}


export default Query