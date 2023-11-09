declare module '*.scss';
declare module '*.html';
declare module "*.tsx?react2markup" {
    const content: string;
    export default content;
}

declare module "*.tsx?clearCodeTokens" {
    const content: () => JSX.Element;
    export default content;
}

declare module '*.svg?inlineSvg' {
    const content: () => JSX.Element;
    export default content;
}

declare module "*.js?text" {
    const content: string;
    export default content;
}

declare module "*.html?text" {
    const content: string;
    export default content;
}