/**
 * Utility function to create a delay
 * @param ms - Time to wait in milliseconds
 * @returns Promise that resolves after the specified time
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));


// Utility function to toggle CSS rules
export function toggleCSSRule(selector: string, cssText: string, enabled: boolean): void {
  const styleId = `xquickblock-${selector.replace(/[^a-z0-9]/gi, '-')}`;
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;

  if (enabled) {
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = `${selector} { ${cssText} }`;
  } else if (styleElement) {
    styleElement.remove();
  }
}

export const toggleInvisible = (selector: string, enabled: boolean) => toggleCSSRule(selector, 'display:none', enabled)