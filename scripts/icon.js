const sharp = require('sharp');
const path = require('path');

// Configuration
const SIZES = [16, 32, 48, 128];
const THEMES = ['light', 'dark'];
const SOURCE_ICON = path.join(__dirname, '../public/icons/icon.png');

// Process a single icon with given size and theme
async function processIcon(size, theme) {
  let _size = '';
  if (size) {
    _size = size;
  }
  _size += '-';
  const outputIcon = path.join(__dirname, `../public/icons/icon${_size}${theme}.png`);
  let sharpInstance = sharp(SOURCE_ICON);

  if (theme === 'light') {
    sharpInstance = sharpInstance.negate({ alpha: false });
  }
  if (size) {
    sharpInstance = sharpInstance.resize(size);
  }
  return sharpInstance.png().toFile(outputIcon);
}

// Process all icons
async function generateIcons() {
  try {
    const promises = SIZES.flatMap(size => THEMES.map(theme => processIcon(size, theme)));
    promises.push(THEMES.map(theme => processIcon(undefined, theme)));
    await Promise.all(promises);
    console.log('Icons created successfully!');
  } catch (err) {
    console.error('Error creating icons:', err);
    process.exit(1);
  }
}

// Execute the icon generation
generateIcons();
