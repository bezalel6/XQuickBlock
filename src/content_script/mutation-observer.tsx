import { processUsername } from './script';
import { ExtensionSettings } from '../types';
import { getSettingsManager } from '../settings-manager';
import { isMessedWith, setMessedWith, toggleInvisible } from './utils';
import Reminder from './reminder';
import Query from 'lib/css++';

type Falsy = false | 0 | '' | null | undefined;
type Truthy<T> = T extends Falsy ? never : T;

type MutationCallbackMode = 'once' | 'persistent';

interface MutationCallbackBase<T> {
  condition: (newNode: HTMLElement) => T;
  callback?: (value: Truthy<T>) => void;
  mode: MutationCallbackMode;
}

interface OnceCallback<T> extends MutationCallbackBase<T> {
  mode: 'once';
  resolve: (value: Truthy<T>) => void;
}

interface PersistentCallback<T> extends MutationCallbackBase<T> {
  mode: 'persistent';
  id: string;
}

type MutationCallback<T> = OnceCallback<T> | PersistentCallback<T>;

const mutationCallbacks: MutationCallback<unknown>[] = [];

/**
 * Creates a mutation callback that executes once and then is removed
 */
export function createMutationCallback<T>(
  condition: (newNode: HTMLElement) => T,
  callback?: (value: Truthy<T>) => void
): Promise<Truthy<T>> {
  return new Promise(resolve => {
    const mutationCallback: OnceCallback<T> = {
      condition,
      callback,
      mode: 'once',
      resolve,
    };
    mutationCallbacks.push(mutationCallback as MutationCallback<unknown>);
  });
}

/**
 * Creates a mutation callback that persists and can be triggered multiple times
 * @param id Unique identifier for the callback to support removal
 * @param condition Condition to check on each mutation
 * @param callback Callback to execute when condition is met
 * @returns The callback id for later removal
 */
export function createPersistentMutationCallback<T>(
  id: string,
  condition: (newNode: HTMLElement) => T,
  callback: (value: Truthy<T>) => void
): string {
  const mutationCallback: PersistentCallback<T> = {
    id,
    condition,
    callback,
    mode: 'persistent',
  };
  const tryCondition = () => {
    const res = condition(document.body);
    if (res) {
      callback(res as any);
    }
  };

  // Replace existing callback with the same ID if it exists
  const existingIndex = mutationCallbacks.findIndex(cb => 'id' in cb && cb.id === id);
  tryCondition();
  if (existingIndex !== -1) {
    mutationCallbacks[existingIndex] = mutationCallback as MutationCallback<unknown>;
  } else {
    mutationCallbacks.push(mutationCallback as MutationCallback<unknown>);
  }

  return id;
}

/**
 * Removes a persistent mutation callback by its ID
 * @param id The ID of the callback to remove
 * @returns boolean indicating if a callback was found and removed
 */
export function removePersistentMutationCallback(id: string): boolean {
  const initialLength = mutationCallbacks.length;
  const filteredCallbacks = mutationCallbacks.filter(cb => !('id' in cb) || cb.id !== id);

  if (filteredCallbacks.length !== initialLength) {
    // Update by reference to maintain the same array
    mutationCallbacks.length = 0;
    mutationCallbacks.push(...filteredCallbacks);
    return true;
  }

  return false;
}

/**
 * Process mutation callbacks for a given node
 */
function processMutationCallbacks(node: HTMLElement): void {
  for (let i = mutationCallbacks.length - 1; i >= 0; i--) {
    const cb = mutationCallbacks[i];
    const result = cb.condition(node);

    if (result) {
      const typedResult = result as Truthy<typeof result>;

      if (cb.callback) {
        cb.callback(typedResult);
      }

      // Handle one-time callbacks
      if (cb.mode === 'once') {
        cb.resolve(typedResult);
        mutationCallbacks.splice(i, 1);
      }
      // Persistent callbacks stay in the array
    }
  }
}

async function handleUpsaleDialog(
  ogPath: string,
  { selectors, hideSubscriptionOffers }: ExtensionSettings
) {
  // toggleInvisible(selectors.upsaleDialogSelector, hideSubscriptionOffers);

  // createMutationCallback(
  //   newNode => Query.from(newNode).query(selectors.upsaleDialogSelector),
  //   dialog => {
  //     if (isMessedWith(dialog)) return;
  //     setMessedWith(dialog);
  //     if (hideSubscriptionOffers) {
  //       Query.from(dialog).query(`a[href="${selectors.buyIntoUpsaleHref}"] + button`).click();
  //       dialog.remove();
  //     } else {
  //       Query.from(dialog)
  //         .queryAll(`a[href='${selectors.buyIntoUpsaleHref}']`)
  //         .forEach(console.log);
  //       // btns.style.backgroundColor = "aqua";
  //     }
  //     toggleInvisible(selectors.upsaleDialogSelector, false);
  //   }
  // );

  history.replaceState(null, '', ogPath);
}

let observer: MutationObserver | null = null;
let observerInit = true;

/**
 * Observe DOM changes and add buttons to new user names
 */
export async function observeDOMChanges(settings: ExtensionSettings) {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };
  let currentPath = location.pathname;

  observer = new MutationObserver(async mutationsList => {
    if (
      location.pathname.endsWith(settings.selectors.upsalePathname) &&
      (observerInit || location.pathname !== currentPath)
    ) {
      await handleUpsaleDialog(currentPath, settings);
    }
    currentPath = location.pathname;
    observerInit = false;

    mutationsList.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            processMutationCallbacks(node);
          }
        });
      }
    });
  });

  observer.observe(targetNode, config);
}

export async function resetObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  // Clear all mutation callbacks when the observer is reset
  mutationCallbacks.length = 0;
}
