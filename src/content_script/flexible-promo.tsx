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
  .icon {
    width: 24px;
    height: auto;
    max-width: max-content;
  }
  .xterminate-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    background-color: #1da1f2;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    height: 40px;
    width: min-content;
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    padding: 0 1rem;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .xterminate-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(rgba(255, 255, 255, 0.1), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .xterminate-btn:hover {
    background-color: #e03d00;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(224, 61, 0, 0.3);
  }

  .xterminate-btn:hover::before {
    opacity: 1;
  }

  .xterminate-btn:active {
    transform: translateY(1px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .xterminate-btn .icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;
  }

  .xterminate-btn:hover .icon {
    transform: rotate(15deg) scale(1.1);
  }

  .xterminate-btn .text {
    margin-left: 8px;
    font-size: 14px;
    font-weight: 600;
    opacity: 0;
    width: 0;
    overflow: hidden;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .xterminate-btn:hover .text {
    opacity: 1;
    width: auto;
    margin-left: 8px;
  }

  .tooltip {
    position: fixed;
    bottom: 0;
    right: 0;
    height: min-content;
    width: 280px;
    z-index: 10000;
    background: #2a2a2a;
    color: white;
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    visibility: hidden;
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: none;
  }

  .tooltip.visible {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%; /* Changed from right to left for proper centering */
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
    line-height: 1.5;
    font-size: 14px;
  }

  .tooltip-content strong {
    color: #1da1f2;
    font-size: 1.1em;
    display: block;
    margin-bottom: 2px;
  }

  .tooltip-content .highlight {
    color: #ff6b35;
    font-weight: 600;
    display: inline-block;
    position: relative;
  }

  .tooltip-content .highlight::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 2px;
    background-color: #ff6b35;
    bottom: 0;
    left: 0;
    transform: scaleX(0);
    transform-origin: bottom right;
    transition: transform 0.3s ease;
  }

  .tooltip-content:hover .highlight::after {
    transform: scaleX(1);
    transform-origin: bottom left;
  }
  .settings-note {
    cursor: pointer;
  }
  .tooltip-content .settings-note {
    display: block;
    font-size: 0.85em;
    color: #aaa;
    text-decoration: none;
    margin-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 8px;
    transition: color 0.2s ease;
  }

  .tooltip-content .settings-note:hover {
    color: #1da1f2;
    text-decoration: underline;
  }

  /* Animation for the obliterate action */
  @keyframes obliterate {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    20% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(0);
      opacity: 0;
    }
  }

  .obliterating {
    animation: obliterate 0.5s forwards cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
`.define('flexible-promo');

interface PromoConfig {
  insertionSelector?: string;
  insertionMethod?: 'before' | 'after' | 'prepend' | 'append';
  targetElement: HTMLElement;
  customStyles?: Record<string, string>;
}

// Function to inject the promo into the subscription dialog
function injectPromo(obliterate: () => void, config: PromoConfig) {
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
  const promo = FlexiblePromo(targetEl => {
    // Apply animation to target element
    if (targetEl) {
      targetEl.classList.add('obliterating');
      setTimeout(() => {
        obliterate();
        updateSettings();
      }, 500); // Wait for animation to complete
    } else {
      obliterate();
      updateSettings();
    }
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

function FlexiblePromo(
  onObliterate: (targetEl?: HTMLElement) => void,
  customStyles?: Record<string, string>
) {
  style.inject();
  const container = document.createElement('div');
  container.classList.add('container');

  // Apply custom styles if provided
  if (customStyles) {
    Object.entries(customStyles).forEach(([key, value]) => {
      container.style[key as any] = value;
    });
  }

  const tooltipRef = createRef<HTMLDivElement>();
  let tooltipTimeout: number;

  const template = html`
    <div class="${flexiblePromoClassName}">
      <div
        class="xterminate-btn"
        @mouseenter=${() => showTooltip(true)}
        @mouseleave=${() => showTooltip(false)}
        @click=${(e: Event) => {
          e.stopPropagation();
          // todo: fix this nonsense
          // Find the target element (usually the dialog or popup)
          const targetDialog = container.closest('.dialog, .modal, .popup, [role="dialog"]');
          onObliterate(targetDialog as HTMLElement);
        }}
      >
        <img
          class="icon"
          src="${chrome.runtime.getURL('icons/transparent-icon.png')}"
          alt="X-Terminator"
        />
        <div
          class="tooltip"
          ${ref(tooltipRef)}
          @mouseenter=${() => showTooltip(true)}
          @mouseleave=${() => showTooltip(false)}
        >
          <div
            class="tooltip-content"
            @mouseenter=${() => showTooltip(true)}
            @mouseleave=${() => showTooltip(false)}
          >
            <strong>X-Terminator</strong>
            <div>Can <span class="highlight">obliterate this dialog</span> and others like it</div>
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
      </div>
    </div>
  `;

  render(template, container);

  const showTooltip = (show = true) => {
    clearTimeout(tooltipTimeout);

    if (tooltipRef.value) {
      if (show) {
        tooltipRef.value.classList.add('visible');
      } else {
        tooltipTimeout = window.setTimeout(() => {
          tooltipRef.value?.classList.remove('visible');
        }, 200);
      }
    }
  };

  setTimeout(() => {
    const tooltipEl = tooltipRef.value;
    if (tooltipEl) {
      document.body.appendChild(tooltipEl);
      // Position it next to the button
      const btn = Query.$(container).query('.xterminate-btn');
      if (btn) {
        const updateTooltipPosition = () => {
          const btnRect = btn.getBoundingClientRect();
          tooltipEl.style.top = `${btnRect.top - tooltipEl.offsetHeight - 10}px`;
          // Fix for centering tooltip properly
          const btnCenter = btnRect.left + btn.offsetWidth / 2;
          tooltipEl.style.left = `${btnCenter - tooltipEl.offsetWidth / 2}px`;
        };

        updateTooltipPosition();
        window.addEventListener('resize', updateTooltipPosition);
        window.addEventListener('scroll', updateTooltipPosition, true);
      }
    }
  }, 100);

  return container;
}

export { injectPromo };
