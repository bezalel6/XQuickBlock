/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function contentScript() {
  console.log("3.....");
  console.log("3.....");
  console.log("3.....");
  console.log("2.....");
  console.log("2.....");
  console.log("1.....");
  try {
    const init = require("./script");
    await init.default();
  } catch (e) {
    console.error(e);
  }
}

contentScript();
