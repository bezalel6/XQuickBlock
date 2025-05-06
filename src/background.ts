import { Selectors } from './constants';
import { getSettingsManager } from './settings-manager';
import { ExtensionMessage, ExtensionSettings, Source, UpdatePolicy } from './types';
import { getAllIconPaths } from './lib/themeing';

const makeUpdateURL = (source: Source = Source.MAIN) =>
  `https://raw.githubusercontent.com/bezalel6/XTerminator/refs/heads/${source}/public/data/constants.json`;

// Function to fetch and update JSON data
async function fetchAndUpdateJson() {
  try {
    // Get the settings manager instance
    const settingsManager = await getSettingsManager('background');
    const currentSettings = settingsManager.getState();
    const update = (await fetch(makeUpdateURL(currentSettings.source)).then(res =>
      res.json()
    )) as Selectors;

    // Compare old and new selectors
    const oldSelectors = currentSettings.selectors;
    const newSelectors = update;

    // Count added and removed selectors
    const oldKeys = new Set(Object.keys(oldSelectors));
    const newKeys = new Set(Object.keys(newSelectors));

    const added = [...newKeys].filter(key => !oldKeys.has(key)).length;
    const removed = [...oldKeys].filter(key => !newKeys.has(key)).length;

    const diff = added - removed;
    console.log(`[XTerminator] Selector diff: +${added} -${removed} = ${diff}`);
    return await settingsManager
      .update({
        lastUpdatedSelectors: Date.now(),
        selectors: update,
      })
      .then(() => diff);
  } catch (error) {
    console.error('[XTerminator] Error updating settings:', error);
    return 0;
  }
}

// Function to check if we need to fetch new data
async function checkAndFetchIfNeeded(alarm = false) {
  const { lastUpdatedSelectors: lastUpdatedSelectors, automaticUpdatePolicy } = (
    await getSettingsManager('background')
  ).getState();

  if ((!lastUpdatedSelectors && automaticUpdatePolicy !== 'never') || alarm) {
    await fetchAndUpdateJson();
  }
}

const ALARM_NAME = 'checkForUpdates';

// Listen for the alarm
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM_NAME) {
    checkAndFetchIfNeeded(true);
  }
});

async function applyPolicy(policy: UpdatePolicy) {
  // Set up periodic checking based on user's update policy
  const periodInMinutes = getUpdatePolicyInMinutes(policy);

  if (periodInMinutes) {
    await chrome.alarms.create(ALARM_NAME, {
      periodInMinutes,
    });
  } else {
    // If no policy is set or policy is "never", clear any existing alarm
    await chrome.alarms.clear(ALARM_NAME);
  }
}
async function init() {
  const settingsManager = await getSettingsManager('background');
  settingsManager.subscribe(['themeOverride'], ({ themeOverride }) => {
    chrome.action.setIcon({ path: getAllIconPaths(themeOverride, '../') });
  });
  settingsManager.registerMessageHandler('manualUpdate', async (_, __, sendResponse) => {
    return await fetchAndUpdateJson()
      .then(diff => {
        sendResponse({ success: true, diff });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      })
      .finally(() => {
        console.log('finished fetching and updating selectors');
      });
  });
  settingsManager.registerMessageHandler('options', async (message, __, res) => {
    const options = chrome.runtime.getURL('options.html');
    let highlight = '';
    if ('highlight' in message.payload) {
      highlight = message.payload.highlight;
    }
    const url = highlight ? `${options}?highlight=${highlight}` : options;
    return chrome.tabs.create({ url }).then(res);
  });
  settingsManager.registerMessageHandler('contentScriptStateUpdate', async (msg, __, res) => {
    return settingsManager.update(msg.payload as Partial<ExtensionSettings>, true).then(res);
  });
  settingsManager.subscribe(['automaticUpdatePolicy'], ({ automaticUpdatePolicy }) =>
    applyPolicy(automaticUpdatePolicy)
  );
}
init();
// chrome.runtime.onInstalled.addListener(async (p) => {
// chrome.action.setBadgeText({ text: "10+" });
// });

// Function to convert update policy to minutes
function getUpdatePolicyInMinutes(policy: UpdatePolicy): number | null {
  switch (policy) {
    case 'daily':
      return 24 * 60; // 24 hours
    case 'weekly':
      return 7 * 24 * 60; // 7 days
    case 'monthly':
      return 30 * 24 * 60; // 30 days
    case 'never':
      return null;
  }
}
//@ts-ignore
self.update = function () {
  return fetchAndUpdateJson();
};
(self as any).options = function () {};
