import Testing from '../cases-testing'

Testing.readableClasses({
    1: 'font:12 font:24@sm font:36@lg',
    2: 'm:10 m:20 m:30:hover m:40@dark',
    3: 'bg:red bg:slate-90@light bg:white/.1@dark',
    4: 'block display:block block[data-id] block[required] block:hover block:has(:focus) block:active block:disabled',
    5: 'btn card block font:12 bg:red:hover btn@sm block@sm box:content@base text:center@preset',
    6: 'btn card block {text:center} font:12 m:1x>ul>li {font:bold;font:32}>ul>li bg:red:hover btn@sm block@sm box:content@base text:center@preset',
    7: 'btn card unknow1 unknow2 unknow3',
    8: 'abs @flash|3s|infinit inset:0 m:auto blend:overlay fg:white font:7vw font:heavy height:fit text:center abs@sm font:40@xs',
    9: 'block round m:32 px:16 font:12 mb:48 bg:blue:hover font:24@sm font:32@md',
    10: 'block round m:32 my:16 px:16 bg:red font:12 mb:48 bg:blue:hover bg:purple:focus font:32@sm my:32@lg font:48@lg',
    11: 'flex flex:col',
    12: 'gap:15 p:40 grid-cols:2 grid-cols:3@2xs grid-cols:4@sm grid-cols:5@md',
    13: 'btn btn-md yellow mt:6x w:full touch-yellow btn-sm@sm',
    14: 'block round px:16 font:12 mb:48 m:__UNSORTED__ p:__UNSORTED__',
}, {
    components: {
        btn: {
            '': 'block fg:blue',
            sm: 'font:12',
            md: 'font:14'
        },
        card: 'text:center p:5x p:10x@md',
        yellow: 'bg:yellow fg:yellow-contrast outline:1|yellow-ring',
        touch: {
            yellow: 'bg:touch-yellow:hover'
        }
    },
    variables: {
        yellow: {
            ring: {
                '@light': '$(black)/.1',
                '@dark': '$(white)/.3'
            }
        },
        touch: {
            yellow: {
                '@light': '$(yellow-30)',
                '@dark': '$(yellow-40)'
            }
        }
    }
})