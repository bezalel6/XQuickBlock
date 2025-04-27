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
    .${adPlaceHolderClassName} {
      background: rgba(29, 161, 242, 0.1);
      border: 1px solid rgba(29, 161, 242, 0.2);
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0;
      width: 100%;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .${adPlaceHolderClassName}:hover {
      background: rgba(29, 161, 242, 0.15);
      border-color: rgba(29, 161, 242, 0.3);
    }
    .notification-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .notification-icon {
      width: 24px;
      height: 24px;
      fill: #1DA1F2;
      flex-shrink: 0;
    }
    .notification-text {
      flex: 1;
    }
    .notification-text p {
      margin: 4px 0 0;
      font-size: 14px;
      color: #657786;
      line-height: 1.4;
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
      transition: height 0.3s ease;
    }
    .visible-tweet {
      overflow: hidden;
      transition: height 0.3s ease;
    }
    .toggle-button {
      background: transparent;
      color: #1DA1F2;
      border: none;
      padding: 4px 8px;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
    }
    .toggle-button:hover {
      text-decoration: underline;
    }
    .toggle-button svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
  `;
  document.head.appendChild(style);
}

export default function AdPlaceholder(userNameElement: HTMLElement) {
  ensureStyles();
  const container = document.createElement("div");
  const { fullName, username } = extractUserDetails(userNameElement);

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

      // Optional: Once animation completes, set height to auto to handle content changes
      setTimeout(() => {
        if (tweet.hasAttribute("expanded")) {
          tweet.style.height = "auto";
        }
      }, 300); // Match your transition duration (0.3s = 300ms)
    }
  };

  const template = html`
    <div class="${adPlaceHolderClassName}">
      <div class="notification-content">
        <svg class="notification-icon" viewBox="0 0 24 24">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
          />
        </svg>
        <div class="notification-text">
          <p>
            This sponsored content from
            <span class="user-info">@${username}</span> has been hidden. You can
            <button class="inline-button" @click=${() => handleAction("block")}>
              block
            </button>
            or
            <button
              class="inline-button secondary"
              @click=${() => handleAction("mute")}
            >
              mute
            </button>
            them.
          </p>
          <button class="toggle-button" @click=${() => toggleVisible()}>
            Toggle Visible
          </button>
        </div>
      </div>
    </div>
  `;

  render(template, container);
  return container;
}
