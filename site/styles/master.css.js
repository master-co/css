/* 1. Access APIs */
import { init, Styles, Style } from '@master/css';

/* 2. Customize initial configurations here ... */
Style.extend('classes',
    require('./switch'),
    require('./header'),
    require('./scrollbar'),
    require('./code'),
    require('./docs'),
    require('./home'),
    {
        btn: 'font:14 text:center h:40',
        filledBtn: `
            text-decoration:none inline-flex flex:col center-content text:center
            bg:white@light bg:fade-90:hover@light bg:fade-88:active@light
            bg:gray-22@dark bg:gray-26:hover@dark bg:gray-30:active@dark
            b:1|solid|fade-88 b:white/.03@dark
            untouchable.disabled opacity:.5.disabled
        `,
        inputSlider: `
            bg:fade-88 bg:gray-22@dark h:5 rounded appearance:none
            {appearance:none;bg:white;w:20;h:20;round;b:1|solid|fade-88}::slider-thumb
            {bg:white;w:20;h:20;round;b:0}::range-thumb
        `
    }
);

Styles.extend('values', {
    boxShadow: {
        demo: '0px 0px 1.7px rgba(0, 0, 0, 0.028),0px 0px 5.6px rgba(0, 0, 0, 0.042),0px 0px 25px rgba(0, 0, 0, 0.07)',
        box: 'rgb(0 0 0 / 3%) 0px 1px 2px, rgb(0 0 0 / 3%) 0px 2px 3px, rgb(0 0 0 / 5%) 0px 1px 2px'
    }
})

/* 3. Manually initialize */
init();