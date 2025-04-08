import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

interface StorageState {
  sharedState?: boolean;
}

const Popup: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  useEffect(() => {
    // Initialize the toggle switch based on the saved state
    chrome.storage.sync.get('sharedState', (data: StorageState) => {
      setIsEnabled(data.sharedState || false);
    });
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

  return (
    <div style={{ 
      width: '300px', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ 
        marginBottom: '20px',
        color: '#1DA1F2'
      }}>
        XQuickBlock
      </h2>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <label style={{ 
          fontSize: '16px',
          color: isEnabled ? '#1DA1F2' : '#657786'
        }}>
          {isEnabled ? 'Enabled' : 'Disabled'}
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

      <div style={{ 
        marginTop: '20px',
        fontSize: '14px',
        color: '#657786'
      }}>
        <p>Click the Mute/Block buttons next to usernames to take action.</p>
        <p>Hold Ctrl and click to apply to all visible users.</p>
      </div>

      <style>
        {`
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
            background-color: #657786;
            transition: .4s;
          }
          
          .slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
          }
          
          .toggle-switch:checked + .slider {
            background-color: #1DA1F2;
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
