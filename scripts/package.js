const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Get the version from package.json
const packageJson = require('../package.json');
const version = packageJson.version;

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'packages');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(outputDir, `extension-v${version}.zip`));
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', () => {
    console.log(`Extension package created: extension-v${version}.zip`);
    console.log(`Total bytes: ${archive.pointer()}`);
});

// Handle warnings and errors
archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
        console.warn(err);
    } else {
        throw err;
    }
});

archive.on('error', (err) => {
    throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add the dist directory to the archive
archive.directory(path.join(__dirname, '..', 'dist'), false);

// Finalize the archive
archive.finalize(); 