const TEMPLATE_FIX = '$-$';

type CSSPPRule = {
  rootSelector: string; // ".tweet" (required)
  target?: string; // ".ad-badge" (optional, defaults to root)
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
class CSSPPRuleBuilder {
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
    return JSON.stringify(this.rule as CSSPPRule);
  }

  _addCondition(condition: Condition): this {
    this.rule.conditions!.push(condition);
    return this;
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
}
class CSSPPInterpreter {
  static evaluate(rule: CSSPPRule, root: Document | Element = document): Element[] {
    const rootElements = Array.from(root.querySelectorAll(rule.rootSelector));
    const matches: Element[] = [];

    for (const element of rootElements) {
      if (this._checkConditions(element, rule.conditions)) {
        const target = rule.target ? Array.from(element.querySelectorAll(rule.target)) : [element];
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
        case 'and':
          return cond.conditions.every(c => this._checkConditions(element, [c]));
        case 'or':
          return cond.conditions.some(c => this._checkConditions(element, [c]));
        // ... other condition types
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
}
