import { sendMessageToBackground } from '../message-handler';
import { html, render } from '../lit';
import { ref, createRef } from 'lit-html/directives/ref.js';
import Query from '../lib/query';
import { isMessedWith, setMessedWith } from './utils';
import css, { className } from '../lib/css';

export const flexiblePromoClassName = 'flexible-promo';

const style = css`
  ${className(flexiblePromoClassName)} {
    position: absolute;
    right: 10px;
    bottom: 50%;
    color: white;
    z-index: 5;
  }

  .container {
    position: relative;
    width: 100%;
  }

  .xterminate-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    height: 40px;
    width: min-content;
    transition: all 0.3s ease;
    padding: 0 1rem;
    position: relative;
  }

  .xterminate-btn:hover {
    background-color: #e03d00;
  }

  .xterminate-btn .icon {
    font-size: 1.5rem;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
  }

  .tooltip {
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 10000;
    background: rgba(29, 161, 242, 1);
    visibility: hidden;
    opacity: 0;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -6px;
    border-width: 6px;
    border-style: solid;
    border-color: #2a2a2a transparent transparent transparent;
  }

  .tooltip-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    word-wrap: break-word;
    max-width: 300px;
    line-height: 1.4;
    padding: 4px 0;
  }

  .tooltip-content strong {
    color: #ff6b35;
    font-size: 1.1em;
  }

  .tooltip-content .highlight {
    color: #ff6b35;
    font-weight: 600;
  }

  .tooltip-content .settings-note {
    display: block;
    font-size: 0.85em;
    color: #888;
    text-decoration: none;
    margin-top: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 6px;
  }

  .tooltip-content .settings-note:hover {
    color: #ff6b35;
    text-decoration: underline;
  }

  .xterminate-btn:hover .tooltip {
    visibility: visible;
    opacity: 1;
  }
`.define('flexible-promo');

interface PromoConfig {
  insertionSelector?: string;
  insertionMethod?: 'before' | 'after' | 'prepend' | 'append';
  targetElement: HTMLElement;
  customStyles?: Record<string, string>;
}

// Function to inject the promo into the subscription dialog
function injectPromo(oblitirate: () => void, config: PromoConfig) {
  const { insertionSelector, insertionMethod = 'before', targetElement, customStyles } = config;

  // Find the targetElement element
  if (!targetElement || isMessedWith(targetElement)) return;
  setMessedWith(targetElement);

  // Find the action buttons container if using default selector
  let container: HTMLElement;
  if (insertionSelector) {
    container = Query.from(targetElement).query(insertionSelector)!;
  } else {
    container = targetElement;
  }
  if (!container) return;

  // Create and inject our promo component
  const promo = FlexiblePromo(() => {
    oblitirate();
    updateSettings();
  }, customStyles);

  // Insert the promo based on the specified method
  switch (insertionMethod) {
    case 'before':
      container.insertBefore(promo, container.firstChild);
      break;
    case 'after':
      container.parentNode?.insertBefore(promo, container.nextSibling);
      break;
    case 'prepend':
      container.prepend(promo);
      break;
    case 'append':
      container.append(promo);
      break;
  }
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
function FlexiblePromo(onOblitirate: () => void, customStyles?: Record<string, string>) {
  style.inject();
  const container = document.createElement('div');
  container.classList.add('container');
  console.log(ref);

  // Apply custom styles if provided
  if (customStyles) {
    Object.entries(customStyles).forEach(([key, value]) => {
      container.style[key as any] = value;
    });
  }
  const tooltipRef = createRef<HTMLDivElement>();

  const template = html`
    <div class="${flexiblePromoClassName}" @click=${onOblitirate}>
      <div class="xterminate-btn">
        <img class="icon" src="${chrome.runtime.getURL('icons/icon.png')}" alt="X-Terminator" />
        ${html`<div class="tooltip" ${ref(tooltipRef)}>
          <div class="tooltip-content">
            <strong>X-Terminator</strong> can
            <span class="highlight">oblitirate this dialog</span> and others like it
            <a
              @click=${(e: Event) => {
                e.stopPropagation();
                onOpenSettings();
              }}
              class="settings-note"
              >You can always change this in the settings</a
            >
          </div>
        </div>`}
      </div>
    </div>
  `;
  render(template, container);

  // Defer DOM manipulation to ensure ref is bound
  Promise.resolve().then(() => {
    // const tooltipEl = tooltipRef.value;
    // if (tooltipEl) {
    //   document.body.appendChild(tooltipEl);
    //   tooltipEl.style.visibility = 'visible';
    //   tooltipEl.style.opacity = '1';
    //   const btn = container.querySelector('.xterminate-btn');
    //   if (btn) {
    //     const btnRect = btn.getBoundingClientRect();
    //     tooltipEl.style.position = 'fixed';
    //     tooltipEl.style.top = `${btnRect.bottom + 8}px`;
    //     tooltipEl.style.left = `${btnRect.left}px`;
    //   }
    // }
  });

  return container;
}

export { injectPromo };
