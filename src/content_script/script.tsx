import { ExtensionMessage, ExtensionSettings } from '../types';
import AdPlaceholder, { adPlaceHolderClassName } from './ad-placeholder';
import Button from './dispatch-btn';
import { createMutationCallback, observeDOMChanges, resetObserver } from './mutation-observer';
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
import { injectPromo } from './extension-promo';
import Query from 'lib/css++';
const BTNS = 'BUTTONS_WRAPPER';
const AD = 'AD';

function processAd(tweet: HTMLElement, userNameElement: HTMLElement, settings: SettingsManger) {
  const { promotedContentAction } = settings.getState();
  // First, clean up any previous hide effects
  const existingNotification = Query.from(tweet.parentNode).query(`.${adPlaceHolderClassName}`);
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
  const btns = [];
  if (isMuteEnabled) {
    btns.push(Button('Mute', 'mute', userNameElement));
  }
  if (isBlockEnabled) {
    btns.push(Button('Block', 'block', userNameElement));
  }
  btns.forEach(btn => buttonContainer.appendChild(btn));
  userNameElement.parentElement?.parentElement?.appendChild(buttonContainer);
}

async function applySettings(state: ExtensionSettings) {
  const settings = await getSettingsManager('content');
  settings.subscribe(['selectors'], ({ selectors }) => {
    if (selectors.test) toggleCSSRule(selectors.test, 'color', 'aqua', true);
  });
  settings.subscribe(['hideSubscriptionOffers'], ({ hideSubscriptionOffers, selectors }) =>
    toggleInvisible(selectors.upsaleSelectors, hideSubscriptionOffers)
  );
  settings.subscribe(['hideUserSubscriptions'], ({ hideUserSubscriptions, selectors }) => {
    toggleInvisible(selectors.subscribeToButtonSelector, hideUserSubscriptions);
  });
  settings.subscribe(
    ['isBlockEnabled', 'isMuteEnabled'],
    ({ isBlockEnabled, isMuteEnabled, selectors: { userNameSelector } }) => {
      const shouldShowButtons = isBlockEnabled || isMuteEnabled;
      toggleInvisible(`.${BTNS}`, !shouldShowButtons);
      if (shouldShowButtons) {
        const userNames = Query.from(document).queryAll(userNameSelector);
        userNames.forEach(userName => {
          processUsername(userName as HTMLElement);
        });
      } else {
        const buttons = Query.from(document).queryAll(`.${BTNS}`);
        buttons.forEach(b => {
          const parent = closestMessedWith(b as HTMLElement);
          setMessedWith(parent, false);
          b.remove();
        });
      }
    }
  );
  settings.subscribe(
    ['promotedContentAction'],
    ({ promotedContentAction, selectors: { userNameSelector } }) => {
      Query.from(document)
        .queryAll(`.${AD}`)
        .forEach(ad => {
          processAd(ad as HTMLElement, Query.from(ad).query(userNameSelector), settings);
        });
    }
  );
  (window as any).injectPromo = injectPromo;
  observeDOMChanges(state);
}

export default async function init() {
  console.log('[XTerminator] DOM content loaded, starting initialization...');
  const state = (await getSettingsManager('content')).getState();
  applySettings(state);
  console.log('[XTerminator] Initialized with settings:', state);
}
