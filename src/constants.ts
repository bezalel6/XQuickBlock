export const userNameSelector = "*[data-testid=User-Name]";
export const confirmDialogSelector = `[data-testid="confirmationSheetDialog"]`;
export const confirmDialogConfirmSelector = `[data-testid="confirmationSheetConfirm"]`;
export const userMenuSelector = '[aria-label="More"]';
export const upsalePathname = "i/verified-get-verified";
export const buyIntoUpsaleHref = "/i/premium_sign_up";
export const upsaleSelectors = [
  '[data-testid="verified_profile_upsell"]',
  `aside:has( a[href="${buyIntoUpsaleHref}"])`,
  `a[href="${buyIntoUpsaleHref}"]`,
  `div [data-testid="super-upsell-UpsellCardRenderProperties"]`,
].join(", ");
export const upsaleDialogSelector = '[data-testid="sheetDialog"]';
export const subscribeToButtonSelector = 'div > [aria-label^="Subscribe to @"]';
