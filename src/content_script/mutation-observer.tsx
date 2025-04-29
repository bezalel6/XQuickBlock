import { processUsername } from "./script";
import { ExtensionSettings } from "../types";
import { getSettingsManager } from "../settings-manager";
import { isMessedWith, setMessedWith, toggleInvisible } from "./utils";
import Reminder from "./reminder";
import Query from "lib/css++";

type Falsy = false | 0 | "" | null | undefined;
type Truthy<T> = T extends Falsy ? never : T;

type MutationCallback<T> = {
  condition: (newNode: HTMLElement) => T;
  callback?: (value: Truthy<T>) => void;
  resolve: (value: Truthy<T>) => void;
};

const mutationCallbacks: MutationCallback<unknown>[] = [];

export function createMutationCallback<T>(
  condition: (newNode: HTMLElement) => T,
  callback?: (value: Truthy<T>) => void
): Promise<Truthy<T>> {
  return new Promise((resolve) => {
    const mutationCallback: MutationCallback<T> = {
      condition,
      callback,
      resolve,
    };
    mutationCallbacks.push(mutationCallback as MutationCallback<unknown>);
  });
}

/**
 * Process mutation callbacks for a given node, removing callbacks after they're executed
 */
function processMutationCallbacks(node: HTMLElement): void {
  for (let i = mutationCallbacks.length - 1; i >= 0; i--) {
    const { condition, callback, resolve } = mutationCallbacks[i];
    const result = condition(node);

    if (result) {
      if (callback) callback(result as Truthy<typeof result>);
      resolve(result as Truthy<typeof result>);
      mutationCallbacks.splice(i, 1);
    }
  }
}

async function handleUpsaleDialog(
  ogPath: string,
  { selectors, hideSubscriptionOffers }: ExtensionSettings
) {
  toggleInvisible(selectors.upsaleDialogSelector, hideSubscriptionOffers);
  createMutationCallback(
    (newNode) => Query.from(newNode).query(selectors.upsaleDialogSelector),
    (dialog) => {
      if (isMessedWith(dialog)) return;
      setMessedWith(dialog);
      if (hideSubscriptionOffers) {
        (
          Query.from(dialog).query(
            `a[href="${selectors.buyIntoUpsaleHref}"] + button`
          )
        ).click();
        dialog.remove();
      } else {
        Query.from(dialog).queryAll(`a[href='${selectors.buyIntoUpsaleHref}']`).forEach(console.log)
        // btns.style.backgroundColor = "aqua";
      }
      toggleInvisible(selectors.upsaleDialogSelector, false);
    }
  );

  history.replaceState(null, "", ogPath);
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
  observer = new MutationObserver(async (mutationsList) => {
    if (
      location.pathname.endsWith(settings.selectors.upsalePathname) &&
      (observerInit || location.pathname !== currentPath)
    ) {
      await handleUpsaleDialog(currentPath, settings);
    }
    currentPath = location.pathname;
    observerInit = false;
    mutationsList.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const userNames = node.querySelectorAll(
              settings.selectors.userNameSelector
            );
            userNames.forEach((userName) =>
              processUsername(userName as HTMLElement)
            );
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
}
