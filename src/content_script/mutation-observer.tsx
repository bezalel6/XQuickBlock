import { processUsername } from ".";
import {
  upsaleDialogSelector,
  buyIntoUpsaleHref,
  upsalePathname,
  userNameSelector,
} from "../constants";
import { ExtensionSettings } from "../types";
import { getSettingsManager } from "./settings-manager";
import { getCurrentState, toggleInvisible } from "./utils";

type Falsy = false | 0 | "" | null | undefined;
type Truthy<T> = T extends Falsy ? never : T;

type MutationCallback<T> = {
  condition: (newNode: HTMLElement) => T;
  callback: (value: Truthy<T>) => void;
};
function createMutationCallback<T>(
  condition: (newNode: HTMLElement) => T,
  callback: (value: Truthy<T>) => void
): MutationCallback<T> {
  // @ts-ignore
  return mutationCallbacks.push({ condition, callback });
}

const mutationCallbacks: MutationCallback<HTMLElement>[] = [];

/**
 * Process mutation callbacks for a given node, removing callbacks after they're executed
 */
function processMutationCallbacks(node: HTMLElement): void {
  for (let i = mutationCallbacks.length - 1; i >= 0; i--) {
    const { condition, callback } = mutationCallbacks[i];
    const result = condition(node);

    if (result) {
      callback(result as Truthy<typeof result>);
      mutationCallbacks.splice(i, 1);
    }
  }
}

async function handleUpsaleDialog(ogPath: string) {
  toggleInvisible(upsaleDialogSelector, true);
  createMutationCallback(
    (newNode) => newNode.querySelector(upsaleDialogSelector),
    (dialog) => {
      (
        dialog.querySelector(
          `a[href="${buyIntoUpsaleHref}"] + button`
        ) as HTMLButtonElement
      ).click();
      dialog.remove();
      toggleInvisible(upsaleDialogSelector, false);
    }
  );

  history.replaceState(null, "", ogPath);
}

let observer: MutationObserver | null = null;

/**
 * Observe DOM changes and add buttons to new user names
 */
export async function observeDOMChanges(settings: ExtensionSettings) {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };
  let currentPath = location.pathname;
  observer = new MutationObserver(async (mutationsList) => {
    if (location.pathname !== currentPath) {
      settings = await (await getSettingsManager()).getState();
      if (
        location.pathname.endsWith(upsalePathname) &&
        settings.hideSubscriptionOffers
      ) {
        await handleUpsaleDialog(currentPath);
      } else {
        currentPath = location.pathname;
      }
    }
    mutationsList.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const userNames = node.querySelectorAll(userNameSelector);
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
