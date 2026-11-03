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