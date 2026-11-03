module.exports = {
    'switch-input': `
        hide bg:#30d158:checked+svg opacity:.7[disabled]+svg filter:none[disabled]+svg>rect 
        w:34:active:not([disabled])+svg>rect cursor:no-drop[disabled]+svg
        translateX(19):checked+svg>rect translateX(13):checked:active:not([disabled])+svg>rect
    `,
    'switch-toggle': 'w:51 h:32 bg:fade-90 bg:gray-24@dark rounded ~background|.3s cursor:pointer',
    'switch-button': '~transform|.1s|ease-out,width|.1s|ease-out drop-shadow(0|2px|2px|rgba(0,0,0,.2)) fill:#fff w:28 h:28'
}