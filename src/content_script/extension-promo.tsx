import { sendMessageToBackground } from "../message-handler";
import { html, render } from "../lit";
import Query from "../lib/css++";

export const extensionPromoClassName = "xterminate-promo";

// Function to ensure styles are loaded
function ensureStyles() {
  // Check if our style tag already exists
  const existingStyle = Query.from(document).query(
    `style[data-xterminate-promo-styles]`
  );
  if (existingStyle) return;

  const style = document.createElement("style");
  style.setAttribute("data-xterminate-promo-styles", "");
  style.textContent = `
    .${extensionPromoClassName} {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: rgba(29, 161, 242, 0.08);
      border: 1px solid rgba(29, 161, 242, 0.2);
      border-radius: 12px;
      margin: 16px 0;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      box-sizing: border-box;
    }
    .${extensionPromoClassName}:hover {
      background: rgba(29, 161, 242, 0.12);
      border-color: rgba(29, 161, 242, 0.3);
    }
    .promo-icon {
      width: 24px;
      height: 24px;
      fill: #1DA1F2;
      flex-shrink: 0;
    }
    .promo-text {
      font-size: 15px;
      color: #E7E9EA;
      line-height: 1.4;
      flex: 1;
    }
    .promo-text strong {
      color: #1DA1F2;
      font-weight: 600;
    }
    .promo-text .highlight {
      color: #1DA1F2;
      font-weight: 500;
    }
    .promo-text .settings-note {
      font-size: 13px;
      color: #71767B;
      margin-top: 4px;
      display: block;
    }
  `;
  document.head.appendChild(style);
}

// Function to inject the promo into the subscription dialog
function injectPromo() {
  // Find the subscription dialog
  const dialog = Query.from(document).query('[role="dialog"]');
  if (!dialog) return;

  // Find the action buttons container
  const actionButtons = Query.from(dialog).query(
    `div:has(> a[href="https://x.com/i/premium_sign_up"])`
  );
  if (!actionButtons) return;

  // Create and inject our promo component
  const promo = ExtensionPromo();
  actionButtons.insertBefore(promo, actionButtons.firstChild);
}
function onClick() {
  sendMessageToBackground({
    sentFrom: "popup",
    type: "options",
    payload: { highlight: "hideSubscriptionOffers" },
  })
    .then(console.log)
    .catch(console.error);
}
export default function ExtensionPromo() {
  ensureStyles();
  const container = document.createElement("div");

  const template = html`
    <div class="${extensionPromoClassName}" @click=${onClick}>
      <img
        class="promo-icon"
        src="${chrome.runtime.getURL("icons/icon.png")}"
        alt="X-Terminator"
      />
      <div class="promo-text">
        <strong>X-Terminator</strong> will
        <span class="highlight">hide this dialog</span> and others like it
        <span class="settings-note"
          >You can always change this in the settings</span
        >
      </div>
    </div>
  `;

  render(template, container);
  return container;
}

// Export the injection function
export { injectPromo };
