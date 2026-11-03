module.exports = {
    box: `
        bg:white@light bg:gray-28@dark
        f:gray-78@dark shadow:box b:1|solid|white/.03@dark
        bg:blue-60.focus@light f:blue-90.focus@light bg:blue.focus@dark f:blue-80.focus@dark
        flex f:14 lh:normal min-h:44 min-w:44 min-w:auto! p:10|15 r:3 t:center center-content
    `,
    articleBox: `
        {b:2|dashed|gray-30;bg:gray-20}@dark {b:2|dashed|fade-80;bg:fade-90;f:fade-40}@light r:3 p:20
    `,
    docCard: `
        p:30 bg:white bg:gray-22@dark w:full shadow:demo
    `,
    docTable: `
        bb:0!_:where(tbody_tr:last_th,tbody_tr:last_td)
        b:fade-8/.1!_:where(thead_th)
        b:fade-90/.1!_:where(thead_th)@dark
        white-space:nowrap_:where(thead_th)
        f:blue_code 
        f:blue-70_code@dark
        m:0_:where(td,th)_p
        f:90%_td_p_code
        contain:strict contain:strict_:where(code)
        contain:size_:where(tr,th,td,tbody,thead)
    `,
    hint: `
        t:12 f:fade-50 f:gray-60@dark
    `
}