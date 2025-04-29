import { CSSSelector, QueryProps, SrcElement } from './css++';

const TEMPLATE = (s: string) => `$-$${s}$-$`;
const TEMPLATE_REGEX = /\$-\$(.+)\$-\$/;

type CSSPPRule = {
  rootSelector: CSSSelector; // ".tweet" (required)
  target?: CSSSelector; // ".ad-badge" (optional, defaults to root)
  conditions: Condition[];
  options?: {
    stopAtFirstMatch?: boolean; // Optimization for early exit
  };
};
type Condition =
  | { type: 'contains'; selector: string; text: string }
  | { type: 'matches-regex'; selector: string; pattern: string }
  | { type: 'exists'; selector: string }
  | { type: 'count'; selector: string; op: '>' | '<' | '='; value: number }
  | { type: 'and' | 'or'; conditions: Condition[] }
  | { type: 'not'; condition: Condition };
export class CSSPPRuleBuilder {
  private rule: Partial<CSSPPRule> = { conditions: [] };

  constructor(rootSelector: string) {
    this.rule.rootSelector = rootSelector;
  }

  target(selector: string): this {
    this.rule.target = selector;
    return this;
  }

  when(selector: string): ConditionBuilder {
    return new ConditionBuilder(this, selector);
  }

  compile(): string {
    return TEMPLATE(JSON.stringify(this.rule as CSSPPRule));
  }

  _addCondition(condition: Condition): this {
    this.rule.conditions!.push(condition);
    return this;
  }

  _getConditions(): Condition[] {
    return this.rule.conditions!;
  }
}

class ConditionBuilder {
  constructor(
    private parent: CSSPPRuleBuilder,
    private currentSelector: string
  ) {}

  contains(text: string): CSSPPRuleBuilder {
    return this.parent._addCondition({
      type: 'contains',
      selector: this.currentSelector,
      text,
    });
  }

  exists(): CSSPPRuleBuilder {
    return this.parent._addCondition({
      type: 'exists',
      selector: this.currentSelector,
    });
  }

  matchesRegex(pattern: string): CSSPPRuleBuilder {
    return this.parent._addCondition({
      type: 'matches-regex',
      selector: this.currentSelector,
      pattern,
    });
  }

  count(op: '>' | '<' | '=', value: number): CSSPPRuleBuilder {
    return this.parent._addCondition({
      type: 'count',
      selector: this.currentSelector,
      op,
      value,
    });
  }

  and(conditions: (builder: ConditionBuilder) => void): CSSPPRuleBuilder {
    const andBuilder = new ConditionBuilder(this.parent, this.currentSelector);
    conditions(andBuilder);
    return this.parent._addCondition({
      type: 'and',
      conditions: andBuilder.parent._getConditions(),
    });
  }

  or(conditions: (builder: ConditionBuilder) => void): CSSPPRuleBuilder {
    const orBuilder = new ConditionBuilder(this.parent, this.currentSelector);
    conditions(orBuilder);
    return this.parent._addCondition({
      type: 'or',
      conditions: orBuilder.parent._getConditions(),
    });
  }

  not(condition: (builder: ConditionBuilder) => void): CSSPPRuleBuilder {
    const notBuilder = new ConditionBuilder(this.parent, this.currentSelector);
    condition(notBuilder);
    return this.parent._addCondition({
      type: 'not',
      condition: notBuilder.parent._getConditions()[0],
    });
  }
}

type QueryType = 'queryAll' | 'query';
export class CSSPPInterpreter {
  static query(queryType: QueryType, selector: string, root: SrcElement): HTMLElement[] | null {
    if (TEMPLATE_REGEX.test(selector)) {
      const str = selector.match(TEMPLATE_REGEX)[1];
      console.log(`Got object ${str}`);
      const parsed = JSON.parse(str) as CSSPPRule;
      return this.evaluate(queryType, parsed, root);
    }
    switch (queryType) {
      case 'queryAll':
        return Array.from(root.querySelectorAll(selector));
      case 'query':
        return [root.querySelector(selector)];
    }
    return null;
  }
  static evaluate(queryType: QueryType, rule: CSSPPRule, root: SrcElement): HTMLElement[] | null {
    const rootElements = Array.from(root.querySelectorAll<HTMLElement>(rule.rootSelector));
    const matches: HTMLElement[] = [];

    for (const element of rootElements) {
      if (this._checkConditions(element, rule.conditions)) {
        const target = rule.target
          ? Array.from(element.querySelectorAll<HTMLElement>(rule.target))
          : [element];
        matches.push(...target);
      }
    }
    return matches;
  }

  private static _checkConditions(element: Element, conditions: Condition[]): boolean {
    return conditions.every(cond => {
      switch (cond.type) {
        case 'contains':
          return this._testContains(element, cond);
        case 'exists':
          return element.querySelector(cond.selector) !== null;
        case 'matches-regex':
          return this._testMatchesRegex(element, cond);
        case 'count':
          return this._testCount(element, cond);
        case 'and':
          return cond.conditions.every(c => this._checkConditions(element, [c]));
        case 'or':
          return cond.conditions.some(c => this._checkConditions(element, [c]));
        case 'not':
          return !this._checkConditions(element, [cond.condition]);
      }
    });
  }

  private static _testContains(
    element: Element,
    cond: Extract<Condition, { type: 'contains' }>
  ): boolean {
    const targets = element.querySelectorAll(cond.selector);
    return Array.from(targets).some(el => el.textContent?.includes(cond.text) ?? false);
  }

  private static _testMatchesRegex(
    element: Element,
    cond: Extract<Condition, { type: 'matches-regex' }>
  ): boolean {
    const targets = element.querySelectorAll(cond.selector);
    const regex = new RegExp(cond.pattern);
    return Array.from(targets).some(el => regex.test(el.textContent ?? ''));
  }

  private static _testCount(
    element: Element,
    cond: Extract<Condition, { type: 'count' }>
  ): boolean {
    const count = element.querySelectorAll(cond.selector).length;
    switch (cond.op) {
      case '>':
        return count > cond.value;
      case '<':
        return count < cond.value;
      case '=':
        return count === cond.value;
    }
  }
}
