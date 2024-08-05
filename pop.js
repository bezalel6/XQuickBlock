document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');

    // Initialize the toggle switch based on the saved state
    chrome.storage.sync.get('sharedState', (data) => {
        const isChecked = data.sharedState || false;
        toggleSwitch.checked = isChecked;
        statusText.textContent = isChecked ? 'Enabled' : 'Disabled';
    });

    toggleSwitch.addEventListener('change', () => {
        const newState = toggleSwitch.checked;
        chrome.storage.sync.set({ sharedState: newState }, () => {
            statusText.textContent = newState ? 'Enabled' : 'Disabled';
        });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, { sharedState: newState });
            }
        });
    });
});
