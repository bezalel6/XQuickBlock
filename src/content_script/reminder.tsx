import { render } from "../lit";
import { html } from "../lit";

const reminderClassName = "xterminate-reminder";

const Reminder = () => {
  const container = document.createElement("div");
  const style = document.createElement("style");
  style.textContent = `
      .${reminderClassName} {
        background: rgba(29, 161, 242, 0.08);
        border: 1px solid rgba(29, 161, 242, 0.15);
        border-radius: 8px;
        padding: 12px;
        margin: 12px 0;
        width: 100%;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        transition: all 0.2s ease;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .${reminderClassName}:hover {
        background: rgba(29, 161, 242, 0.12);
        border-color: rgba(29, 161, 242, 0.25);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(29, 161, 242, 0.1);
      }

      .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .notification-icon {
        width: 20px;
        height: 20px;
        fill: #1DA1F2;
        flex-shrink: 0;
        filter: drop-shadow(0 1px 2px rgba(29, 161, 242, 0.2));
      }

      .notification-text {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
        color: #657786;
      }

      .notification-text p {
        margin: 0;
      }

      .inline-button {
        background: transparent;
        color: #1DA1F2;
        border: none;
        padding: 2px 4px;
        margin-left: 4px;
        font-size: inherit;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        border-radius: 4px;
        text-decoration: none;
      }

      .inline-button:hover {
        background: rgba(29, 161, 242, 0.1);
        color: #1a91da;
      }

      .inline-button:active {
        transform: scale(0.98);
      }

      .user-info {
        font-weight: 600;
        color: #1DA1F2;
      }
    `;
  document.head.appendChild(style);

  const handleZapAway = () => {
    container.style.animation = "slideOut 0.3s ease-out forwards";
    setTimeout(() => {
      container.remove();
    }, 300);
  };

  const template = html`
    <div class=${reminderClassName}>
      <div class="notification-content">
        <svg class="notification-icon" viewBox="0 0 24 24">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
          />
        </svg>
        <div class="notification-text">
          <p>
            Tired of seeing this?
            <button class="inline-button" @click=${handleZapAway}>
              Zap it away
            </button>
          </p>
        </div>
      </div>
    </div>
  `;

  render(template, container);
  return container;
};

export default Reminder;
