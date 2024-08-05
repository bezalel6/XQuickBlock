# XQuickBlock - Chrome Extension

## Overview

**XQuickBlock** is a Chrome extension designed to add mute and block functionalities directly to user elements on web pages. This extension automatically adds buttons to user name elements, allowing users to quickly mute or block other users. Without having to go through menus and confirmation dialogs.

## Features

- **Mute and Block Users:** Adds mute and block buttons to user name elements.
- **Batch Actions:** Allows muting or blocking multiple users at once with a control-click.
- **Debounced Actions:** Ensures efficient processing of user actions.
- **Automatic Updates:** Observes DOM changes to dynamically add buttons to new user elements.

## Installation

1. **Download from Chrome Web Store:**

   - Visit the [Chrome Web Store page](https://chromewebstore.google.com/detail/xquickblock/fkcppikhgboddjlcoapmibcpcnlhepko).
   - Click "Add to Chrome" to install the extension.

2. **Install from Source:**
   - Clone this repository:
     ```bash
     git clone https://github.com/bezalel6/XQuickBlock.git
     ```
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode" at the top right corner.
   - Click "Load unpacked" and select the cloned directory.

## Usage

1. **Activate the Extension:**

   - The extension will automatically add mute and block buttons to user elements when enabled.

2. **Mute or Block a User:**
   - Click the mute or block button next to a user name element to perform the desired action.
   - Hold `Ctrl` and click the button to apply the action to all visible users on the page.
