import { html } from 'lit';

type CSS = { css: string; define: (identifier: string) => StyleSheet };
type StyleSheet = Omit<CSS, 'define'> & { id: string; inject: () => void };
const STYLE_PREFIX = 'xterminator-style-';

const css = (strings: TemplateStringsArray, ...values: any[]): CSS => {
  let result = '';
  strings.forEach((string, i) => {
    result += string;
    if (values[i] !== undefined) {
      result += values[i];
    }
  });
  const fullResult: CSS = {
    css: result,
    define: id => ({
      css: result,
      id,
      inject: () => {
        const styleId = `${STYLE_PREFIX}${id}`;
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;

        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }

        styleElement.textContent = result;
      },
    }),
  };
  return fullResult;
};
export function className<T extends string>(name: T): `.${T}` {
  return `.${name}`;
}
export default css;
