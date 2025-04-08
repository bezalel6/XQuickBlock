import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

interface StorageState {
  sharedState?: boolean;
  themeOverride?: "light" | "dark" | "system";
}

const Popup: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [themeOverride, setThemeOverride] = useState<
    "light" | "dark" | "system"
  >("system");

  useEffect(() => {
    // Initialize states from storage
    chrome.storage.sync.get(
      ["sharedState", "themeOverride"],
      (data: StorageState) => {
        setIsEnabled(data.sharedState || false);
        setThemeOverride(data.themeOverride || "system");
      }
    );
  }, []);

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked;
    setIsEnabled(newState);

    // Save the new state
    chrome.storage.sync.set({ sharedState: newState }, () => {
      // Send message to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { sharedState: newState });
        }
      });
    });
  };

  const toggleTheme = () => {
    let newTheme: "light" | "dark" | "system";
    if (themeOverride === "system") {
      newTheme = "dark";
    } else if (themeOverride === "dark") {
      newTheme = "light";
    } else {
      newTheme = "system";
    }

    setThemeOverride(newTheme);
    chrome.storage.sync.set({ themeOverride: newTheme });
  };

  return (
    <div
      style={{
        width: "300px",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "var(--primary-color)",
          }}
        >
          XQuickBlock
        </h2>

        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle theme"
        >
          <div className="theme-icon">
            <div className="sun"></div>
            <div className="moon"></div>
          </div>
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <label
          style={{
            fontSize: "16px",
            color: isEnabled
              ? "var(--primary-color)"
              : "var(--secondary-color)",
          }}
        >
          {isEnabled ? "Enabled" : "Disabled"}
        </label>

        <label className="switch">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggleChange}
            className="toggle-switch"
          />
          <span className="slider round"></span>
        </label>
      </div>

      <div
        style={{
          marginTop: "20px",
          fontSize: "14px",
          color: "var(--secondary-color)",
        }}
      >
        <p>Click the Mute/Block buttons next to usernames to take action.</p>
        <p>Hold Ctrl and click to apply to all visible users.</p>
      </div>

      <style>
        {`
          :root {
            --primary-color: #1DA1F2;
            --secondary-color: #657786;
            --background-color: #ffffff;
            --toggle-bg: #657786;
            --toggle-knob: #ffffff;
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --primary-color: #1DA1F2;
              --secondary-color: #8899A6;
              --background-color: #15202B;
              --toggle-bg: #8899A6;
              --toggle-knob: #15202B;
            }
          }

          [data-theme="dark"] {
            --primary-color: #1DA1F2;
            --secondary-color: #8899A6;
            --background-color: #15202B;
            --toggle-bg: #8899A6;
            --toggle-knob: #15202B;
          }

          [data-theme="light"] {
            --primary-color: #1DA1F2;
            --secondary-color: #657786;
            --background-color: #ffffff;
            --toggle-bg: #657786;
            --toggle-knob: #ffffff;
          }

          body {
            background-color: var(--background-color);
            color: var(--secondary-color);
          }

          .theme-toggle {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: background-color 0.3s;
          }

          .theme-toggle:hover {
            background-color: var(--toggle-bg);
            opacity: 0.8;
          }

          .theme-icon {
            position: relative;
            width: 24px;
            height: 24px;
          }

          .sun, .moon {
            position: absolute;
            top: 0;
            left: 0;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: var(--secondary-color);
            transition: transform 0.5s ease, opacity 0.5s ease;
          }

          .sun {
            transform: scale(1);
            opacity: 1;
          }

          .moon {
            transform: scale(0);
            opacity: 0;
          }

          [data-theme="dark"] .sun {
            transform: scale(0);
            opacity: 0;
          }

          [data-theme="dark"] .moon {
            transform: scale(1);
            opacity: 1;
          }

          .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
          }
          
          .toggle-switch {
            opacity: 0;
            width: 0;
            height: 0;
          }
          
          .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--toggle-bg);
            transition: .4s;
          }
          
          .slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: var(--toggle-knob);
            transition: .4s;
          }
          
          .toggle-switch:checked + .slider {
            background-color: var(--primary-color);
          }
          
          .toggle-switch:checked + .slider:before {
            transform: translateX(26px);
          }
          
          .slider.round {
            border-radius: 34px;
          }
          
          .slider.round:before {
            border-radius: 50%;
          }
        `}
      </style>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
