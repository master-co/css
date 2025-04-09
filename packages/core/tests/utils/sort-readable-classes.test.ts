import Testing from '../cases-testing'

Testing.readableClasses({
    breakpoints: ['font:12', 'font:24@sm', 'font:36@lg'],
    collision: ['m:10', 'm:20', 'm:30:hover', 'm:40@dark'],
    modes: ['bg:red', 'bg:slate-90@light', 'bg:white/.1@dark'],
    selectors: ['block', 'display:block', 'block[data-id]', 'block[required]', 'block:hover', 'block:has(:focus)', 'block:active', 'block:disabled'],
    components: ['btn', 'card', 'block', 'font:12', 'bg:red:hover', 'btn@sm', 'block@sm', 'box:content@base', 'text:center@preset'],
    groups: ['btn', 'card', 'block', '{text:center}', 'font:12', 'm:1x>ul>li', '{font:bold;font:32}>ul>li', 'bg:red:hover', 'btn@sm', 'block@sm', 'box:content@base', 'text:center@preset'],
    unknown: ['btn', 'card', 'unknow1', 'unknow2', 'unknow3'],
    1: ['abs', '@flash|3s|infinit', 'inset:0', 'm:auto', 'blend:overlay', 'fg:white', 'font:7vw', 'font:heavy', 'height:fit', 'text:center', 'abs@sm', 'font:40@xs'],
    2: ['block', 'round', 'm:32', 'px:16', 'font:12', 'mb:48', 'bg:blue:hover', 'font:24@sm', 'font:32@md'],
    3: ['block', 'round', 'm:32', 'my:16', 'px:16', 'bg:red', 'font:12', 'mb:48', 'bg:blue:hover', 'bg:purple:focus', 'font:32@sm', 'my:32@lg', 'font:48@lg'],
    4: ['flex', 'flex:col'],
    5: ['gap:15', 'p:40', 'grid-cols:2', 'grid-cols:3@2xs', 'grid-cols:4@sm', 'grid-cols:5@md']
}, {
    components: {
        btn: 'block fg:blue',
        card: 'text:center p:5x p:10x@md'
    }
})