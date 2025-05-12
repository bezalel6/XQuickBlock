import { default as $$$ } from './lib/query.js';

const SELECTORS = {
  userNameSelector: '*[data-testid=User-Name]',
  confirmDialogSelector: `[data-testid="confirmationSheetDialog"]`,
  confirmDialogConfirmSelector: `[data-testid="confirmationSheetConfirm"]`,
  userMenuSelector: '[aria-label="More"]',
  upsalePathname: 'i/verified-get-verified',
  buyIntoUpsaleHref: '/i/premium_sign_up',
  upsaleSelectors: [
    '[data-testid="verified_profile_upsell"], aside:has(a[href="/i/premium_sign_up"]), a[href="/i/premium_sign_up"], div [data-testid="super-upsell-UpsellCardRenderProperties"], div [data-testid="inlinePrompt"] a[href^="/i/premium_sign_up"], [data-testid="cellInnerDiv"]:has([data-testid="inlinePrompt"])',
    $$$.$$()(
      $ =>
        `[data-testid="tweet"] div:has( > div > div > span ${$.contains('Access your post analytics')})`
    ),
  ],
  upsaleSelectorsInsertions: [
    `a[role="link"]`,
    $$$.$$()($ => $.self(`[data-testid="premium-signup-tab"]`)),
  ],
  upsaleDialogSelector: $$$.$$()(
    $ =>
      `[data-testid="sheetDialog"] div ${$.containsAny('Want more people to see your reply?', 'Remove all ads with Premium+')}`
  ),
  subscribeToButtonSelector: 'div > [aria-label^="Subscribe to @"]',
  test: [
    `[data-testid="sheetDialog"] div` + $$$.contains(`Want more people to see your reply?`),
  ] as const,
} as const;

export type Selectors = typeof SELECTORS & { [name: string]: string | readonly string[] };
export type Selector = Selectors[keyof Selectors];
export default SELECTORS;
