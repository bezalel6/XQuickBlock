const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const constantsPath = path.resolve(__dirname, '../src/constants.ts');
const outputDir = path.resolve(__dirname, '../public/data');
const outputPath = path.resolve(outputDir, 'constants.json');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Use a temporary file to convert the TypeScript module to a JavaScript object
const tempFilePath = path.resolve(__dirname, '../temp-constants.js');

// Create a temporary file that imports the constants and writes them to stdout
fs.writeFileSync(
  tempFilePath,
  `
  import SELECTORS from './src/constants.ts';
  console.log(JSON.stringify(SELECTORS, null, 2));
  `
);

try {
  // Execute the temporary file with Node.js and capture the output
  const result = execSync(`npx tsx ${tempFilePath}`, { encoding: 'utf-8' });

  // Write the constants to the output file
  fs.writeFileSync(outputPath, result);

  console.log(`Constants successfully saved to ${outputPath}`);
} catch (error) {
  console.error('Error compiling constants:', error);
  process.exit(1);
} finally {
  // Clean up the temporary file
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
}

// Export the function to be used programmatically if needed
module.exports = function compileConstants() {
  return JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
};
