import * as litHtml from 'lit-html';
import { ref as refDirective } from 'lit-html/directives/ref.js';

declare module './lit.js' {
  export const html: typeof litHtml.html;
  export const render: typeof litHtml.render;
  export const ref: typeof refDirective;
}
