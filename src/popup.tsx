import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

interface StorageState {
  sharedState?: boolean;
  themeOverride?: "light" | "dark";
}

const Popup: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [themeOverride, setThemeOverride] = useState<"light" | "dark">(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  useEffect(() => {
    // Initialize states from storage
    chrome.storage.sync.get(
      ["sharedState", "themeOverride"],
      (data: StorageState) => {
        setIsEnabled(data.sharedState || false);
        if (data.themeOverride) {
          setThemeOverride(data.themeOverride);
        }
      }
    );
  }, []);

  // Add effect to apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeOverride);
  }, [themeOverride]);

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
    const newTheme = themeOverride === "dark" ? "light" : "dark";
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
          {themeOverride === "dark" ? (
            <SunIcon className="theme-icon" />
          ) : (
            <MoonIcon className="theme-icon" />
          )}
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
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .theme-toggle:hover {
            background-color: rgba(128, 128, 128, 0.2);
          }

          .theme-icon {
            width: 24px;
            height: 24px;
            color: var(--secondary-color);
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            transform-origin: center;
          }

          .theme-toggle:hover .theme-icon {
            transform: rotate(30deg) scale(1.1);
          }

          /* Add morphing animation */
          .theme-icon {
            animation: none;
          }

          [data-theme="dark"] .theme-icon {
            animation: morphToMoon 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }

          [data-theme="light"] .theme-icon {
            animation: morphToSun 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }

          @keyframes morphToMoon {
            0% {
              transform: scale(1) rotate(0deg);
            }
            50% {
              transform: scale(0.8) rotate(180deg);
            }
            100% {
              transform: scale(1) rotate(360deg);
            }
          }

          @keyframes morphToSun {
            0% {
              transform: scale(1) rotate(0deg);
            }
            50% {
              transform: scale(0.8) rotate(180deg);
            }
            100% {
              transform: scale(1) rotate(360deg);
            }
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
