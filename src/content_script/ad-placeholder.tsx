import { html, render } from "../lit";
import { Action } from "../types";
import { dispatch, extractUserDetails } from "./utils";

export default function AdPlaceholder(userNameElement: HTMLElement) {
  const container = document.createElement("div");
  const { fullName, username } = extractUserDetails(userNameElement);
  const style = document.createElement("style");
  style.textContent = `
      .xquickblock-notification {
        background: rgba(29, 161, 242, 0.1);
        border: 1px solid rgba(29, 161, 242, 0.2);
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
        width: 100%;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .xquickblock-notification:hover {
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
    `;
  document.head.appendChild(style);

  const handleAction = async (action: Action) => {
    try {
      await dispatch(userNameElement, action);
      container.style.opacity = "0";
      setTimeout(() => container.remove(), 300);
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
    }
  };

  const template = html`
    <div class="xquickblock-notification">
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
        </div>
      </div>
    </div>
  `;

  render(template, container);
  return container;
}
