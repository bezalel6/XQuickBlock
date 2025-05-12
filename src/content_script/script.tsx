import { ExtensionMessage, ExtensionSettings } from '../types';
import AdPlaceholder, { adPlaceHolderClassName } from './ad-placeholder';
import Button from './dispatch-btn';
import {
  createMutationCallback,
  createPersistentMutationCallback,
  observeDOMChanges,
  resetObserver,
} from './mutation-observer';
import { getSettingsManager, SettingsManger } from '../settings-manager';
import {
  closestMessedWith,
  dispatch,
  getTweet,
  hasAdSpan,
  isMessedWith,
  isUserOwnAccount,
  setMessedWith,
  sleep,
  toggleCSSRule,
  toggleInvisible,
  waitFor,
} from './utils';
import { injectPromo as flexible, injectedContainerClassName } from './flexible-promo';
import { injectPromo } from './extension-promo';
import Query from '../lib/query';
import { className } from 'lib/css';
const BTNS = 'BUTTONS_WRAPPER';
const AD = 'AD';

function processAd(tweet: HTMLElement, userNameElement: HTMLElement, settings: SettingsManger) {
  const { promotedContentAction } = settings.getState();
  // First, clean up any previous hide effects
  const existingNotification = Query.from(tweet.parentNode!).query(`.${adPlaceHolderClassName}`);
  if (existingNotification) {
    existingNotification.remove();
  }
  tweet.classList.add(AD);
  tweet.style.height = '';

  // Then apply new effects based on the new setting
  switch (promotedContentAction) {
    case 'nothing':
      break;
    case 'hide': {
      tweet.classList.add('hidden-tweet');
      const notification = AdPlaceholder(userNameElement);
      tweet.parentNode?.insertBefore(notification, tweet);
      // tweet.style.height = "0";
      break;
    }
    case 'block': {
      dispatch(userNameElement, 'block');
      break;
    }
  }
}
/**
 * Add mute and block buttons to user names, as well as applying current Ad policy
 */
export async function processUsername(userNameElement: HTMLElement) {
  const settings = await getSettingsManager('content');
  const tweet = getTweet(userNameElement)!;
  const selector = settings.getState().selectors.userMenuSelector;
  const moreBtn = await waitFor(selector);
  if (!moreBtn || isMessedWith(userNameElement) || isUserOwnAccount(userNameElement)) return;
  setMessedWith(userNameElement);
  if (hasAdSpan(tweet)) {
    processAd(tweet, userNameElement, settings);
  }
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add(BTNS);
  buttonContainer.style.display = 'inline-flex';
  buttonContainer.style.alignItems = 'center';
  buttonContainer.style.marginLeft = '4px';

  const { isBlockEnabled, isMuteEnabled } = settings.getState();
  const btns = Array<HTMLElement>();
  btns.push(Button('Mute', 'mute', userNameElement));
  btns.push(Button('Block', 'block', userNameElement));
  btns.forEach(btn => buttonContainer.appendChild(btn));
  userNameElement.parentElement?.parentElement?.appendChild(buttonContainer);
}

async function initialize(state: ExtensionSettings) {
  const settings = await getSettingsManager('content');
  const {
    selectors: { userNameSelector },
  } = settings.getState();
  // Set up persistent mutation callback for usernames
  createPersistentMutationCallback(
    'usernameProcessor',
    node => Query.from(node).queryAll(userNameSelector),
    userNames => userNames.forEach(processUsername)
  );

  settings.subscribe(['hideSubscriptionOffers'], ({ hideSubscriptionOffers, selectors }) => {
    createPersistentMutationCallback(
      'upsale',
      node => Query.$().queryAll(selectors.upsaleSelectors, true),
      upsales => {
        upsales.forEach(u => {
          if (!hideSubscriptionOffers) {
            flexible(() => {}, {
              targetElement: u,
              insertionSelector: [
                `a[role="link"]`,
                Query.$$()($ => $.self(`[data-testid="premium-signup-tab"]`)),
              ],
              // bgAnimContainer: Query.$$()($ =>
              //   $.self('[data-testid=super-upsell-UpsellCardRenderProperties]') ? 'div div' : null
              // ),
              insertionMethod: 'after',
              settingGroup: 'hideSubscriptionOffers',
            });
          }
          toggleInvisible(u, hideSubscriptionOffers);
        });
      }
    );
    toggleInvisible(
      `.${injectedContainerClassName('hideSubscriptionOffers')}`,
      hideSubscriptionOffers
    );
    toggleInvisible(selectors.upsaleSelectors, hideSubscriptionOffers);

    createPersistentMutationCallback(
      'subscriptionOffers',
      node => Query.from(node).query(selectors.upsaleDialogSelector),
      dialog => {
        const oblitirate = () => {
          Query.$(dialog).closest('[role="dialog"]')?.remove();
          Query.$()
            .queryAll(['[role="dialog"]', '[data-testid="mask"]'])
            .forEach(d => d.remove());
          document.documentElement.style.overflowY = 'scroll';
        };
        if (hideSubscriptionOffers) {
          oblitirate();
        } else {
          injectPromo(oblitirate, dialog);
        }
      }
    );
  });

  settings.subscribe(['selectors'], ({ selectors }) => {
    if (selectors.test)
      createPersistentMutationCallback(
        'test',
        node => Query.$().query(...selectors.test),
        ee => [ee].forEach(e => (e.style.width = '5px;'))
      );
  });

  settings.subscribe(['hideUserSubscriptions'], ({ hideUserSubscriptions, selectors }) => {
    toggleInvisible(selectors.subscribeToButtonSelector, hideUserSubscriptions);
  });
  settings.subscribe(
    ['isBlockEnabled', 'isMuteEnabled'],
    ({ isBlockEnabled, isMuteEnabled, selectors: { userNameSelector } }) => {
      toggleInvisible(className(BTNS) + ' .block-btn', !isBlockEnabled, {
        maintainSize: !isMuteEnabled,
      });
      toggleInvisible(className(BTNS) + ' .mute-btn', !isMuteEnabled, {
        maintainSize: !isBlockEnabled,
      });
    }
  );
  settings.subscribe(
    ['promotedContentAction'],
    ({ promotedContentAction, selectors: { userNameSelector } }) => {
      Query.from(document)
        .queryAll(`.${AD}`)
        .forEach(ad => {
          processAd(ad as HTMLElement, Query.from(ad).query(userNameSelector)!, settings);
        });
    }
  );
  (window as any).injectPromo = injectPromo;
  observeDOMChanges(state);
}

export default async function init() {
  console.log('[XTerminator] DOM content loaded, starting initialization...');
  const state = (await getSettingsManager('content')).getState();
  initialize(state);
  console.log('[XTerminator] Initialized with settings:', state);
}
