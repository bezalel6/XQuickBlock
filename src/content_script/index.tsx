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
  await sleep(3000);
  console.log("2.....");
  console.log("2.....");
  await sleep(2000);
  console.log("1.....");
  await sleep(1000);
  try {
    const init = require("./script");
    await init();
  } catch (e) {
    console.error(e);
  }
}

contentScript();
