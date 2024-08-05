// zip-files.js
import fs from "fs";
import archiver from "archiver";
import { glob } from "glob";
const outputZip = "extension.zip"; // Name of the output zip file

// Specify file patterns (globs) to include in the zip
const filesToZipPatterns = ["*.png", "script.js", "pop.js", "*.json", "*.html"];

// Resolve globs to actual file paths
const filesToZip = filesToZipPatterns.flatMap((pattern) => glob.sync(pattern));

const archive = archiver("zip", { zlib: { level: 9 } });

// Create the zip file
const output = fs.createWriteStream(outputZip);
archive.pipe(output);

filesToZip.forEach((file) => {
  archive.file(file, { name: file });
});

archive.finalize();

output.on("close", () => {
  console.log(`Successfully created ${outputZip}`);
});

output.on("error", (err) => {
  console.error("Error creating zip:", err);
});
