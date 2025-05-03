import { sendMessageToBackground } from '../message-handler';
import { html, render } from '../lit';
import Query from '../lib/css++';
import { isMessedWith, setMessedWith } from './utils';

export const extensionPromoClassName = 'xterminate-promo';

// Function to ensure styles are loaded
function ensureStyles() {
  // Check if our style tag already exists
  const existingStyle = Query.from(document).query(`style[data-xterminate-promo-styles]`);
  if (existingStyle) return;

  const style = document.createElement('style');
  style.setAttribute('data-xterminate-promo-styles', '');
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
    .settings-note {
      text-decoration: underline;
      cursor: pointer;
      color: #71767B;
      transition: color 0.2s ease;
      display: inline-block;
    }
    .settings-note:hover {
      color: #1DA1F2;
    }
  `;
  document.head.appendChild(style);
}

// Function to inject the promo into the subscription dialog
function injectPromo(
  oblitirate: () => void,
  dialog = Query.from(document).query('[role="dialog"]')
) {
  // Find the subscription dialog
  if (!dialog || isMessedWith(dialog)) return;
  setMessedWith(dialog);
  // Find the action buttons container
  const actionButtons = Query.from(dialog).query(`div:has(> a[href$="/i/premium_sign_up"])`);
  if (!actionButtons) return;

  // Create and inject our promo component
  const promo = ExtensionPromo(() => {
    oblitirate();
    updateSettings();
  });
  actionButtons.insertBefore(promo, actionButtons.firstChild);
}
function onOpenSettings() {
  sendMessageToBackground({
    sentFrom: 'content',
    type: 'options',
    payload: { highlight: 'hideSubscriptionOffers' },
  })
    .then(console.log)
    .catch(console.error);
}
function updateSettings() {
  sendMessageToBackground({
    sentFrom: 'content',
    type: 'contentScriptStateUpdate',
    payload: { hideSubscriptionOffers: true },
  });
}
function ExtensionPromo(onOblitirate: () => void) {
  ensureStyles();
  const container = document.createElement('div');

  const template = html`
    <div class="${extensionPromoClassName}" @click=${onOblitirate}>
      <img class="promo-icon" src="${chrome.runtime.getURL('icons/icon.png')}" alt="X-Terminator" />
      <div class="promo-text">
        <strong>X-Terminator</strong> can <span class="highlight">oblitirate this dialog</span> and
        others like it
        <a
          @click=${(e: Event) => {
            e.stopPropagation();
            onOpenSettings();
          }}
          class="settings-note"
          >You can always change this in the settings</a
        >
      </div>
    </div>
  `;

  render(template, container);
  return container;
}

// Export the injection function
export { injectPromo };
