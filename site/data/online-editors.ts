import CodeSandboxSvg from '~/public/images/online-editors/code-sandbox.svg';
import CodepenSvg from '~/public/images/online-editors/codepen.svg';
import StackBlitzSvg from '~/public/images/online-editors/stack-blitz.svg';

export const onlineEditors = [
    { name: 'Stack Blitz', Logo: StackBlitzSvg, class: 'scale(.9)', url: 'https://stackblitz.com/edit/mastercss?file=index.html' },
    { name: 'Codepen', Logo: CodepenSvg, class: 'scale(.9) invert(1)@dark', url: 'https://codepen.io/aron-tw/pen/LYQvmPm?editors=1000' },
    { name: 'Code Sandbox', Logo: CodeSandboxSvg, class: 'scale(1.3)', url: 'https://codesandbox.io/s/mastercss-zcnged' },
]