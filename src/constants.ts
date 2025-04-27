const SELECTORS = {
  userNameSelector: "*[data-testid=User-Name]",
  confirmDialogSelector: `[data-testid="confirmationSheetDialog"]`,
  confirmDialogConfirmSelector: `[data-testid="confirmationSheetConfirm"]`,
  userMenuSelector: '[aria-label="More"]',
  upsalePathname: "i/verified-get-verified",
  buyIntoUpsaleHref: "/i/premium_sign_up",
  upsaleSelectors: [
    '[data-testid="verified_profile_upsell"], aside:has( a[href="/i/premium_sign_up"]), a[href="/i/premium_sign_up"], div [data-testid="super-upsell-UpsellCardRenderProperties"], div [data-testid="inlinePrompt"] a[href^="/i/premium_sign_up"], [data-testid="cellInnerDiv"]:has([data-testid="inlinePrompt"])',
  ].join(", "),
  upsaleDialogSelector: '[data-testid="sheetDialog"]',
  subscribeToButtonSelector: 'div > [aria-label^="Subscribe to @"]',
  test: "h1",
} as const;

export type Selectors = typeof SELECTORS & { [name: string]: string };

export default SELECTORS;
