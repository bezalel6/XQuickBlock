import * as litHtml from 'lit-html';

declare module './lit.js' {
    export const html: typeof litHtml.html;
    export const render: typeof litHtml.render;
} 