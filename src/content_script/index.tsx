/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function contentScript() {
  try {
    const init = require('./script');
    await init.default();
  } catch (e) {
    console.error(e);
  }
}

contentScript();
