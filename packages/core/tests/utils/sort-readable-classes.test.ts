import Tester from '../tester'

new Tester({
    utilities: [
        { name: 'btn', type: -4, layer: 'components', rules: [
            { selector: '&', declarations: { display: 'block' } },
            { selector: '&', declarations: { color: 'oklch(54.6% 0.245 262.881)' } }
        ] },
        { name: 'btn-sm', type: -4, layer: 'components', rules: [
            { selector: '&', declarations: { 'font-size': '0.75rem' } }
        ] },
        { name: 'btn-md', type: -4, layer: 'components', rules: [
            { selector: '&', declarations: { 'font-size': '0.875rem' } }
        ] },
        { name: 'card', type: -4, layer: 'components', rules: [
            { selector: '&', declarations: { 'text-align': 'center' } },
            { selector: '&', declarations: { padding: '2.5rem' } }
        ] },
        { name: 'yellow', type: -4, layer: 'components', rules: [
            { selector: '&', declarations: { 'background-color': 'var(--yellow)' } },
            { selector: '&', declarations: { color: 'var(--yellow-contrast)' } },
            { selector: '&', declarations: { outline: '0.0625rem var(--yellow-ring) solid' } }
        ] },
        { name: 'touch-yellow', type: -4, layer: 'components', rules: [
            { selector: '&:hover', declarations: { 'background-color': 'var(--touch-yellow)' } }
        ] }
    ],
    variables: [
        { namespace: 'yellow', key: 'ring', value: '$(yellow-30)', mode: 'light' },
        { namespace: 'touch', key: 'yellow', value: '$(yellow-30)', mode: 'light' },
        { namespace: 'yellow', key: 'ring', value: '$(yellow-40)', mode: 'dark' },
        { namespace: 'touch', key: 'yellow', value: '$(yellow-40)', mode: 'dark' }
    ],
    modes: ['light', 'dark']
}).readableClasses({
    1: 'font:12 font:24@sm font:36@lg',
    2: 'm:10 m:20 m:30:hover m:40@dark',
    3: 'bg:red bg:slate-90@light bg:white/.1@dark',
    4: 'block display:block block[data-id] block[required] block:hover block:has(:focus) block:active block:disabled',
    5: 'btn btn@sm card block font:12 bg:red:hover block@sm box-content@base text:center@preset',
    6: 'btn btn@sm card block {text:center} font:12 m:1x>ul>li {font:bold;font:32}>ul>li bg:red:hover block@sm box-content@base text:center@preset',
    7: 'btn card unknow1 unknow2 unknow3',
    8: 'abs animation:flash|3s|infinit inset:0 m:auto blend:overlay fg:white font:7vw font:heavy height:fit text:center abs@sm font:40@xs',
    9: 'block round m:32 px:16 font:12 mb:48 bg:blue:hover font:24@sm font:32@md',
    10: 'block round m:32 my:16 px:16 bg:red font:12 mb:48 bg:blue:hover bg:purple:focus font:32@sm my:32@lg font:48@lg',
    11: 'flex flex-col',
    12: 'gap:15 p:40 grid-cols:2 grid-cols:3@2xs grid-cols:4@sm grid-cols:5@md',
    13: 'btn btn-md btn-sm@sm touch-yellow yellow mt:6x w:full',
    14: 'block round px:16 font:12 mb:48 m:__UNSORTED__ p:__UNSORTED__',
})
