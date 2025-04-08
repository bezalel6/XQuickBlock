import { sleep } from "./utils";

type Action = 'block' | 'mute';

interface UserActionMessage {
  sharedState?: boolean;
}

let observer: MutationObserver | null = null;
const USER_NAME_SELECTOR = '*[data-testid=User-Name]';

/**
 * Wait for an element to appear in the DOM with improved error handling
 */
async function waitFor(selector: string, maxAttempts = 10, delay = 50): Promise<HTMLElement> {
  for (let i = 0; i < maxAttempts; i++) {
    const element = document.querySelector(selector);
    if (element) return element as HTMLElement;
    await sleep(delay);
  }
  throw new Error(`Element not found: ${selector}`);
}

/**
 * Perform action on a user (block/mute) with improved error handling
 */
async function doToUser(nameElement: HTMLElement, action: Action): Promise<void> {
  try {
    const moreButton =
    nameElement.parentElement?.parentElement?.parentElement?.querySelector(
      '[aria-label="More"]'
    );
    if (!moreButton) {
      console.warn('More button not found for user');
      return;
    }

    (moreButton as HTMLElement).click();
    await waitFor('[role="menu"]');

    let button: HTMLElement | null = null;
    if (action === 'mute') {
      button = Array.from(document.querySelectorAll('[role="menuitem"]'))
        .find((item) => item.textContent?.includes('Mute @')) as HTMLElement;
    } else {
      button = await waitFor(`[data-testid="${action}"]`);
    }

    if (!button) {
      console.warn(`${action} button not found`);
      return;
    }

    button.click();
    if (action === 'mute') return;

    await waitFor('[data-testid="confirmationSheetConfirm"]').then((e) => e.click());
  } catch (error) {
    console.error(`Error performing ${action} action:`, error);
  }
}

/**
 * Create a styled button with improved hover effects and accessibility
 */
function createButton(icon: string, action: Action,nameElement:HTMLElement): HTMLButtonElement {
  const button = document.createElement('button');
  button.innerHTML = icon;
  button.setAttribute('aria-label', `${action} user`);
  button.setAttribute('title', `Click to ${action} user (Ctrl+Click for all)`);
  
  Object.assign(button.style, {
    marginLeft: '10px',
    padding: '2px 5px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#1DA1F2',
    color: 'white',
    fontSize: '12px',
    transition: 'background-color 0.2s',
  });

  const handleHover = (e: MouseEvent) => {
    button.style.backgroundColor = '#0c85d0';
    if (e.ctrlKey) {
      button.innerHTML = `${icon} All In Here`;
    }
  };

  const resetButton = () => {
    button.style.backgroundColor = '#1DA1F2';
    button.innerHTML = icon;
  };

  button.addEventListener('mouseenter', handleHover);
  button.addEventListener('mouseleave', resetButton);
  button.addEventListener('mousemove', handleHover);

  button.addEventListener('click', async (e) => {
    try {
      if (e.ctrlKey) {
        const users = Array.from(document.querySelectorAll(USER_NAME_SELECTOR))
          .filter((e) => e instanceof HTMLElement && e.style?.display !== 'none')
          .sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            return rectB.y - rectA.y;
          }) as HTMLElement[];

        for (const user of users) {
          user.scrollIntoView({ behavior: 'smooth' });
          await sleep(100);
          await doToUser(user, action);
          await sleep(100);
        }
      } else {
        await doToUser(nameElement, action);
      }
    } catch (error) {
      console.error('Error handling button click:', error);
    }
  });

  return button;
}

/**
 * Add mute and block buttons to user names with improved error handling
 */
function addButtonsToUserName(userNameElement: HTMLElement): void {
  if (userNameElement.hasAttribute('messedWith')) return;
  userNameElement.setAttribute('messedWith', 'true');

  userNameElement.appendChild(createButton('Mute', 'mute',userNameElement));
  userNameElement.appendChild(createButton('Block', 'block',userNameElement));
}

/**
 * Observe DOM changes and add buttons to new user names
 */
function observeDOMChanges(): void {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const userNames = node.querySelectorAll(USER_NAME_SELECTOR);
            userNames.forEach((userName) => addButtonsToUserName(userName as HTMLElement));
          }
        });
      }
    });
  });

  observer.observe(targetNode, config);
}

function initialize(): void {
  const userNames = document.querySelectorAll(USER_NAME_SELECTOR);
  userNames.forEach((userName) => addButtonsToUserName(userName as HTMLElement));
  setTimeout(observeDOMChanges, 2000);
}

function cleanup(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  document.querySelectorAll('[messedWith="true"]').forEach((e) => {
    e.removeAttribute('messedWith');
  });

  document.querySelectorAll(USER_NAME_SELECTOR).forEach((userNameElement) => {
    userNameElement.removeAttribute('messedWith');
    userNameElement.querySelectorAll('button').forEach((button) => button.remove());
  });
}

// Initialize based on saved state
chrome.storage.sync.get('sharedState', (data) => {
  if (data.sharedState) {
    initialize();
  } else {
    cleanup();
  }
});

// Listen for messages to update the shared state
chrome.runtime.onMessage.addListener((request: UserActionMessage, sender, sendResponse) => {
  if (request.sharedState !== undefined) {
    if (request.sharedState) {
      initialize();
    } else {
      cleanup();
    }
    sendResponse({ message: 'State updated successfully' });
  }
  return true;
});
