import Tester from '../tester'

new Tester().readableClasses({
    1: `
        h:full w:full
        flex-col:hover_:where(.promotions)@md
        hidden:hover_:where(.hidden-on-hover)@md
        hidden!:not(:hover)_:where(.visible-on-hover)@md
        hidden!_:where(.visible-on-hover)@<md
        {abs;z:10;h:auto}:hover@md
    `,
    2: 'flex gap:8 px:0 ai:center w:full fg:#2B88FD:not(:disabled) fg:#999:disabled'
})