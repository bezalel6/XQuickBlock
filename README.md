# XTerminator - Chrome Extension

![screenshot](public/screenshot.png)

## Overview

**XTerminator** is a Chrome extension that aims to make twitter semi-usable again. It adds quick-access mute and block buttons directly to user elements, letting you manage your feed without jumping through hoops.

## Features

- **Quick Fly Swatting:**

  - One-click mute and block buttons right where you need them
  - Control-click to evaporate every account in a particulary toxic rabbit hole
  - Skip X's endless confirmation dialogs

- **Ads:**

  - Automatically detect promoted tweets
  - Configurable behaviour lets you hide or block any ad on your feed
  - Put a stop to the endless stream of scam crypto ads

- **Subscription:**
  - Automatically hide premium content prompts
  - Block upgrade interruptions

## Installation

1. **Download from Chrome Web Store:**

   - Visit the [Chrome Web Store page](https://chromewebstore.google.com/detail/xquickblock/fkcppikhgboddjlcoapmibcpcnlhepko)
   - Click "Add to Chrome"

2. **Install from Source:**
   - Clone this repository:
     ```bash
     git clone https://github.com/bezalel6/XTerminator.git
     ```
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" at the top right corner
   - Click "Load unpacked" and select the cloned directory

## Usage

1. **Moderate Your Feed:**

   - Click the mute or block button next to any user
   - Hold `Ctrl` and click to perform the action on every account in the current context

2. **Manage Ads:**

   - Sponsored content is automatically handled based on your settings

3. **Configure Settings:**
   - Customizeable promoted content behaviour `nothing`|`hide`|`block` (default: `hide`)
   - Toggle displaying the `Block` and `Mute` buttons above usernames (`enabled` by default)
   - Toggle hiding the constant pestering to buy a premium membership (`enabled` by default)

## Privacy

XTerminator keeps your data private:

- No data collection
- No tracking
- Everything happens in your browser
- No external API calls

## Contributing

Help make XTerminator better - contributions are welcome.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
