module.exports = {
    headerVersion: `
        f:14 h:44 px:8 mx:10 r:4 cursor:pointer white-space:nowrap flex-shrink:0
        f:fade-50@light f:gray-60@dark color:inherit:hover
    `,
    headerNav: `
        px:8 f:14 h:full contain:content lh:1.15
        uppercase::first-letter f:regular color:inherit:hover
        f:fade-50@light {f:fade-20;f:medium}.active@light
        f:gray-60@dark {f:gray-80;f:semibold}.active@dark
        white-space:nowrap
    `,
    headerIcon: `
        w:44 h:44 flex center-content f:fade-64@light f:gray-60@dark
        color:inherit:hover
    `
}
