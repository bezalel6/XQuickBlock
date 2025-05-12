import { sendMessageToBackground } from '../message-handler';
import { html, render } from '../lit';
import { ref, createRef } from 'lit-html/directives/ref.js';
import Query, { QueryProps } from '../lib/query';
import { isMessedWith, setMessedWith } from './utils';
import css, { className } from '../lib/css';
import { Computable, resolveComputable } from 'lib/computed';
import { ExtensionSettings } from 'types';

export const flexiblePromoClassName = 'flexible-promo';
export const streakBoxClassName = 'streak-box';

const style = css`
  ${className(flexiblePromoClassName)} {
    position: absolute;
    right: 10px;
    bottom: 10px;
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
  .tooltip-content .settings-note {
    display: block;
    font-size: 0.85em;
    margin-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 8px;
    transition: all 0.2s ease;
    cursor: default;
  }
  .tooltip-content .settings-note a {
    color: #1da1f2;
    cursor: pointer;
    text-decoration: underline;
  }

  .tooltip-content .settings-note:hover {
    color: #ff6b35;
    text-decoration: none;
    transform: translateX(4px);
  }
  [class*='streak-box'] {
    position: relative;
    overflow: hidden;
    border: 2px solid transparent;
    border-radius: 8px;
    transition: border-color 0.3s ease;
  }

  [class*='streak-box'].animate {
    animation: border-pulse 1s ease-in-out infinite;
  }

  @keyframes border-pulse {
    0% {
      border-color: transparent;
      box-shadow: 0 0 0 rgba(255, 0, 0, 0);
    }
    50% {
      border-color: #ff3b30;
      box-shadow: 0 0 8px rgba(255, 59, 48, 0.7);
    }
    100% {
      border-color: transparent;
      box-shadow: 0 0 0 rgba(255, 0, 0, 0);
    }
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
  insertionSelector?: QueryProps;
  bgAnimContainer?: QueryProps;
  // NTS: append-ing offsets the premium button
  insertionMethod?: 'before' | 'after' | 'prepend' | 'append';
  targetElement: HTMLElement;
  customStyles?: Record<string, string>;
  settingGroup: keyof ExtensionSettings;
}

// Functions to synchronize animations across all streak-boxes
function animateStreakBoxes(setting: PromoConfig['settingGroup']) {
  const c = `.${streakBoxClassName}-${setting}`;
  console.log('Animating with selector:', c);
  document.querySelectorAll(c).forEach(box => {
    box.classList.add('animate');
  });
}

function stopAnimatingStreakBoxes(setting: PromoConfig['settingGroup']) {
  document.querySelectorAll(`.${streakBoxClassName}-${setting}`).forEach(box => {
    box.classList.remove('animate');
  });
}

// Function to inject the promo into the subscription dialog
function injectPromo(obliterate: () => void, _config: Computable<PromoConfig>) {
  const config = resolveComputable(_config);
  const {
    insertionSelector,
    bgAnimContainer = null,
    insertionMethod = 'before',
    targetElement,
    customStyles,
    settingGroup,
  } = config;

  // Find the targetElement element
  if (!targetElement || isMessedWith(targetElement, 'advanced-selectors')) return;
  setMessedWith(targetElement, true, 'advanced-selectors');

  // Find the action buttons container if using default selector
  let container: HTMLElement;
  if (insertionSelector) {
    container = Query.from(targetElement).query(insertionSelector)!;
  } else {
    container = targetElement;
  }
  if (!container) return;

  // Add to streak-boxes collection and add class
  let streakBox: HTMLElement = bgAnimContainer
    ? (Query.$(targetElement).query(bgAnimContainer) ?? targetElement)
    : targetElement;
  streakBox.classList.add(`${streakBoxClassName}-${settingGroup}`);

  // Create and inject our promo component
  const promo = FlexiblePromo(
    targetEl => {
      // Apply animation to target element
      if (targetEl) {
        targetEl.classList.add('obliterating');
        setTimeout(() => {
          obliterate();
          updateSettings(config);
        }, 500); // Wait for animation to complete
      } else {
        obliterate();
        updateSettings(config);
      }
    },
    config,
    customStyles
  );

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

function onOpenSettings(config: PromoConfig) {
  sendMessageToBackground({
    sentFrom: 'content',
    type: 'options',
    payload: { highlight: config.settingGroup },
  })
    .then(console.log)
    .catch(console.error);
}

function updateSettings(config: PromoConfig) {
  sendMessageToBackground({
    sentFrom: 'content',
    type: 'contentScriptStateUpdate',
    payload: { [config.settingGroup]: true },
  });
}

function FlexiblePromo(
  onObliterate: (targetEl?: HTMLElement) => void,
  config: PromoConfig,
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
            <div>Click to <strong class="highlight">EXTERMINATE</strong></div>
            <span class="settings-note"
              >You can always change this
              <a
                @click=${(e: Event) => {
                  e.stopPropagation();
                  onOpenSettings(config);
                }}
                >in the settings</a
              ></span
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
        // Animate all streak-boxes instead of just the local one
        animateStreakBoxes(config.settingGroup);
        tooltipRef.value.classList.add('visible');
      } else {
        // Stop animating all streak-boxes
        stopAnimatingStreakBoxes(config.settingGroup);
        tooltipTimeout = window.setTimeout(() => {
          tooltipRef.value?.classList.remove('visible');
        }, 1000);
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
