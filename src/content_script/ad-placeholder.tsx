import { html, render } from "../lit";
import { Action } from "../types";
import { dispatch, extractUserDetails, getTweet } from "./utils";

export const adPlaceHolderClassName = "xterminate-notification";

// Function to ensure styles are loaded
function ensureStyles() {
  // Check if our style tag already exists
  const existingStyle = document.querySelector(`style[data-xterminate-styles]`);
  if (existingStyle) return;

  const style = document.createElement("style");
  style.setAttribute("data-xterminate-styles", "");
  style.textContent = `

      div:has(> div > .${adPlaceHolderClassName}) {
      background: rgba(29, 161, 242, 0.08);
      border: 1px solid rgba(29, 161, 242, 0.2);
      border-radius: 12px;
      padding: 12px 16px;
      margin: 16px 0;
      width: 100%;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      transition: all 0.2s ease;
      position: relative;
    }
    .${adPlaceHolderClassName}:hover {
      background: rgba(29, 161, 242, 0.12);
      border-color: rgba(29, 161, 242, 0.3);
    }
    .notification-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .notification-icon {
      width: 20px;
      height: 20px;
      fill: #1DA1F2;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .notification-text {
      flex: 1;
    }
    .notification-text p {
      margin: 0;
      font-size: 14px;
      color: #657786;
      line-height: 1.5;
    }
    .extension-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #1DA1F2;
      margin-bottom: 4px;
      font-weight: 500;
    }
    .inline-button {
      background: transparent;
      color: #1DA1F2;
      border: none;
      border-radius: 4px;
      padding: 0;
      font-size: inherit;
      font-weight: inherit;
      cursor: pointer;
      transition: all 0.1s;
      display: inline;
      margin: 0;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .inline-button:hover {
      background: transparent;
      outline: 2px solid #1DA1F2;
      outline-offset: 1.5px;
      text-decoration: none;
    }
    .inline-button.secondary {
      color: #1DA1F2;
    }
    .inline-button.secondary:hover {
      background: transparent;
    }
    .user-info {
      font-weight: 600;
      color: #1DA1F2;
    }
    .hidden-tweet {
      overflow: hidden;
      height: 0px;
      transition: height 0.05s ease;
      position: relative;
      z-index: 1;
    }
    .visible-tweet {
      overflow: hidden;
      transition: height 0.3s ease;
      position: relative;
      z-index: 1;
    }
    .toggle-button {
      background: transparent;
      color: #1DA1F2;
      border: none;
      padding: 4px 8px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      border-radius: 4px;
    }
    .toggle-button:hover {
      background: rgba(29, 161, 242, 0.1);
    }
    .toggle-button svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
      transition: transform 0.3s ease;
    }
    .toggle-button.expanded svg {
      transform: rotate(180deg);
    }
    .toggle-text {
      display: inline-block;
    }
  `;
  document.head.appendChild(style);
}

export default function AdPlaceholder(userNameElement: HTMLElement) {
  ensureStyles();
  const container = document.createElement("div");
  const { fullName, username } = extractUserDetails(userNameElement);
  let isContentVisible = false;

  const handleAction = async (action: Action) => {
    try {
      await dispatch(userNameElement, action);
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
    }
  };

  const toggleVisible = () => {
    const tweet = getTweet(userNameElement);
    const expanded = tweet.hasAttribute("expanded");
    const toggleButton = container.querySelector(".toggle-button");
    const toggleText = toggleButton?.querySelector(".toggle-text");

    if (expanded) {
      // Collapsing: First get the current height, then animate to zero
      tweet.style.height = `${tweet.offsetHeight}px`;
      // Force reflow to ensure the height is set before changing it
      void tweet.offsetHeight;

      // Now set height to 0 to animate collapsing
      tweet.style.height = "0px";
      tweet.classList.remove("visible-tweet");
      tweet.classList.add("hidden-tweet");
      tweet.removeAttribute("expanded");
      isContentVisible = false;
      toggleButton?.classList.remove("expanded");
    } else {
      // Expanding: First make sure the content is laid out so we can measure it
      tweet.classList.remove("hidden-tweet");
      tweet.classList.add("visible-tweet");

      // Temporarily remove transition to get accurate scrollHeight
      const originalTransition = tweet.style.transition;
      tweet.style.transition = "none";
      tweet.style.height = "auto";
      const expandedHeight = tweet.scrollHeight;
      tweet.style.height = "0px";

      // Force reflow to ensure height is reset before animation starts
      void tweet.offsetHeight;

      // Restore transition and set target height
      tweet.style.transition = originalTransition;
      tweet.style.height = `${expandedHeight}px`;
      tweet.setAttribute("expanded", "true");
      isContentVisible = true;
      toggleButton?.classList.add("expanded");

      // Optional: Once animation completes, set height to auto to handle content changes
      setTimeout(() => {
        if (tweet.hasAttribute("expanded")) {
          tweet.style.height = "auto";
        }
      }, 30);
    }

    // Update the button text
    if (toggleText) {
      toggleText.textContent = isContentVisible
        ? "Hide content"
        : "Show sponsored content";
    }
  };

  const template = html`
    <div class="${adPlaceHolderClassName}">
      <div class="notification-content">
        <img
          class="notification-icon"
          src="${chrome.runtime.getURL("icons/icon.png")}"
          alt="X-Terminator"
        />
        <div class="notification-text">
          <div class="extension-badge">X-Terminator</div>
          <p>
            Sponsored content from
            <span class="user-info">@${username}</span> has been hidden.
            <button class="inline-button" @click=${() => handleAction("block")}>
              Block
            </button>
            or
            <button
              class="inline-button secondary"
              @click=${() => handleAction("mute")}
            >
              mute
            </button>
            this account.
          </p>
          <button class="toggle-button" @click=${() => toggleVisible()}>
            <svg viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z" />
            </svg>
            <span class="toggle-text">Show sponsored content</span>
          </button>
        </div>
      </div>
    </div>
  `;

  render(template, container);
  return container;
}
