const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Perform action on a user (block/mute).
 * @param {HTMLElement} nameElement - User name element.
 * @param {"block"|"mute"} action - Action to perform.
 * @returns {Promise<void>}
 */
async function doToUser(nameElement, action) {
  const moreButton =
    nameElement.parentElement.parentElement.parentElement.querySelector(
      '[aria-label="More"]'
    );
  if (!moreButton) return;

  moreButton.click();
  await waitFor('[role="menu"]');

  let button;
  if (action === "mute") {
    button = Array.from(document.querySelectorAll('[role="menuitem"]')).find(
      (item) => item.textContent.includes("Mute @")
    );
  } else {
    button = await waitFor(`[data-testid="${action}"]`);
  }
  if (!button) return;
  button.click();
  if (action === "mute") return;

  const confirmDialog = document.querySelector(
    '[data-testid="confirmationSheetDialog"]'
  );
  await waitFor('[data-testid="confirmationSheetConfirm"]').then((e) =>
    e.click()
  );
}

/**
 * Wait for an element to appear in the DOM.
 * @param {string} selector - The CSS selector of the element to wait for.
 * @returns {Promise<HTMLElement>}
 */
async function waitFor(selector) {
  for (let i = 0; i < 10; i++) {
    const element = document.querySelector(selector);
    if (element) return element;
    await sleep(50);
  }
  throw new Error(`Could not find ${selector}`);
}

/**
 * Add mute and block buttons to user names.
 * @param {HTMLElement} userNameElement - The user name element to process.
 */
function addButtonsToUserName(userNameElement) {
  if (userNameElement.hasAttribute("messedWith")) return;
  userNameElement.setAttribute("messedWith", "true");

  const createButton = (icon, action) => {
    const button = document.createElement("button");
    button.innerHTML = icon;
    button.style.marginLeft = "10px";
    button.style.cursor = "pointer";

    button.innerHTML = icon;
    button.style.padding = "2px 5px";
    button.style.borderRadius = "4px";
    button.style.border = "none";
    button.style.cursor = "pointer";
    button.style.backgroundColor = "#1DA1F2";
    button.style.color = "white";
    button.style.fontSize = "12px";
    button.style.transition = "background-color 0.2s";

    button.onmouseover = () => {};
    button.onmouseout = () => {};

    button.onmousemove =
      button.onmouseenter =
      button.onmouseover =
        (e) => {
          button.style.backgroundColor = "#0c85d0";
          if (e.ctrlKey) {
            button.innerHTML = `${icon} All In Here`;
          } else {
            button.innerHTML = icon;
          }
        };
    const reset = () => {
      button.style.backgroundColor = "#1DA1F2";
      button.innerHTML = icon;
    };
    button.onmouseleave = () => {
      reset();
    };
    button.onclick = async (e) => {
      if (e.ctrlKey) {
        const users = Array.from(document.querySelectorAll(userNameSelector))
          .filter((e) => e.style?.display != "none")
          .sort((a, b) => {
            return b.getBoundingClientRect().y - a.getBoundingClientRect().y;
          });
        for (const user of users) {
          user.scrollIntoView();
          await sleep(100);
          await doToUser(user, action);
          await sleep(100);
        }
      } else {
        doToUser(userNameElement, action);
      }
    };
    return button;
  };

  userNameElement.appendChild(createButton("Mute", "mute"));
  userNameElement.appendChild(createButton("Block", "block"));
}

/**
 * Debounce a function.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The time to wait before executing the function.
 * @returns {Function}
 */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

let observer;
const userNameSelector = "*[data-testid=User-Name]";
/**
 * Observe DOM changes and add buttons to new user names.
 */
function observeDOMChanges() {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node["querySelectorAll"]) {
            const userNames = node.querySelectorAll(userNameSelector);
            // const userNames = node.querySelectorAll("*[data-testid=User-Name]");
            userNames.forEach(addButtonsToUserName);
          }
        });
      }
    });
  });

  observer.observe(targetNode, config);
}

function initialize() {
  const userNames = document.querySelectorAll(userNameSelector);
  userNames.forEach(addButtonsToUserName);
  setTimeout(observeDOMChanges, 2000);
}

function cleanup() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  document
    .querySelectorAll('*[messedWith="true"]')
    .forEach((e) => e.removeAttribute("messedWith"));
  document
    .querySelectorAll("[data-testid=User-Name]")
    .forEach((userNameElement) => {
      userNameElement.removeAttribute("messedWith");
      userNameElement
        .querySelectorAll("button")
        .forEach((button) => button.remove());
    });
}

// Read the initial state when the content script loads
chrome.storage.sync.get("sharedState", (data) => {
  if (data.sharedState) {
    initialize();
  } else {
    cleanup();
  }
});

// Listen for messages to update the shared state
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request);
  if (request.sharedState !== undefined) {
    if (request.sharedState) {
      initialize();
    } else {
      cleanup();
    }
    sendResponse({ message: "thanks!" });
  }
  return true;
});
