import MasterCSS from '.'
import delay from './utils/delay'

/**
 * <p class="block font:bold">
 * <p class="block font:bold italic">
 */
test('css count class add', async () => {
    const p1 = document.createElement('p')
    p1.classList.add('block', 'font:bold')
    document.body.append(p1)
    const css = new MasterCSS()
    p1.classList.add('italic')
    await delay()
    expect(css.countOfClass).toEqual({
        'block': 1,
        'font:bold': 1,
        'italic': 1
    })
})

test('css count class complicated example', async ()=> {
    document.body.innerHTML = `
    <div class="container is-builder builder-active" data-sort="true"><div class="row clearfix row-active row-outline" data-quillbot-parent="CxzoYP_CJjvDozS7CRSop"><div class="column full cell-active" data-gramm="false" wt-ignore-input="true" contenteditable="true" data-click="true" data-quillbot-element="CxzoYP_CJjvDozS7CRSop"><div class="two-line">
    <!-- Welcome To CARMAX -->
    <div class="flex rel jc:flex-end@sm jc:center flex:wrap">
      <div data-aos="fade-right" data-aos-anchor-placement="center-bottom" class="{abs;left:0;bottom:0}@sm z:-1 flex:0|0|100%@<sm">
        <div>
          <img src="/assets/img/about/01.png" alt="">
        </div>
      </div>
      <div data-aos="fade-left" data-aos-anchor-placement="center-bottom" data-aos-delay="300" class="max-w:530@sm {lh:28px;f:light}>p {pb:107;pt:82;mr:100}@sm py:40">
        <h3>Welcome To CARMAX</h3>
        <p class="mt:20">123</p><p class="mt:20">456</p><p class="mt:20"><span style="font-weight: inherit; letter-spacing: 0px;">234</span></p><p class="mt:20"><span style="font-size: 40px;">324</span></p><p class="mt:20">234<img src="/assets/img/about/02.jpg" alt=""></p></div></div>
    <div class="{px:100;pb:135}@sm pb:60 pt:60 mx:-40@<sm t:center bg:url(/assets/img/about/map.png) bg:cover bg:center|0% bg:no-repeat ">
      <div class="px:40@<sm">
        <h3 class="elm-active">經營理念</h3>
        <img class="mt:40 mx:auto!" src="/assets/img/about/經營理念.svg" alt="">
      </div>
    </div>
  </div></div><div class="is-tool is-row-tool">
                <div title="移動" class="row-handle" style="width:100%;cursor:move;text-align:center;" data-title="移動"><svg class="is-icon-flex"><use xlink:href="#ion-move"></use></svg></div>
                <button type="button" title="更多選項" class="row-more" data-title="更多選項"><svg class="is-icon-flex"><use xlink:href="#ion-more"></use></svg></button>
                <button type="button" title="格線編輯器" class="row-grideditor" data-title="格線編輯器"><svg class="is-icon-flex"><use xlink:href="#ion-grid"></use></svg></button>
                <button type="button" title="刪除" class="row-remove" data-title="刪除"><svg class="is-icon-flex"><use xlink:href="#ion-ios-close-empty"></use></svg></button>
            </div><div class="is-rowadd-tool" style="height:0">
                <button type="button" title="新增" style="outline:none;line-height:1;margin:0;padding:0;cursor:pointer;background-color:rgba(255,255,255,0.9);" data-title="新增"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.8);width:17px;height:17px;"><use xlink:href="#ion-ios-plus-empty"></use></svg></button>
            </div><quillbot-extension-highlights data-element-id="CxzoYP_CJjvDozS7CRSop" data-element-type="html" style="position: absolute; top: 0px; left: 0px; pointer-events: none;"></quillbot-extension-highlights></div></div>

    <!-- Hidden Form Fields to post content -->
    <form id="form1" method="post" style="display: none" action="/Admin/AboutContent/UpdateContent/11?AppId=1&amp;AppPage=0&amp;page=0&amp;PageSize=30&amp;AppPageSize=30">
        <input name="__RequestVerificationToken" type="hidden" value="8quSgK8lYUIJEfygfJ2N6qxMxQBnOHAzT4Z0N3MUhHeqaazRpAQLAQxgiUIibPXJnDQV_-40s0ffC5f_G9al2sDZo0kAPqTDn_l4LvVqOp4apeQSEsyKaoRchv3vgXLKnjeWZtBxbuJdUvOqhQGrZA2">
        <input type="hidden" id="id" name="id" value="11">
        <input type="hidden" id="inpHtml" name="XContent">
    </form>
    <div class="is-tool" style="position:fixed;width:70px;height:50px;top:30px;left:30px;right:auto;border:none;display:block;">
        <button id="btnSave" class="classic" style="width:70px;height:50px;">儲存</button>
        <button id="btnDel" class="classic" style="width:70px;height:50px;">清空</button>
        <button class="classic" style="width:70px;height:50px;" onclick="goBack()">返回</button>
    </div>









    <div id="_cbhtml" class="is-ui" toolbarleft="" style=""><svg width="0" height="0" style="position:absolute;display:none;">
        <defs>
            <symbol viewBox="0 0 512 512" id="ion-ios-arrow-left"><path d="M352 115.4L331.3 96 160 256l171.3 160 20.7-19.3L201.5 256z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-arrow-right"><path d="M160 115.4L180.7 96 352 256 180.7 416 160 396.7 310.5 256z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-plus-outline"><path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm0 398.7c-105.1 0-190.7-85.5-190.7-190.7S150.9 65.3 256 65.3 446.7 150.9 446.7 256 361.1 446.7 256 446.7z"></path><path d="M264.1 128h-16.8v119.9H128v16.8h119.3V384h16.8V264.7H384v-16.8H264.1z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-image"><path d="M368 224c26.5 0 48-21.5 48-48s-21.5-48-48-48-48 21.5-48 48 21.5 48 48 48z"></path><path d="M452 64H60c-15.6 0-28 12.7-28 28.3v327.4c0 15.6 12.4 28.3 28 28.3h392c15.6 0 28-12.7 28-28.3V92.3c0-15.6-12.4-28.3-28-28.3zM348.9 261.7c-3-3.5-7.6-6.2-12.8-6.2-5.1 0-8.7 2.4-12.8 5.7L304.6 277c-3.9 2.8-7 4.7-11.5 4.7-4.3 0-8.2-1.6-11-4.1-1-.9-2.8-2.6-4.3-4.1L224 215.3c-4-4.6-10-7.5-16.7-7.5-6.7 0-12.9 3.3-16.8 7.8L64 368.2V107.7c1-6.8 6.3-11.7 13.1-11.7h357.7c6.9 0 12.5 5.1 12.9 12l.3 260.4-99.1-106.7z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-photos-outline"><path d="M96 128v320h384V128H96zm368 304H112V144h352v288z"></path><path d="M32 64v320h48v-16H48V80h352v32h16V64z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-settings-strong"><path d="M32 376h283.35c6.186-14.112 20.281-24 36.65-24s30.465 9.888 36.65 24H480v32h-91.35c-6.186 14.112-20.281 24-36.65 24s-30.465-9.888-36.65-24H32M32 240h91.35c6.186-14.112 20.281-24 36.65-24s30.465 9.888 36.65 24H480v32H196.65c-6.186 14.112-20.281 24-36.65 24s-30.465-9.888-36.65-24H32M32 104h283.35c6.186-14.112 20.281-24 36.65-24s30.465 9.888 36.65 24H480v32h-91.35c-6.186 14.112-20.281 24-36.65 24s-30.465-9.888-36.65-24H32"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-settings"><path d="M352 104c8.837 0 16 7.163 16 16s-7.163 16-16 16-16-7.163-16-16 7.163-16 16-16m0-16c-17.645 0-32 14.355-32 32s14.355 32 32 32 32-14.355 32-32-14.355-32-32-32zM352 376c8.837 0 16 7.163 16 16s-7.163 16-16 16-16-7.163-16-16 7.163-16 16-16m0-16c-17.645 0-32 14.355-32 32s14.355 32 32 32 32-14.355 32-32-14.355-32-32-32zM160 240c8.837 0 16 7.163 16 16s-7.163 16-16 16-16-7.163-16-16 7.163-16 16-16m0-16c-17.645 0-32 14.355-32 32s14.355 32 32 32 32-14.355 32-32-14.355-32-32-32zM207.32 248H480v16H207.32c.439-2.604.68-5.273.68-8s-.24-5.396-.68-8zM112 256c0 2.727.24 5.396.68 8H32v-16h80.68a47.955 47.955 0 0 0-.68 8zM399.32 384H480v16h-80.68c.439-2.604.68-5.273.68-8s-.24-5.396-.68-8zM304 392c0 2.727.24 5.396.68 8H32v-16h272.68a47.955 47.955 0 0 0-.68 8zM399.32 112H480v16h-80.68c.439-2.604.68-5.273.68-8s-.24-5.396-.68-8zM304.68 112c-.439 2.604-.68 5.273-.68 8s.24 5.396.68 8H32v-16h272.68z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-android-options"><path d="M32 384h272v32H32zM400 384h80v32h-80zM384 447.5c0 17.949-14.327 32.5-32 32.5-17.673 0-32-14.551-32-32.5v-95c0-17.949 14.327-32.5 32-32.5 17.673 0 32 14.551 32 32.5v95z"></path><g><path d="M32 240h80v32H32zM208 240h272v32H208zM192 303.5c0 17.949-14.327 32.5-32 32.5-17.673 0-32-14.551-32-32.5v-95c0-17.949 14.327-32.5 32-32.5 17.673 0 32 14.551 32 32.5v95z"></path></g><g><path d="M32 96h272v32H32zM400 96h80v32h-80zM384 159.5c0 17.949-14.327 32.5-32 32.5-17.673 0-32-14.551-32-32.5v-95c0-17.949 14.327-32.5 32-32.5 17.673 0 32 14.551 32 32.5v95z"></path></g></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-list-number"><rect x="0" y="0" width="2048.00" height="2048.00" fill="#ffffff"></rect><g id="document" transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M-1043.45,1024 C-1039.25,946.283 -1023.18,878.648 -995.249,821.096 C-967.313,763.544 -912.806,711.242 -831.728,664.192 L-710.742,594.247 C-656.55,562.74 -618.532,535.854 -596.687,513.589 C-562.24,478.722 -545.016,438.813 -545.016,393.863 C-545.016,341.352 -560.769,299.658 -592.276,268.781 C-623.783,237.904 -665.792,222.466 -718.304,222.466 C-796.02,222.466 -849.792,251.873 -879.619,310.685 C-895.582,342.192 -904.404,385.882 -906.084,441.754 L-1021.4,441.754 C-1020.14,363.197 -1005.65,299.133 -977.92,249.562 C-928.769,162.183 -842.02,118.494 -717.673,118.494 C-614.331,118.494 -538.82,146.43 -491.139,202.302 C-443.459,258.174 -419.619,320.347 -419.619,388.822 C-419.619,461.078 -445.034,522.831 -495.865,574.082 C-525.272,603.909 -577.993,640.037 -654.03,682.466 L-740.358,730.356 C-781.527,753.041 -813.874,774.676 -837.399,795.26 C-879.408,831.808 -905.874,872.347 -916.797,916.877 L-424.03,916.877 L-424.03,1024 L-1043.45,1024 Z "></path><path d="M-922.391,-764.384 L-922.391,-851.343 C-840.474,-859.324 -783.341,-872.662 -750.994,-891.356 C-718.647,-910.05 -694.492,-954.265 -678.529,-1024 L-589.049,-1024 L-589.049,-125.425 L-710.035,-125.425 L-710.035,-764.384 L-922.391,-764.384 Z "></path><path d="M-198.618,-510.942 L-198.618,-667.156 L1004.57,-667.156 L1004.57,-510.942 L-198.618,-510.942 Z "></path><path d="M-198.618,78.1071 L-198.618,-78.1071 L1004.57,-78.1071 L1004.57,78.1071 L-198.618,78.1071 Z "></path><path d="M-179.185,649.354 L-179.185,493.14 L1024,493.14 L1024,649.354 L-179.185,649.354 Z "></path></g></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-list-bullet"><rect x="0" y="0" width="2048.00" height="2048.00" fill="#ffffff"></rect><g id="document" transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M-379.801,-514.33 L-379.801,-670.545 L914.662,-670.545 L914.662,-514.33 L-379.801,-514.33 Z "></path><path d="M-379.801,78.1071 L-379.801,-78.1071 L914.662,-78.1071 L914.662,78.1071 L-379.801,78.1071 Z "></path><path d="M-379.801,670.545 L-379.801,514.33 L914.662,514.33 L914.662,670.545 L-379.801,670.545 Z "></path><path d="M-929.642,-469.441 L-929.642,-715.434 L-669.092,-715.434 L-669.092,-469.441 L-929.642,-469.441 Z "></path><path d="M-929.642,127.109 L-929.642,-118.885 L-669.092,-118.885 L-669.092,127.109 L-929.642,127.109 Z "></path><path d="M-929.642,715.434 L-929.642,469.441 L-669.092,469.441 L-669.092,715.434 L-929.642,715.434 Z "></path></g></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-clean"><g transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M75.0013,893.849 L-1030.73,900.993 L-32.1518,-880.838 L1009.54,-880.838 L75.0013,893.849 Z "></path><path d="M-30.8571,780.685 L-845.2,787.828 L-508.893,193.749 L305.26,194.963 L-30.8571,780.685 Z " fill="#ffffff" fill-opacity="1.00"></path></g></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-align-full"><rect x="0" y="0" width="2048.00" height="2048.00" fill="#ffffff"></rect><g id="document" transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M-770.727,738.299 L-770.727,582.085 L769.712,582.085 L769.712,738.299 L-770.727,738.299 Z "></path><path d="M-770.727,-534.628 L-770.727,-690.842 L769.712,-690.842 L769.712,-534.628 L-770.727,-534.628 Z "></path><path d="M-770.219,-115.563 L-770.219,-271.777 L770.219,-271.777 L770.219,-115.563 L-770.219,-115.563 Z "></path><path d="M-770.219,303.503 L-770.219,147.288 L770.219,147.288 L770.219,303.503 L-770.219,303.503 Z "></path></g></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-align-center"><rect x="0" y="0" width="2048.00" height="2048.00" fill="#ffffff"></rect><g id="document" transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M-770.727,738.299 L-770.727,582.085 L769.712,582.085 L769.712,738.299 L-770.727,738.299 Z "></path><path d="M-552.286,-107.697 L-552.286,-263.911 L552.286,-263.911 L552.286,-107.697 L-552.286,-107.697 Z "></path><path d="M-467.355,319.234 L-467.355,163.02 L466.34,163.02 L466.34,319.234 L-467.355,319.234 Z "></path><path d="M-770.727,-534.628 L-770.727,-690.842 L769.712,-690.842 L769.712,-534.628 L-770.727,-534.628 Z "></path></g></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-align-left"><rect x="0" y="0" width="2048.00" height="2048.00" fill="#ffffff"></rect><g id="document" transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M-770.727,738.299 L-770.727,582.085 L769.712,582.085 L769.712,738.299 L-770.727,738.299 Z "></path><path d="M-770.727,-534.628 L-770.727,-690.842 L769.712,-690.842 L769.712,-534.628 L-770.727,-534.628 Z "></path><path d="M-770.219,-115.563 L-770.219,-271.777 L482.839,-271.777 L482.839,-115.563 L-770.219,-115.563 Z "></path><path d="M-770.219,303.503 L-770.219,147.288 L122.787,147.288 L122.787,303.503 L-770.219,303.503 Z "></path></g></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-align-right"><rect x="0" y="0" width="2048.00" height="2048.00" fill="#ffffff"></rect><g id="document" transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M-770.727,738.299 L-770.727,582.085 L769.712,582.085 L769.712,738.299 L-770.727,738.299 Z "></path><path d="M-770.727,-534.628 L-770.727,-690.842 L769.712,-690.842 L769.712,-534.628 L-770.727,-534.628 Z "></path><path d="M-483.346,-118.081 L-483.346,-274.295 L769.712,-274.295 L769.712,-118.081 L-483.346,-118.081 Z "></path><path d="M-123.871,303.503 L-123.871,147.288 L769.136,147.288 L769.136,303.503 L-123.871,303.503 Z "></path></g></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-indent"><rect x="0" y="0" width="2048.00" height="2048.00" fill="#ffffff"></rect><g id="document" transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M-829.04,-514.33 L-829.04,-670.545 L808.959,-670.545 L808.959,-514.33 L-829.04,-514.33 Z "></path><path d="M-829.04,670.545 L-829.04,514.33 L808.959,514.33 L808.959,670.545 L-829.04,670.545 Z "></path><path d="M-254.279,-110.244 L-254.279,-266.458 L808.959,-266.458 L808.959,-110.244 L-254.279,-110.244 Z "></path><path d="M-254.279,266.458 L-254.279,110.244 L808.959,110.244 L808.959,266.458 L-254.279,266.458 Z "></path><path d="M-829.04,-195.117 L-490.958,-1.03508e-14 L-829.04,195.117 L-829.04,-195.117 Z "></path></g></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-outdent"><rect x="0" y="0" width="2048.00" height="2048.00" fill="#ffffff"></rect><g id="document" transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M-829.04,-514.33 L-829.04,-670.545 L808.959,-670.545 L808.959,-514.33 L-829.04,-514.33 Z "></path><path d="M-829.04,670.545 L-829.04,514.33 L808.959,514.33 L808.959,670.545 L-829.04,670.545 Z "></path><path d="M-829.04,-110.244 L-829.04,-266.458 L234.198,-266.458 L234.198,-110.244 L-829.04,-110.244 Z "></path><path d="M-829.04,266.458 L-829.04,110.244 L234.198,110.244 L234.198,266.458 L-829.04,266.458 Z "></path><path d="M808.959,-195.117 L470.877,-1.03508e-14 L808.959,195.117 L808.959,-195.117 Z "></path></g></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-table"><rect x="0" y="0" width="2048.00" height="2048.00" fill="#ffffff"></rect><g id="document" transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M-660.783,660.783 L660.783,660.783 L660.783,-660.783 L-660.783,-660.783 L-660.783,660.783 Z " fill="none" stroke-width="75.82" stroke="#000000" stroke-linecap="square" stroke-linejoin="miter"></path><path d="M-37.9645,698.933 L37.9645,698.933 L37.9645,-698.569 L-37.9645,-698.569 L-37.9645,698.933 Z " fill="#000000" fill-opacity="1.00" stroke-width="0.25" stroke="#000000" stroke-linecap="square" stroke-linejoin="miter"></path><path d="M-698.933,-37.7825 L-698.933,38.1465 L698.569,38.1465 L698.569,-37.7825 L-698.933,-37.7825 Z " fill="#000000" fill-opacity="1.00" stroke-width="0.25" stroke="#000000" stroke-linecap="square" stroke-linejoin="miter"></path></g></symbol>
            <symbol viewBox="0 0 512 512" id="ion-android-happy"><path d="M256 48C140.563 48 48 141.6 48 256s92.563 208 208 208 208-93.6 208-208S370.401 48 256 48zm0 374.4c-91.518 0-166.404-74.883-166.404-166.4 0-91.518 74.887-166.4 166.404-166.4S422.404 164.482 422.404 256 347.518 422.4 256 422.4zm72.8-187.2c17.683 0 31.201-13.518 31.201-31.2s-13.519-31.2-31.201-31.2c-17.682 0-31.2 13.518-31.2 31.2s13.518 31.2 31.2 31.2zm-145.6 0c17.682 0 31.2-13.518 31.2-31.2s-13.519-31.2-31.2-31.2c-17.683 0-31.201 13.518-31.201 31.2s13.519 31.2 31.201 31.2zM256 370.4c48.883 0 89.436-30.164 106.081-72.801H149.919C166.564 340.236 207.117 370.4 256 370.4z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-android-create"><path d="M64 368v80h80l235.727-235.729-79.999-79.998L64 368zm377.602-217.602c8.531-8.531 8.531-21.334 0-29.865l-50.135-50.135c-8.531-8.531-21.334-8.531-29.865 0l-39.468 39.469 79.999 79.998 39.469-39.467z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-minus-empty"><path d="M384 265H128v-17h256v17z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-eye"><path d="M256 128c-81.9 0-145.7 48.8-224 128 67.4 67.7 124 128 224 128 99.9 0 173.4-76.4 224-126.6C428.2 198.6 354.8 128 256 128zm0 219.3c-49.4 0-89.6-41-89.6-91.3 0-50.4 40.2-91.3 89.6-91.3s89.6 41 89.6 91.3c0 50.4-40.2 91.3-89.6 91.3z"></path><path d="M256 224c0-7.9 2.9-15.1 7.6-20.7-2.5-.4-5-.6-7.6-.6-28.8 0-52.3 23.9-52.3 53.3s23.5 53.3 52.3 53.3 52.3-23.9 52.3-53.3c0-2.3-.2-4.6-.4-6.9-5.5 4.3-12.3 6.9-19.8 6.9-17.8 0-32.1-14.3-32.1-32z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-reply"><path d="M448 400s-36.8-208-224-208v-80L64 256l160 134.4v-92.3c101.6 0 171 8.9 224 101.9z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-redo"><path d="M64 400h10.3l19.2-31.2c20.5-32.7 44.9-62.8 75.8-76.6 24.4-10.9 46.7-18.9 86.7-20V352l192-128L256 96v80.3c-63 2.8-108.1 20.7-143.3 56.2C60.4 285.2 64 351.5 64 368.2c.1 8.9 0 21.7 0 31.8z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-wrench"><path d="M461.9 114.9l-56.5 56.7-55.1-10-9.9-55.1 56.5-56.7c-12.7-12.7-30.8-18.5-44.2-17.8-13.5.7-42.3 8.3-64.6 32-21.6 22.8-44.3 65.3-24.2 112.5 2.4 5.7 5.1 13.2-2.9 21.2-8.1 8-215 202.8-215 202.8-19.4 16.7-18 47.6-.1 65.6 18.2 17.9 48.9 19 65.6-.3 0 0 193.2-205.8 202.7-215.1 8.5-8.3 16.1-5.5 21.2-2.9 35.6 18.4 86.3 2.4 112.6-23.9 26.3-26.3 31.1-51.7 31.9-64.7.8-12.9-3.7-30-18-44.3zM91.3 443.2c-6.3 6.2-16.5 6.2-22.7 0-6.2-6.3-6.2-16.5 0-22.7 6.3-6.2 16.5-6.2 22.7 0 6.2 6.3 6.2 16.5 0 22.7z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-more"><path d="M113.7 304C86.2 304 64 282.6 64 256c0-26.5 22.2-48 49.7-48 27.6 0 49.8 21.5 49.8 48 0 26.6-22.2 48-49.8 48zM256 304c-27.5 0-49.8-21.4-49.8-48 0-26.5 22.3-48 49.8-48 27.5 0 49.7 21.5 49.7 48 0 26.6-22.2 48-49.7 48zM398.2 304c-27.5 0-49.8-21.4-49.8-48 0-26.5 22.2-48 49.8-48 27.5 0 49.8 21.5 49.8 48 0 26.6-22.2 48-49.8 48z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-code-working"><circle cx="184.166" cy="256.166" r="24"></circle><circle cx="256.166" cy="256.166" r="24"></circle><circle cx="328.166" cy="256.166" r="24"></circle><g><path d="M168 392a23.929 23.929 0 0 1-16.971-7.029l-112-112c-9.373-9.373-9.373-24.569 0-33.941l112-112c9.373-9.372 24.568-9.372 33.941 0 9.371 9.372 9.371 24.568 0 33.941L89.941 256l95.029 95.029c9.371 9.372 9.371 24.568 0 33.941A23.925 23.925 0 0 1 168 392zM344 392a23.929 23.929 0 0 0 16.971-7.029l112-112c9.373-9.373 9.373-24.569 0-33.941l-112-112c-9.373-9.372-24.568-9.372-33.941 0-9.371 9.372-9.371 24.568 0 33.941L422.059 256l-95.029 95.029c-9.371 9.372-9.371 24.568 0 33.941A23.925 23.925 0 0 0 344 392z"></path></g></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-gear"><path d="M416.349 256.046c-.001-21.013 13.143-38.948 31.651-46.062a196.302 196.302 0 0 0-23.664-57.139 49.423 49.423 0 0 1-20.082 4.254c-12.621 0-25.238-4.811-34.871-14.442-14.863-14.863-18.248-36.846-10.18-54.97A196.274 196.274 0 0 0 302.074 64C294.971 82.529 277.027 95.69 256 95.69c-21.025 0-38.969-13.161-46.073-31.69a196.243 196.243 0 0 0-57.128 23.688c8.068 18.122 4.683 40.104-10.181 54.97-9.631 9.631-22.25 14.443-34.871 14.443a49.429 49.429 0 0 1-20.083-4.255A196.273 196.273 0 0 0 64 209.984c18.509 7.112 31.652 25.049 31.652 46.062 0 21.008-13.132 38.936-31.63 46.054a196.318 196.318 0 0 0 23.692 57.128 49.428 49.428 0 0 1 20.032-4.232c12.622 0 25.239 4.812 34.871 14.443 14.841 14.841 18.239 36.781 10.215 54.889a196.257 196.257 0 0 0 57.13 23.673c7.128-18.479 25.046-31.596 46.038-31.596 20.992 0 38.91 13.115 46.037 31.596a196.234 196.234 0 0 0 57.132-23.675c-8.023-18.106-4.626-40.046 10.216-54.887 9.629-9.632 22.248-14.444 34.868-14.444 6.836 0 13.67 1.411 20.033 4.233a196.318 196.318 0 0 0 23.692-57.128c-18.498-7.119-31.629-25.048-31.629-46.054zM256.9 335.9c-44.3 0-80-35.9-80-80 0-44.101 35.7-80 80-80 44.299 0 80 35.899 80 80 0 44.1-35.701 80-80 80z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-arrow-expand"><path d="M274 209.7l63.9-63.8L288 96h128v128l-49.9-49.9-63.8 63.9zM274 302.3l63.9 63.8L288 416h128V288l-49.9 49.9-63.8-63.9zM238 302.3l-63.9 63.8L224 416H96V288l49.9 49.9 63.8-63.9zM238 209.7l-63.9-63.8L224 96H96v128l49.9-49.9 63.8 63.9z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-android-expand"><path d="M396.795 396.8H320V448h128V320h-51.205zM396.8 115.205V192H448V64H320v51.205zM115.205 115.2H192V64H64v128h51.205zM115.2 396.795V320H64v128h128v-51.205z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-arrow-move"><path d="M480 256l-96-96v76H276V128h76l-96-96-96 96h76v108H128v-76l-96 96 96 96v-76h108v108h-76l96 96 96-96h-76.2l-.4-108.5 108.6.3V352z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-drag"><path d="M0 144h512v32H0zM0 240h512v32H0zM0 336h512v32H0z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-link"><path d="M74.6 256c0-38.3 31.1-69.4 69.4-69.4h88V144h-88c-61.8 0-112 50.2-112 112s50.2 112 112 112h88v-42.6h-88c-38.3 0-69.4-31.1-69.4-69.4zm85.4 22h192v-44H160v44zm208-134h-88v42.6h88c38.3 0 69.4 31.1 69.4 69.4s-31.1 69.4-69.4 69.4h-88V368h88c61.8 0 112-50.2 112-112s-50.2-112-112-112z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-contrast"><path d="M256 32C132.3 32 32 132.3 32 256s100.3 224 224 224 224-100.3 224-224S379.7 32 256 32zm135.8 359.8C355.5 428 307 448 256 448V64c51 0 99.5 20 135.8 56.2C428 156.5 448 204.7 448 256c0 51.3-20 99.5-56.2 135.8z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-plus-empty"><path d="M384 265H264v119h-17V265H128v-17h119V128h17v120h120v17z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-arrow-thin-up"><path d="M349.7 189.8c-3.1 3.1-8 3-11.3 0L264 123.4V408c0 4.4-3.6 8-8 8s-8-3.6-8-8V123.4l-74.4 66.3c-3.4 2.9-8.1 3.2-11.2.1-3.1-3.1-3.3-8.5-.1-11.4 0 0 87-79.2 88-80s2.8-2.4 5.7-2.4 4.9 1.6 5.7 2.4 88 80 88 80c1.5 1.5 2.3 3.6 2.3 5.7s-.8 4.1-2.3 5.7z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-arrow-thin-down"><path d="M349.7 322.2c-3.1-3.1-8-3-11.3 0L264 388.6V104c0-4.4-3.6-8-8-8s-8 3.6-8 8v284.6l-74.4-66.3c-3.4-2.9-8.1-3.2-11.2-.1-3.1 3.1-3.3 8.5-.1 11.4 0 0 87 79.2 88 80s2.8 2.4 5.7 2.4 4.9-1.6 5.7-2.4 88-80 88-80c1.5-1.5 2.3-3.6 2.3-5.7s-.8-4.1-2.3-5.7z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-arrow-thin-left"><path d="M189.8 349.7c3.1-3.1 3-8 0-11.3L123.4 264H408c4.4 0 8-3.6 8-8s-3.6-8-8-8H123.4l66.3-74.4c2.9-3.4 3.2-8.1.1-11.2-3.1-3.1-8.5-3.3-11.4-.1 0 0-79.2 87-80 88S96 253.1 96 256s1.6 4.9 2.4 5.7 80 88 80 88c1.5 1.5 3.6 2.3 5.7 2.3s4.1-.8 5.7-2.3z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-arrow-thin-right"><path d="M322.2 349.7c-3.1-3.1-3-8 0-11.3l66.4-74.4H104c-4.4 0-8-3.6-8-8s3.6-8 8-8h284.6l-66.3-74.4c-2.9-3.4-3.2-8.1-.1-11.2 3.1-3.1 8.5-3.3 11.4-.1 0 0 79.2 87 80 88s2.4 2.8 2.4 5.7-1.6 4.9-2.4 5.7-80 88-80 88c-1.5 1.5-3.6 2.3-5.7 2.3s-4.1-.8-5.7-2.3z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-close-empty"><path d="M340.2 160l-84.4 84.3-84-83.9-11.8 11.8 84 83.8-84 83.9 11.8 11.7 84-83.8 84.4 84.2 11.8-11.7-84.4-84.3 84.4-84.2z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-android-more-vertical"><path d="M296 136c0-22.002-17.998-40-40-40s-40 17.998-40 40 17.998 40 40 40 40-17.998 40-40zm0 240c0-22.002-17.998-40-40-40s-40 17.998-40 40 17.998 40 40 40 40-17.998 40-40zm0-120c0-22.002-17.998-40-40-40s-40 17.998-40 40 17.998 40 40 40 40-17.998 40-40z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-quote"><path d="M192 64c-40.646 0-72.483 11.229-94.627 33.373C75.229 119.517 64 151.354 64 192v256h160V192h-96c0-23.056 4.922-39.666 14.627-49.373C152.334 132.922 168.944 128 192 128M416 64c-40.646 0-72.483 11.229-94.627 33.373C299.229 119.517 288 151.354 288 192v256h160V192h-96c0-23.056 4.922-39.666 14.627-49.373C376.334 132.922 392.944 128 416 128"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-code"><path d="M168 392a23.929 23.929 0 0 1-16.971-7.029l-112-112c-9.373-9.373-9.373-24.569 0-33.941l112-112c9.373-9.372 24.568-9.372 33.941 0 9.371 9.372 9.371 24.568 0 33.941L89.941 256l95.029 95.029c9.371 9.373 9.371 24.568 0 33.941A23.925 23.925 0 0 1 168 392zM344 392a23.929 23.929 0 0 0 16.971-7.029l112-112c9.373-9.373 9.373-24.569 0-33.941l-112-112c-9.373-9.372-24.568-9.372-33.941 0-9.371 9.372-9.371 24.568 0 33.941L422.059 256l-95.029 95.029c-9.371 9.373-9.371 24.568 0 33.941A23.925 23.925 0 0 0 344 392z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-camera"><path d="M430.4 147h-67.5l-40.4-40.8s-.2-.2-.3-.2l-.2-.2c-6-6-14.1-9.8-23.3-9.8h-84c-9.8 0-18.5 4.2-24.6 10.9v.1l-39.5 40h-69C63 147 48 161.6 48 180.2v202.1c0 18.6 15 33.7 33.6 33.7h348.8c18.5 0 33.6-15.1 33.6-33.7V180.2c0-18.6-15.1-33.2-33.6-33.2zM256 365.5c-50.9 0-92.4-41.6-92.4-92.6 0-51.1 41.5-92.6 92.4-92.6 51 0 92.4 41.5 92.4 92.6 0 51-41.4 92.6-92.4 92.6zm168.1-165c-7.7 0-14-6.3-14-14.1s6.3-14.1 14-14.1 14 6.3 14 14.1-6.3 14.1-14 14.1z"></path><path d="M256 202.9c-38.6 0-69.8 31.3-69.8 70 0 38.6 31.2 70 69.8 70 38.5 0 69.8-31.3 69.8-70s-31.3-70-69.8-70z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-move"><path d="M475.9 246.2l-79.4-79.4c-5.4-5.4-14.2-5.4-19.6 0l-.2.2c-5.4 5.4-5.4 14.2 0 19.6l54.9 54.9-161.8.5.5-161.8 54.9 54.9c5.4 5.4 14.2 5.4 19.6 0l.2-.2c5.4-5.4 5.4-14.2 0-19.6l-79.4-79.4c-5.4-5.4-14.2-5.4-19.6 0l-79.4 79.4c-5.4 5.4-5.4 14.2 0 19.6l.2.2c5.4 5.4 14.2 5.4 19.6 0l54.9-54.9.5 161.8-161.8-.5 54.9-54.9c5.4-5.4 5.4-14.2 0-19.6l-.2-.2c-5.4-5.4-14.2-5.4-19.6 0l-79.4 79.4c-5.4 5.4-5.4 14.2 0 19.6l79.4 79.4c5.4 5.4 14.2 5.4 19.6 0l.2-.2c5.4-5.4 5.4-14.2 0-19.6L80 270.5l161.8-.5-.5 161.8-54.9-54.9c-5.4-5.4-14.2-5.4-19.6 0l-.2.2c-5.4 5.4-5.4 14.2 0 19.6l79.4 79.4c5.4 5.4 14.2 5.4 19.6 0l79.4-79.4c5.4-5.4 5.4-14.2 0-19.6l-.2-.2c-5.4-5.4-14.2-5.4-19.6 0l-54.9 54.9-.5-161.8 161.8.5-54.9 54.9c-5.4 5.4-5.4 14.2 0 19.6l.2.2c5.4 5.4 14.2 5.4 19.6 0l79.4-79.4c5.5-5.4 5.5-14.2 0-19.6z"></path></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-ok"><rect x="0" y="0" width="2048.00" height="2048.00" fill="#ffffff"></rect><g id="document" transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M330.323,493.628 L330.323,398.406 L-330.323,398.406 L-330.323,493.628 L330.323,493.628 Z " fill="#011534" fill-opacity="1.00"></path><path d="M230.718,468.568 L328.59,468.568 L328.59,-599.718 L230.718,-599.718 L230.718,468.568 Z " fill="#011534" fill-opacity="1.00"></path><path d="M-300.714,376.053 L-373.748,449.088 L-68.5805,754.255 L4.45387,681.221 L-300.714,376.053 Z " fill="#011534" fill-opacity="1.00"></path><path d="M-9.9476e-14,216.241 L-73.0344,143.207 L-378.202,448.375 L-305.168,521.409 L-9.9476e-14,216.241 Z " fill="#011534" fill-opacity="1.00"></path></g></symbol>
            <symbol viewBox="0 0 512 512" id="ion-grid"><path d="M160 153.3c0 3.7-3 6.7-6.7 6.7h-50.5c-3.7 0-6.7-3-6.7-6.7v-50.5c0-3.7 3-6.7 6.7-6.7h50.5c3.7 0 6.7 3 6.7 6.7v50.5zM288 153.3c0 3.7-3 6.7-6.7 6.7h-50.5c-3.7 0-6.7-3-6.7-6.7v-50.5c0-3.7 3-6.7 6.7-6.7h50.5c3.7 0 6.7 3 6.7 6.7v50.5zM416 153.3c0 3.7-3 6.7-6.7 6.7h-50.5c-3.7 0-6.7-3-6.7-6.7v-50.5c0-3.7 3-6.7 6.7-6.7h50.5c3.7 0 6.7 3 6.7 6.7v50.5z"></path><g><path d="M160 281.3c0 3.7-3 6.7-6.7 6.7h-50.5c-3.7 0-6.7-3-6.7-6.7v-50.5c0-3.7 3-6.7 6.7-6.7h50.5c3.7 0 6.7 3 6.7 6.7v50.5zM288 281.3c0 3.7-3 6.7-6.7 6.7h-50.5c-3.7 0-6.7-3-6.7-6.7v-50.5c0-3.7 3-6.7 6.7-6.7h50.5c3.7 0 6.7 3 6.7 6.7v50.5zM416 281.3c0 3.7-3 6.7-6.7 6.7h-50.5c-3.7 0-6.7-3-6.7-6.7v-50.5c0-3.7 3-6.7 6.7-6.7h50.5c3.7 0 6.7 3 6.7 6.7v50.5z"></path></g><g><path d="M160 409.3c0 3.7-3 6.7-6.7 6.7h-50.5c-3.7 0-6.7-3-6.7-6.7v-50.5c0-3.7 3-6.7 6.7-6.7h50.5c3.7 0 6.7 3 6.7 6.7v50.5zM288 409.3c0 3.7-3 6.7-6.7 6.7h-50.5c-3.7 0-6.7-3-6.7-6.7v-50.5c0-3.7 3-6.7 6.7-6.7h50.5c3.7 0 6.7 3 6.7 6.7v50.5zM416 409.3c0 3.7-3 6.7-6.7 6.7h-50.5c-3.7 0-6.7-3-6.7-6.7v-50.5c0-3.7 3-6.7 6.7-6.7h50.5c3.7 0 6.7 3 6.7 6.7v50.5z"></path></g></symbol>
            <symbol viewBox="0 0 512 512" id="ion-gear-b"><path d="M448 294.4v-76.8h-42.8c-3.4-14.4-8.9-28-16.1-40.5l29.8-29.7-54.3-54.3-29.1 29.1c-12.6-7.7-26.4-13.5-41.1-17.3V64h-76.8v40.9c-14.7 3.8-28.5 9.7-41.1 17.3l-29.1-29.1-54.3 54.3 29.8 29.7c-7.2 12.5-12.6 26.1-16.1 40.5H64v76.8h44.1c3.8 13.7 9.5 26.6 16.7 38.6l-31.7 31.7 54.3 54.3 32.3-32.3c11.7 6.8 24.5 11.9 37.9 15.4v46h76.8v-46c13.5-3.5 26.2-8.6 37.9-15.4l32.3 32.3 54.3-54.3-31.6-31.7c7.2-11.9 12.9-24.8 16.7-38.6h44zm-192 15.4c-29.7 0-53.7-24.1-53.7-53.8s24-53.8 53.7-53.8 53.8 24.1 53.8 53.8-24.1 53.8-53.8 53.8z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-grid-view-outline"><path d="M448 192v-16H336V64h-16v112H192V64h-16v112H64v16h112v128H64v16h112v112h16V336h128v112h16V336h112v-16H336V192h112zM320 320H192V192h128v128z"></path></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-increase"><g id="document" transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M852.574,595.004 L852.574,507.837 L-852.574,507.837 L-852.574,595.004 L852.574,595.004 Z "></path><path d="M852.574,224.232 L852.574,137.066 L-852.574,137.066 L-852.574,224.232 L852.574,224.232 Z "></path><path d="M852.574,-134.971 L852.574,-222.138 L-852.574,-222.138 L-852.574,-134.971 L852.574,-134.971 Z "></path><path d="M852.574,-505.743 L852.574,-592.909 L-852.574,-592.909 L-852.574,-505.743 L852.574,-505.743 Z "></path></g></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-decrease"><g id="document" transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M509.832,595.004 L509.832,507.837 L-509.832,507.837 L-509.832,595.004 L509.832,595.004 Z "></path><path d="M509.832,224.232 L509.832,137.066 L-509.832,137.066 L-509.832,224.232 L509.832,224.232 Z "></path><path d="M509.832,-136.947 L509.832,-224.113 L-509.832,-224.113 L-509.832,-136.947 L509.832,-136.947 Z "></path><path d="M509.832,-505.743 L509.832,-592.909 L-509.832,-592.909 L-509.832,-505.743 L509.832,-505.743 Z "></path></g></symbol>
            <symbol viewBox="0 0 2048.0 2048.0" id="icon-strike"><g id="document" transform="matrix(1,0,0,1,1024.0,1024.0)"><path d="M298.298,-653.766 C292.151,-624.873 284.005,-605.663 273.862,-596.135 C263.719,-586.607 250.656,-581.842 234.673,-581.842 C220.535,-581.842 196.253,-589.526 161.828,-604.895 C87.4454,-637.475 17.0588,-653.766 -49.3321,-653.766 C-155.68,-653.766 -243.28,-621.339 -312.129,-556.485 C-380.979,-491.631 -415.404,-414.328 -415.404,-324.578 C-415.404,-272.94 -403.724,-225.606 -380.364,-182.575 C-357.005,-139.544 -322.733,-100.201 -277.551,-64.5467 C-232.368,-28.8923 -156.295,18.903 -49.3321,78.8392 C57.631,138.775 123.1,177.964 147.074,196.406 C182.729,223.455 209.008,252.654 225.913,284.005 C242.819,315.357 251.271,346.401 251.271,377.137 C251.271,432.463 228.987,480.412 184.419,520.984 C139.851,561.556 79.1465,581.842 2.30524,581.842 C-64.0856,581.842 -125.098,567.089 -180.731,537.582 C-236.364,508.075 -277.704,471.037 -304.753,426.469 C-331.801,381.901 -353.316,314.742 -369.299,224.991 L-403.417,224.991 L-403.417,653.766 L-369.299,653.766 C-364.996,624.873 -358.388,605.817 -349.474,596.596 C-340.561,587.375 -328.42,582.764 -313.051,582.764 C-297.068,582.764 -259.109,592.446 -199.173,611.81 C-139.236,631.174 -99.74,642.393 -80.6834,645.467 C-48.7174,651 -14.5998,653.766 21.6692,653.766 C137.239,653.766 231.753,619.495 305.214,550.952 C378.674,482.41 415.404,400.804 415.404,306.136 C415.404,256.343 403.878,208.701 380.826,163.211 C357.773,117.721 324.885,78.2244 282.161,44.7216 C239.438,11.2188 159.676,-36.8838 42.8774,-99.5863 C-100.355,-176.428 -191.027,-237.901 -229.141,-284.005 C-255.574,-315.357 -268.791,-350.089 -268.791,-388.202 C-268.791,-437.995 -247.89,-482.41 -206.088,-521.445 C-164.287,-560.48 -111.42,-579.998 -47.4879,-579.998 C9.06727,-579.998 63.7783,-565.552 116.645,-536.66 C169.512,-507.767 210.238,-468.732 238.823,-419.554 C267.408,-370.375 287.233,-304.292 298.298,-221.303 L332.415,-221.303 L332.415,-653.766 L298.298,-653.766 Z " fill="#000000" fill-opacity="1.00"></path><path d="M-530.954,-41.4477 L-530.954,41.4477 L530.954,41.4477 L530.954,-41.4477 L-530.954,-41.4477 Z " fill="#000000" fill-opacity="1.00"></path></g></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-undo"><path d="M447.9 368.2c0-16.8 3.6-83.1-48.7-135.7-35.2-35.4-80.3-53.4-143.3-56.2V96L64 224l192 128v-79.8c40 1.1 62.4 9.1 86.7 20 30.9 13.8 55.3 44 75.8 76.6l19.2 31.2H448c0-10.1-.1-22.9-.1-31.8z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-ios-redo"><path d="M64 400h10.3l19.2-31.2c20.5-32.7 44.9-62.8 75.8-76.6 24.4-10.9 46.7-18.9 86.7-20V352l192-128L256 96v80.3c-63 2.8-108.1 20.7-143.3 56.2C60.4 285.2 64 351.5 64 368.2c.1 8.9 0 21.7 0 31.8z"></path></symbol>
            <symbol viewBox="0 0 512 512" id="ion-android-arrow-dropdown"><path d="M128 192l128 128 128-128z"></path></symbol>
            </defs>
        </svg><div class="is-modal viewconfig">
                <div style="width:100%;max-width:700px;padding:5px 12px 12px 20px">
                    <div class="is-modal-bar is-draggable" style="position: absolute;top: 0;left: 0;height:32px;line-height:32px;width:100%;background: transparent;" draggable="">工具列設定</div>

                    <div style="display:flex;flex-wrap:wrap;width:100%;padding-top:32px;">
                        <div style="width:50%">
                            <label id="divBuilderMode" style="display:block;margin-top:14px;margin-bottom:5px;">
                                模式:&nbsp;
                                <select class="select-buildermode">
                                    <option value="">顯示全部</option>
                                    <option value="minimal">顯示部分</option>
                                    <option value="clean">簡易版</option>
                                </select>
                            </label>

                            <label id="divOutlineMode" style="display:block;margin-top:14px;margin-bottom:5px;">
                                格線顯示:&nbsp;
                                <select class="select-outlinemode">
                                    <option value="">顯示欄與列</option>
                                    <option value="row">僅顯示列</option>
                                </select>
                            </label>

                            <label style="display:block;margin-top:14px;margin-bottom:5px;">
                                格線顏色:&nbsp;
                                <select class="select-outlinestyle">
                                    <option value="">彩色</option>
                                    <option value="grayoutline">灰色</option>
                                </select>
                            </label>

                            <label style="display:block;margin-top:14px;margin-bottom:10px;">
                                <input class="input-hiderowcoloutline" type="checkbox"> 隱藏格線&nbsp;
                            </label>

                            <label id="divHideCellTool" style="display:block;margin-top:14px;margin-bottom:10px;">
                                <input class="input-hidecelltool" type="checkbox">  隱藏各欄工具列&nbsp;
                            </label>

                            <label style="display:block;margin-top:5px;margin-bottom:5px;">
                                格線編輯器位置:&nbsp;
                                <select class="select-rowtool">
                                    <option value="right">右側</option>
                                    <option value="left">左側</option>
                                </select>
                            </label>

                            <label style="display:block;margin-top:5px;margin-bottom:5px;">
                                工具列顏色:&nbsp;
                                <select class="select-toolstyle">
                                    <option value="">彩色</option>
                                    <option value="gray">灰色</option>
                                </select>
                            </label>

                        </div>
                        <div style="width:50%">

                            <label style="display:block;margin-top:14px;margin-bottom:10px;">
                                <input class="input-hidesnippetaddtool" type="checkbox">  Hide Snippet (+) Tool&nbsp;
                            </label>

                            <label style="display:block;margin-top:14px;margin-bottom:10px;">
                                <input class="input-hideelementtool" type="checkbox"> Hide element tool&nbsp;
                            </label>

                            <label style="display:block;margin-top:14px;margin-bottom:10px;">
                                <input class="input-hideelementhighlight" type="checkbox"> Hide element highlight&nbsp;
                            </label>

                            <label class="option-opensnippets" style="display:block;margin-top:14px;margin-bottom:10px;">
                                <input class="input-opensnippets" type="checkbox">  讀取頁面時，預設開啟模板工具列&nbsp;
                            </label>

                            <label style="display:block;margin-top:14px;margin-bottom:5px;">
                               Snippets sidebar visibility:&nbsp;
                                <select class="select-snippetssidebardisplay">
                                    <option value="auto">Auto</option>
                                    <option value="always">Always Visible</option>
                                </select>
                            </label>

                            <label style="display:block;margin-top:5px;margin-bottom:5px;">
                                預設貼上格式:&nbsp;
                                <select class="select-pasteresult">
                                    <option value="html-without-styles">HTML (不含格式)</option>
                                    <option value="html">HTML (含格式)</option>
                                    <option value="text">純文字</option>
                                </select>
                            </label>

                            <label style="display:none;margin-top:14px;margin-bottom:5px;">
                               Toolbar visibility:&nbsp;
                                <select class="select-editingtoolbardisplay">
                                    <option value="auto">Auto</option>
                                    <option value="always">Always Visible</option>
                                </select>
                            </label>

                            <label style="display:block;margin-top:5px;margin-bottom:5px;">
                               工具列位置:&nbsp;
                                <select class="select-editingtoolbar">
                                    <option value="top">上方</option>
                                    <option value="left">左側</option>
                                    <option value="right">右側</option>
                                </select>
                            </label>

                        </div>
                    </div>
                    <div style="text-align:right;margin-top:30px">
                        <button title="取消" class="input-cancel classic-secondary">取消</button>
                        <button title="確認" class="input-ok classic-primary">確認</button>
                    </div>
                </div>
            </div><div class="is-modal viewhtml">
                <div style="width:80%;max-width:1200px;height:80%;padding:0;box-sizing:border-box;position:relative;">
                    <textarea class="tabSupport" style="width:100%;height:100%;border:none;border-bottom:60px solid transparent;margin:0;box-sizing:border-box;" data-gramm="false" wt-ignore-input="true"></textarea>
                    <button title="Enlarge" class="input-html-larger" style="width:35px;height:35px;position:absolute;right:20px;top:0;background:#fff;"><svg class="is-icon-flex" style="width:19px;height:19px;fill:rgb(170, 170, 170);"><use xlink:href="#ion-arrow-expand"></use></svg></button>
                    <div class="is-modal-footer" style="width:100%;height:50px;position:absolute;left:0;bottom:0;border-top: #efefef 1px solid;overflow:hidden;text-align:right">
                        <button title="取消" class="input-cancel classic-secondary">取消</button>
                        <button title="確認" class="input-ok classic-primary">確認</button>
                    </div>
                </div>
            </div>

            <div class="is-modal viewhtmlformatted">
                <div style="width:80%;max-width:1200px;height:80%;padding:0;box-sizing:border-box;position:relative;overflow:hidden;">
                    <iframe id="ifrHtmlFormatted" style="width:100%;height:100%;border:none;margin:0;box-sizing:border-box;" src="about:blank"></iframe>
                    <textarea style="position:absolute;display:none;" data-gramm="false" wt-ignore-input="true"></textarea>
                    <button title=" out('Enlarge') + '" class="input-html-larger" style="width:35px;height:35px;position:absolute;right:20px;top:0;background:#fff;"><svg class="is-icon-flex" style="width:19px;height:19px;fill:rgb(170, 170, 170);"><use xlink:href="#ion-arrow-expand"></use></svg></button>
                    <div class="is-modal-footer" style="display:none">
                        <button class="input-cancel classic-secondary">Cancel</button>
                        <button class="input-ok classic-primary">Ok</button>
                    </div>
                </div>
            </div>

            <div class="is-modal viewhtmllarger" style="align-items:flex-end;z-index:10005;">
                <div style="width:100%;height:100%;border:none;padding:0;">
                    <iframe id="ifrHtml" style="width:100%;height:100%;border: none;" src="about:blank"></iframe>
                </div>
            </div>

            <div class="is-modal viewhtmlnormal" "="">
                <div style="width:80%;max-width:1200px;height:80%;padding:0;box-sizing:border-box;position:relative;overflow:hidden;">
                    <button title="Enlarge" class="input-html-larger" style="width:35px;height:35px;position:absolute;right:20px;top:0;background:#fff;"><svg class="is-icon-flex" style="width:19px;height:19px;fill:rgb(170, 170, 170);"><use xlink:href="#ion-arrow-expand"></use></svg></button>
                    <iframe id="ifrHtml" style="width:100%;height:100%;border: none;" src="about:blank"></iframe>
                </div>
            </div>

            <div class="is-modal grideditor" style="z-index:10002;">
        <div class="is-modal-bar is-draggable" style="position: absolute;top: 0;left: 0;width: 100%;z-index:1;line-height:1.5;height:20px;border:none;" draggable="">
            <div class="is-modal-close" style="z-index:1;width:20px;height:20px;position:absolute;top:0px;right:0px;box-sizing:border-box;padding:0;line-height:20px;font-size:10px;color:#777;text-align:center;cursor:pointer;">✕</div>
        </div>
        <div style="padding:30px 0 5px 18px;font-size:10px;color:#333;text-transform:uppercase;letter-spacing:1px;">列</div>
        <div style="display:flex;flex-flow:wrap;">
            <button title="新增" class="row-add"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.8);width:19px;height:19px;"><use xlink:href="#ion-ios-plus-empty"></use></svg></button>
            <button title="複製" class="row-duplicate" style="display: block;"><svg class="is-icon-flex" style="width:12px;height:12px;"><use xlink:href="#ion-ios-photos-outline"></use></svg></button>
            <button title="往上移" class="row-up" style="display: block;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-up"></use></svg></button>
            <button title="往下移" class="row-down" style="display: block;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-down"></use></svg></button>
            <button title="原始碼" class="row-html">
            <svg class="is-icon-flex" style="margin-right:-3px;fill:rgba(0, 0, 0, 0.65);width:12px;height:12px;"><use xlink:href="#ion-ios-arrow-left"></use></svg><svg class="is-icon-flex" style="margin-left:-2px;fill:rgba(0, 0, 0, 0.65);width:12px;height:12px;"><use xlink:href="#ion-ios-arrow-right"></use></svg>
        </button>
            <button title="刪除" class="row-remove"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.8);width:20px;height:20px;"><use xlink:href="#ion-ios-close-empty"></use></svg></button>
        </div>
        <div style="padding:8px 0 5px 18px;font-size:11px;color:#333;text-transform:uppercase;letter-spacing:1px;">欄</div>
        <div style="display:flex;flex-flow:wrap;">
            <button title="新增" class="cell-add"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.8);width:19px;height:19px;"><use xlink:href="#ion-ios-plus-empty"></use></svg></button>
            <button title="複製" class="cell-duplicate"><svg class="is-icon-flex" style="width:12px;height:12px;"><use xlink:href="#ion-ios-photos-outline"></use></svg></button>
            <button title="往上移" class="cell-up"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-up"></use></svg></button>
            <button title="往下移" class="cell-down"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-down"></use></svg></button>
            <button title="往左移" class="cell-prev"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-left"></use></svg></button>
            <button title="往右移" class="cell-next"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-right"></use></svg></button>
            <button title="增加" class="cell-increase"><svg class="is-icon-flex" style="width:13px;height:13px;"><use xlink:href="#icon-increase"></use></svg></button>
            <button title="減少" class="cell-decrease"><svg class="is-icon-flex" style="width:13px;height:13px;"><use xlink:href="#icon-decrease"></use></svg></button>
            <button title="原始碼" class="cell-html">
            <svg class="is-icon-flex" style="margin-right:-3px;fill:rgba(0, 0, 0, 0.65);width:12px;height:12px;"><use xlink:href="#ion-ios-arrow-left"></use></svg><svg class="is-icon-flex" style="margin-left:-2px;fill:rgba(0, 0, 0, 0.65);width:12px;height:12px;"><use xlink:href="#ion-ios-arrow-right"></use></svg>
        </button>
            <button title="刪除" class="cell-remove"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.8);width:20px;height:20px;"><use xlink:href="#ion-ios-close-empty"></use></svg></button>
            <div class="is-separator">
                <button title="外框線" class="grid-outline"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.8);width:12px;height:12px;"><use xlink:href="#ion-ios-grid-view-outline"></use></svg></button>
                <!--<button title="Element Tool" class="cell-elmtool"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);width:12px;height:12px;"><use xlink:href="#ion-ios-gear"></use></svg></button>-->
            </div>
        </div>
    </div><div class="is-pop quickadd arrow-right" style="z-index:10003;">
        <div class="is-pop-close" style="display:none;z-index:1;width:40px;height:40px;position:absolute;top:0px;right:0px;box-sizing:border-box;padding:0;line-height:40px;font-size: 12px;color:#777;text-align:center;cursor:pointer;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.47);width:40px;height:40px;"><use xlink:href="#ion-ios-close-empty"></use></svg></div>
        <div class="is-pop-tabs">
            <div class="is-pop-tab-item active" data-value="left">新增左欄</div>
            <div class="is-pop-tab-item" data-value="right">新增右欄</div>
        </div>
        <div style="padding:8px;display:flex;flex-direction:row;flex-flow: wrap;justify-content: center;align-items: center;">
            <button title="內文" class="add-paragraph"><span style="display:block;margin:0 0 8px;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.8);width:12px;height:12px;"><use xlink:href="#icon-align-full"></use></svg></span>內文</button>
            <button title="段落" class="add-headline"><span style="font-family:serif;display:block;margin:0 0 8px;">H</span>段落</button>
            <button title="圖片" class="add-image"><span style="display:block;margin:0 0 8px;"><svg class="is-icon-flex ion-image" style="width:14px;height:14px;"><use xlink:href="#ion-image"></use></svg></span>圖片</button>
            <button title="標題 1" class="add-heading1"><span style="font-family:serif;display:block;margin:0 0 8px;">H1</span>標題 1</button>
            <button title="標題 2" class="add-heading2"><span style="font-family:serif;display:block;margin:0 0 8px;">H2</span>標題 2</button>
            <button title="標題 3" class="add-heading3"><span style="font-family:serif;display:block;margin:0 0 8px;">H3</span>標題 3</button>
            <button title="項目" class="add-list"><span style="display:block;margin:0 0 8px;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.8);width:13px;height:13px;"><use xlink:href="#icon-list-bullet"></use></svg></span>項目</button>
            <button title="引用" class="add-quote"><span style="display:block;margin:0 0 8px;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);width:13px;height:13px;"><use xlink:href="#ion-quote"></use></svg></span>引用</button>
            <button title="程式碼區塊" class="add-preformatted"><span style="display:block;margin:0 0 8px;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);width:13px;height:13px;"><use xlink:href="#ion-code"></use></svg></span>程式碼區塊</button>
            <button title="表格" class="add-table"><span style="display:block;margin:0 0 8px;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);width:15px;height:15px;"><use xlink:href="#icon-table"></use></svg></span>表格</button>
            <button title="間隔" class="add-spacer"><span style="display:block;margin:0 0 8px;"><span style="display:inline-block;background:#eee;width:30px;height:5px;"></span></span>間隔</button>
            <button title="按鈕" class="add-button"><span style="display:block;margin:0 0 8px;"><span style="display:inline-block;border:#a1a1a1 1px solid;background:#f3f3f3;width:15px;height:6px;"></span></span>按鈕</button>
            <button title="更多..." class="add-more classic" style="width:100%;height:45px;margin-top:10px;flex-direction:initial;">更多...</button>
        </div>
        </div>

        <div class="is-modal snippets">
            <div style="max-width:1250px;height:90%;padding:0;">
            <iframe style="width:100%;height:100%;border: none;display: block;" src="about:blank"></iframe>
            </div>
        </div>
        <div id="divSnippetList" class="is-side  snippetlist">
            <div style="position:absolute;top:0;right:0;padding: 0;width:100%;z-index:2;"><div class="is-selectbox snippet-cat" data-group="snippet-cat" data-value="120"><span>Basic</span><svg class="is-icon-flex" style="position:absolute;top:13px;right:10px;"><use xlink:href="#ion-android-arrow-dropdown"></use></svg></div><div class="is-selectbox-options" data-group="snippet-cat" style="display: none;"><div data-value="120">Basic</div><div data-value="118">Article</div><div data-value="101">Headline</div><div data-value="103">Profile</div><div data-value="116">Contact</div><div data-value="104">Products</div><div data-value="105">Features</div><div data-value="106">Process</div><div data-value="107">Pricing</div><div data-value="108">Skills</div><div data-value="109">Achievements</div><div data-value="110">Quotes</div><div data-value="111">Partners</div><div data-value="112">As Featured On</div><div data-value="113">Page Not Found</div><div data-value="114">Coming Soon</div><div data-value="115">Help, FAQ</div></div></div><div id="divSnippetScrollUp" style="top: calc(50% - 27px); right: 25px; display: none;">▲</div><div id="divSnippetScrollDown" style="top: calc(50% + 27px); right: 25px; display: none;">▼</div><div id="divSnippetHandle" title="Snippets" data-title="Snippets" style=""><svg class="is-icon-flex"><use xlink:href="#ion-ios-arrow-left"></use></svg></div><div class="is-design-list"><div class="snippet-item" data-id="1" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-01.png"></div><div class="snippet-item" data-id="2" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-02.png"></div><div class="snippet-item" data-id="3" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-03.png"></div><div class="snippet-item" data-id="4" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-04.png"></div><div class="snippet-item" data-id="5" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-05.png"></div><div class="snippet-item" data-id="6" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-06.png"></div><div class="snippet-item" data-id="7" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-07.png"></div><div class="snippet-item" data-id="8" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-08.png"></div><div class="snippet-item" data-id="9" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-09.png"></div><div class="snippet-item" data-id="10" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-10.png"></div><div class="snippet-item" data-id="11" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-11.png"></div><div class="snippet-item" data-id="12" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-12.png"></div><div class="snippet-item" data-id="13" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-13.png"></div><div class="snippet-item" data-id="14" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-14.png"></div><div class="snippet-item" data-id="15" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-15.png"></div><div class="snippet-item" data-id="16" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/basic-16.png"></div><div class="snippet-item" data-id="17" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/element-video.png"></div><div class="snippet-item" data-id="18" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/element-map.png"></div><div class="snippet-item" data-id="19" data-cat="120"><img src="http://carmax.creatop.tw/assets/contentbuilder/assets/minimalist-blocks/preview/element-code.png"></div></div></div><div class="is-tool is-column-tool active" style="top: 91px; left: 738px;">
                <button type="button" title="新增" class="cell-add" data-title="新增"><svg class="is-icon-flex"><use xlink:href="#ion-ios-plus-empty"></use></svg></button>
                <button type="button" title="更多選項" class="cell-more" data-title="更多選項"><svg class="is-icon-flex"><use xlink:href="#ion-more"></use></svg></button>
                <button type="button" title="刪除" class="cell-remove" data-title="刪除"><svg class="is-icon-flex" style="margin-left:-1px"><use xlink:href="#ion-ios-close-empty"></use></svg></button>
            </div>

            <div class="is-pop columnmore" style="top: 126px; left: 757px;">
                <div style="display:flex;flex-flow:wrap;padding-top:3px;">
                    <button type="button" title="往左移" class="cell-prev"><span><svg class="is-icon-flex" style="width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-left"></use></svg></span>往左移</button>
                    <button type="button" title="往右移" class="cell-next"><span><svg class="is-icon-flex" style="width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-right"></use></svg></span>往右移</button>
                    <button type="button" title="往上移" class="cell-up"><span><svg class="is-icon-flex" style="width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-up"></use></svg></span>往上移</button>
                    <button type="button" title="往下移" class="cell-down"><span><svg class="is-icon-flex" style="width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-down"></use></svg></span>往下移</button>
                    <button type="button" title="增加" class="cell-increase"><span><svg class="is-icon-flex" style="width:13px;height:13px;"><use xlink:href="#icon-increase"></use></svg></span>增加</button>
                    <button type="button" title="減少" class="cell-decrease"><span><svg class="is-icon-flex" style="width:13px;height:13px;"><use xlink:href="#icon-decrease"></use></svg></span>減少</button>
                    <button type="button" title="複製" class="cell-duplicate"><span><svg class="is-icon-flex" style="width:12px;height:12px;"><use xlink:href="#ion-ios-photos-outline"></use></svg></span>複製</button>
                    <button type="button" title="原始碼" class="cell-html">
                <span><svg class="is-icon-flex" style="margin-right:-3px;width:12px;height:12px;"><use xlink:href="#ion-ios-arrow-left"></use></svg><svg class="is-icon-flex" style="margin-left:-2px;fill:rgba(0, 0, 0, 0.65);width:12px;height:12px;"><use xlink:href="#ion-ios-arrow-right"></use></svg></span>原始碼
            </button>
                </div>
            </div>

            <div class="is-side elementstyles">
                    <div class="elm-list" style="z-index:1;width:100%;height:100px;position:absolute;top:0px;left:0px;box-sizing:border-box;display:flex;align-items:center;flex-wrap: wrap;padding:10px 23px 10px 18px;border-bottom:#e8e8e8 1px solid;font-size:9px;"></div>

                    <button title="Close" class="is-side-close" style="z-index:1;width:25px;height:25px;position:absolute;top:10px;right:13px;box-sizing:border-box;padding:0;line-height:25px;font-size: 12px;text-align:center;cursor:pointer;"><svg class="is-icon-flex" style="width:25px;height:25px;"><use xlink:href="#ion-ios-close-empty"></use></svg></button>

                    <div style="position: absolute;bottom:7px;right:7px;width:40px;height:25px;z-index:1;display:flex">
                        <button title="css" class="elm-editstyle classic" style="width: 40px;height: 25px;font-family: sans-serif;font-size: 10px;padding: 0px;font-weight: bold;">css</button>
                    </div>

                    <div style="width:100%;height:100%;overflow-y:auto;overflow-x:hidden;position:absolute;top:0px;left:0px;box-sizing:border-box;border-top:100px solid transparent;padding:0px;">

                        <div class="is-tabs clearfix" data-group="element" style="padding-right:0;padding-bottom:0;">
                            <a title="段落" id="tabElementBox" href="" data-content="divElementBox" class="active">段落</a>
                            <a title="間距" id="tabElementSpacing" href="" data-content="divElementSpacing">間距</a>
                            <a title="框線" id="tabElementBorder" href="" data-content="divElementBorder">框線</a>
                            <a title="文字" id="tabElementText" href="" data-content="divElementText">文字</a>
                            <a title="更多選項" id="tabElementMore" data-menu="divElementMore" href=""><svg class="is-icon-flex" style="width:15px;height:15px;"><use xlink:href="#ion-more"></use></svg></a>
                        </div>

                        <div id="divElementMore" class="is-tabs-more" data-group="element">
                            <a title="框線弧度" id="tabElementCorner" href="" data-content="divElementCorner">框線弧度</a>
                            <a title="框線陰影" id="tabElementShadow" href="" data-content="divElementShadow">框線陰影</a>
                            <a title="Display" id="tabElementDisplay" href="" data-content="divElementDisplay">Display</a>
                            <a title="Position" id="tabElementPosition" href="" data-content="divElementPosition">Position</a>
                            <a title="Effects" id="tabElementEffect" href="" data-content="divElementEffect">Effects</a>
                            <a title="Attributes" id="tabElementAttribute" href="" data-content="divElementAttribute">Attributes</a>

                        </div>

                        <div id="divElementBox" class="is-tab-content" data-group="element" style="display:flex;flex-flow:wrap;padding:12px 17px;">

                <div class="is-settings clearfix">
                    <div class="is-label">背景色:</div>
                    <div>
                        <button title="背景色" class="input-elm-bgcolor is-btn-color"></button>
                        <button title="漸層" class="input-elm-gradient" data-value="+"> 漸層 </button>
                    </div>
                </div>

                <div style="margin-top: 25px;font-weight:bold;width:100%;">尺寸</div>

                <div class="is-settings clearfix" style="width:110px">
                    <div>Width:</div>
                    <div style="display:flex">
                        <input type="text" id="inpElmWidth" value="" style="width:45px">
                        <select id="inpElmWidthUnit" "="">
                            <option value="px">px</option>
                            <option value="em">em</option>
                            <option value="vw">vw</option>
                            <option value="vh">vh</option>
                            <option value="%">%</option>
                        </select>
                    </div>
                </div>
                <div class="is-settings clearfix" style="width:110px;">
                    <div>Height:</div>
                    <div style="display:flex">
                        <input type="text" id="inpElmHeight" value="" style="width:45px">
                        <select id="inpElmHeightUnit" "="">
                            <option value="px">px</option>
                            <option value="em">em</option>
                            <option value="vw">vw</option>
                            <option value="vh">vh</option>
                            <option value="%">%</option>
                        </select>
                    </div>
                </div>
                <div class="is-settings clearfix" style="width:110px;">
                    <div>Max Width:</div>
                    <div style="display:flex">
                        <input type="text" id="inpElmMaxWidth" value="" style="width:45px">
                        <select id="inpElmMaxWidthUnit" "="">
                            <option value="px">px</option>
                            <option value="em">em</option>
                            <option value="vw">vw</option>
                            <option value="vh">vh</option>
                            <option value="%">%</option>
                        </select>
                    </div>
                </div>
                <div class="is-settings clearfix" style="width:110px;">
                    <div>Max Height:</div>
                    <div style="display:flex">
                        <input type="text" id="inpElmMaxHeight" value="" style="width:45px">
                        <select id="inpElmMaxHeightUnit" "="">
                            <option value="px">px</option>
                            <option value="em">em</option>
                            <option value="vw">vw</option>
                            <option value="vh">vh</option>
                            <option value="%">%</option>
                        </select>
                    </div>
                </div>
                <div class="is-settings clearfix" style="width:110px;">
                    <div>Min Width:</div>
                    <div style="display:flex">
                        <input type="text" id="inpElmMinWidth" value="" style="width:45px">
                        <select id="inpElmMinWidthUnit" "="">
                            <option value="px">px</option>
                            <option value="em">em</option>
                            <option value="vw">vw</option>
                            <option value="vh">vh</option>
                            <option value="%">%</option>
                        </select>
                    </div>
                </div>
                <div class="is-settings clearfix" style="width:110px;">
                    <div>Min Height:</div>
                    <div style="display:flex">
                        <input type="text" id="inpElmMinHeight" value="" style="width:45px">
                        <select id="inpElmMinHeightUnit" "="">
                            <option value="px">px</option>
                            <option value="em">em</option>
                            <option value="vw">vw</option>
                            <option value="vh">vh</option>
                            <option value="%">%</option>
                        </select>
                    </div>
                </div>

                <div class="is-settings clearfix" style="width:110px;">
                    <div>Overflow x:</div>
                    <div>
                        <select id="inpElmOverflowX" "="">
                            <option value=""></option>
                            <option value="auto">Auto</option>
                            <option value="hidden">Hidden</option>
                        </select>
                    </div>
                </div>
                <div class="is-settings clearfix" style="width:110px;">
                    <div>Overflow y:</div>
                    <div>
                        <select id="inpElmOverflowY" "="">
                            <option value=""></option>
                            <option value="auto">Auto</option>
                            <option value="hidden">Hidden</option>
                        </select>
                    </div>
                </div>
        </div>

                        <div id="divElementSpacing" class="is-tab-content" data-group="element" style="display:none;flex-flow:wrap;padding:12px 17px;">

            <div style="margin-top: 13px;font-weight: bold;width:100%">Padding</div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>上方:</div>
                <div style="display:flex;">
                    <input type="text" id="inpElmPaddingTop" value="" style="width:45px">
                    <select id="inpElmPaddingTopUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                        <option value="vw">vw</option>
                        <option value="vh">vh</option>
                        <option value="%">%</option>
                    </select>
                </div>
            </div>
            <div class="is-settings clearfix" style="width:110px;">
                <div>Bottom:</div>
                <div style="display:flex;">
                    <input type="text" id="inpElmPaddingBottom" value="" style="width:45px">
                    <select id="inpElmPaddingBottomUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                        <option value="vw">vw</option>
                        <option value="vh">vh</option>
                        <option value="%">%</option>
                    </select>
                </div>
            </div>
            <div class="is-settings clearfix" style="width:110px;">
                <div>左側:</div>
                <div style="display:flex;">
                    <input type="text" id="inpElmPaddingLeft" value="" style="width:45px">
                    <select id="inpElmPaddingLeftUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                        <option value="vw">vw</option>
                        <option value="vh">vh</option>
                        <option value="%">%</option>
                    </select>
                </div>
            </div>
            <div class="is-settings clearfix" style="width:110px;">
                <div>右側:</div>
                <div style="display:flex;">
                    <input type="text" id="inpElmPaddingRight" value="" style="width:45px">
                    <select id="inpElmPaddingRightUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                        <option value="vw">vw</option>
                        <option value="vh">vh</option>
                        <option value="%">%</option>
                    </select>
                </div>
            </div>

            <div style="margin-top: 25px;font-weight: bold;width:100%">Margin</div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>上方:</div>
                <div style="display:flex;">
                    <input type="text" id="inpElmMarginTop" value="" style="width:45px">
                    <select id="inpElmMarginTopUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                        <option value="vw">vw</option>
                        <option value="vh">vh</option>
                        <option value="%">%</option>
                        <option value="auto">auto</option>
                    </select>
                </div>
            </div>
            <div class="is-settings clearfix" style="width:110px;">
                <div>Bottom:</div>
                <div style="display:flex;">
                    <input type="text" id="inpElmMarginBottom" value="" style="width:45px">
                    <select id="inpElmMarginBottomUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                        <option value="vw">vw</option>
                        <option value="vh">vh</option>
                        <option value="%">%</option>
                        <option value="auto">auto</option>
                    </select>
                </div>
            </div>
            <div class="is-settings clearfix" style="width:110px;">
                <div>左側:</div>
                <div style="display:flex;">
                    <input type="text" id="inpElmMarginLeft" value="" style="width:45px">
                    <select id="inpElmMarginLeftUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                        <option value="vw">vw</option>
                        <option value="vh">vh</option>
                        <option value="%">%</option>
                        <option value="auto">auto</option>
                    </select>
                </div>
            </div>
            <div class="is-settings clearfix" style="width:110px;">
                <div>右側:</div>
                <div style="display:flex;">
                    <input type="text" id="inpElmMarginRight" value="" style="width:45px">
                    <select id="inpElmMarginRightUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                        <option value="vw">vw</option>
                        <option value="vh">vh</option>
                        <option value="%">%</option>
                        <option value="auto">auto</option>
                    </select>
                </div>
            </div>

            <div style="margin-top: 25px;font-weight: bold;width:100%">響應式:</div>

            <div class="is-settings clearfix" style="width:100%;">
                <div>
                    <label for="chkResetMarginLeft" style="letter-spacing: 0.5px;"><input type="checkbox" id="chkResetMarginLeft" value=""> Reset margin left on small screen </label>
                </div>
            </div>
            <div class="is-settings clearfix" style="margin-top:0;width:100%;">
                <div>
                    <label for="chkResetMarginRight" style="letter-spacing: 0.5px;"><input type="checkbox" id="chkResetMarginRight" value=""> Reset margin right on small screen </label>
                </div>
            </div>
        </div>

                        <div id="divElementBorder" class="is-tab-content" data-group="element" style="display:none;flex-flow:wrap;padding:12px 17px;">

                <div style="margin-top: 13px;font-weight: bold;line-height: 1.7;">框線</div>

                <div class="is-settings clearfix">
                    <div style="display:flex;">
                        <input type="text" id="inpElmBorderWidth" value="" style="width:45px">
                        <select id="inpElmBorderWidthUnit" style="margin-right:15px;">
                            <option value="px">px</option>
                            <option value="em">em</option>
                            <option value="vw">vw</option>
                            <option value="vh">vh</option>
                            <option value="none">none</option>
                        </select>
                        <select id="inpElmBorderStyle" style="margin-right:15px;">
                            <option value=""></option>
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                        </select>
                        <button title="Border Color" class="input-elm-bordercolor is-btn-color"></button>
                    </div>
                </div>

                <div style="margin-top: 25px;font-weight: bold;line-height: 1.7;">單邊設定</div>

                <div class="is-settings clearfix">
                    <div>Border Top:</div>
                    <div style="display:flex;">
                        <input type="text" id="inpElmBorderTopWidth" value="" style="width:45px">
                        <select id="inpElmBorderTopWidthUnit" style="margin-right:15px;">
                            <option value="px">px</option>
                            <option value="em">em</option>
                            <option value="vw">vw</option>
                            <option value="vh">vh</option>
                            <option value="none">none</option>
                        </select>
                        <select id="inpElmBorderTopStyle" style="margin-right:15px;">
                            <option value=""></option>
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                        </select>
                        <button title="Border Top Color" class="input-elm-bordertopcolor is-btn-color"></button>
                    </div>
                </div>

                <div class="is-settings clearfix">
                    <div>Border Bottom:</div>
                    <div style="display:flex;">
                        <input type="text" id="inpElmBorderBottomWidth" value="" style="width:45px">
                        <select id="inpElmBorderBottomWidthUnit" style="margin-right:15px;">
                            <option value="px">px</option>
                            <option value="em">em</option>
                            <option value="vw">vw</option>
                            <option value="vh">vh</option>
                            <option value="none">none</option>
                        </select>
                        <select id="inpElmBorderBottomStyle" style="margin-right:15px;">
                            <option value=""></option>
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                        </select>
                        <button title="Border Bottom Color" class="input-elm-borderbottomcolor is-btn-color"></button>
                    </div>
                </div>

                <div class="is-settings clearfix">
                    <div>Border Left:</div>
                    <div style="display:flex;">
                        <input type="text" id="inpElmBorderLeftWidth" value="" style="width:45px">
                        <select id="inpElmBorderLeftWidthUnit" style="margin-right:15px;">
                            <option value="px">px</option>
                            <option value="em">em</option>
                            <option value="vw">vw</option>
                            <option value="vh">vh</option>
                            <option value="none">none</option>
                        </select>
                        <select id="inpElmBorderLeftStyle" style="margin-right:15px;">
                            <option value=""></option>
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                        </select>
                        <button title="Border Left Color" class="input-elm-borderleftcolor is-btn-color"></button>
                    </div>
                </div>

                <div class="is-settings clearfix">
                    <div>Border Right:</div>
                    <div style="display:flex;">
                        <input type="text" id="inpElmBorderRightWidth" value="" style="width:45px">
                        <select id="inpElmBorderRightWidthUnit" style="margin-right:15px;">
                            <option value="px">px</option>
                            <option value="em">em</option>
                            <option value="vw">vw</option>
                            <option value="vh">vh</option>
                            <option value="none">none</option>
                        </select>
                        <select id="inpElmBorderRightStyle" style="margin-right:15px;">
                            <option value=""></option>
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                        </select>
                        <button title="Border Right Color" class="input-elm-borderrightcolor is-btn-color"></button>
                    </div>
                </div>
        </div>

                        <div id="divElementText" class="is-tab-content" data-group="element" style="display:none;flex-flow:wrap;padding:12px 17px;">

            <div class="is-settings clearfix" style="width:115px;">
                <div>Text Color:</div>
                <div>
                    <button title="文字顏色" class="input-elm-color is-btn-color"></button>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:115px;">
                <div>字型大小:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmFontSize" value="" style="width:45px">
                    <select id="inpElmFontSizeUnit">
                        <option value=""></option>
                        <option value="px">px</option>
                        <option value="pt">pt</option>
                        <option value="em">em</option>
                        <option value="vw">vw</option>
                        <option value="vh">vh</option>
                        <option value="%">%</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:115px;">
                <div>Text Align:</div>
                <div>
                    <select id="inpElmTextAlign">
                        <option value=""></option>
                        <option value="left">左側</option>
                        <option value="center">Center</option>
                        <option value="right">右側</option>
                        <option value="justify">Full</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:115px;">
                <div>Line Height:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmLineHeight" value="" style="width:45px">
                    <select id="inpElmLineHeightUnit">
                        <option value=""></option>
                        <option value="px">px</option>
                        <option value="pt">pt</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:115px;">
                <div>Font Weight:</div>
                <div>
                    <select id="inpElmFontWeight">
                        <option value=""></option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="300">300</option>
                        <option value="400">400</option>
                        <option value="500">500</option>
                        <option value="600">600</option>
                        <option value="700">700</option>
                        <option value="800">800</option>
                        <option value="900">900</option>
                        <option value="bold">粗體</option>
                        <option value="normal">Normal</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:115px;">
                <div>Font Style:</div>
                <div>
                    <select id="inpElmFontStyle">
                        <option value=""></option>
                        <option value="italic">斜體</option>
                        <option value="normal">Normal</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:115px;">
                <div>Text Transform:</div>
                <div>
                    <select id="inpElmTextTransform">
                        <option value=""></option>
                        <option value="uppercase">大小寫轉換</option>
                        <option value="lowercase">Lowercase</option>
                        <option value="capitalize">Capitalize</option>
                        <option value="none">None</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:115px;">
                <div>Text Decoration:</div>
                <div>
                    <select id="inpElmTextDecoration">
                        <option value=""></option>
                        <option value="underline">底線</option>
                        <option value="line-through">Line Through</option>
                        <option value="overline">Overline</option>
                        <option value="none">None</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:115px;">
                <div>間距:</div>
                <div>
                    <input type="text" id="inpElmLetterSpacing" value="" style="width:45px"> &nbsp;px
                </div>
            </div>

            <div class="is-settings clearfix" style="width:115px;">
                <div>Word Spacing:</div>
                <div>
                    <input type="text" id="inpElmWordSpacing" value="" style="width:45px"> &nbsp;px
                </div>
            </div>

            <div class="is-settings clearfix" style="width:100%;">
                <div>Font Family:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmFontFamily" value="" style="width:100%">
                    <button title="Select Font" class="input-elm-fontfamily" style="border-left: none;width:45px;padding:0;"><svg class="is-icon-flex"><use xlink:href="#ion-more"></use></svg></button>
                </div>
            </div>
        </div>

                        <div id="divElementCorner" class="is-tab-content" data-group="element" style="display:none;flex-flow:wrap;padding:12px 17px;">

            <div style="margin-top: 13px;font-weight: bold;width:100%;">框線弧度</div>

            <div class="is-settings clearfix" style="width:100%;margin-bottom:9px;">
                <div>Border Radius:</div>
                <div>
                    <input type="text" id="inpElmBorderRadius" value="" style="width:45px"> &nbsp;px
                </div>
            </div>

            <div style="margin-top: 25px;font-weight: bold;width:100%;">Individual Corners</div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Top Left:</div>
                <div>
                    <input type="text" id="inpElmBorderTopLeftRadius" value="" style="width:45px"> &nbsp;px
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Top Right:</div>
                <div>
                    <input type="text" id="inpElmBorderTopRightRadius" value="" style="width:45px"> &nbsp;px
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Bottom Left:</div>
                <div>
                    <input type="text" id="inpElmBorderBottomLeftRadius" value="" style="width:45px"> &nbsp;px
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Bottom Right:</div>
                <div>
                    <input type="text" id="inpElmBorderBottomRightRadius" value="" style="width:45px"> &nbsp;px
                </div>
            </div>
        </div>

                        <div id="divElementShadow" class="is-tab-content" data-group="element" style="display:none;flex-flow:wrap;padding:12px 17px;">

            <div style="margin-top:13px;font-weight:bold;width:100%;">框線陰影</div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>x Offset:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmBoxShadowX" value="" style="width:45px">
                    <select id="inpElmBoxShadowXUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>y Offset:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmBoxShadowY" value="" style="width:45px">
                    <select id="inpElmBoxShadowYUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Blur:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmBoxShadowBlur" value="" style="width:45px">
                    <select id="inpElmBoxShadowBlurUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Spread:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmBoxShadowSpread" value="" style="width:45px">
                    <select id="inpElmBoxShadowSpreadUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:100%;">
                <div>Shadow Color:</div>
                <div>
                <button title="Shadow Color" class="input-elm-shadowcolor is-btn-color"></button>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:100%;">
                <div>Outer/Inner Shadow:</div>
                <div>
                    <select id="inpElmBoxShadowInset">
                        <option value="">Outset</option>
                        <option value="inset">Inset</option>
                    </select>
                </div>
            </div>
        </div>

                        <div id="divElementDisplay" class="is-tab-content" data-group="element" style="display:none;flex-flow:wrap;padding:12px 17px;">

            <div style="margin-top:13px;font-weight:bold;">Display</div>

            <div class="is-settings clearfix" style="width:100%;">
                <div style="display:flex">
                    <select id="inpElmDisplay" style="width:110px;">
                        <option value=""></option>
                        <option value="block">Block</option>
                        <option value="inline-block">Inline Block</option>
                        <option value="inline">Inline</option>
                        <option value="flex">Flex</option>
                        <option value="none">None</option>
                    </select>
                </div>
            </div>

            <div style="margin-top:25px;font-weight:bold;width:100%;">Flex</div>

            <div class="is-settings clearfix" style="width:120px;">
                <div>Direction:</div>
                <div style="display:flex">
                    <select id="inpElmFlexDirection" style="width:110px;">
                        <option value=""></option>
                        <option value="row">Row</option>
                        <option value="row-reverse">Row Reverse</option>
                        <option value="column">Column</option>
                        <option value="column-reverse">Column Reverse</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div>Wrap:</div>
                <div style="display:flex">
                    <select id="inpElmFlexWrap" style="width:110px;">
                        <option value=""></option>
                        <option value="no-wrap">No Wrap</option>
                        <option value="wrap">Wrap</option>
                        <option value="wrap-reverse">Wrap Reverse</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:100%;">
                <div>Justify Content:</div>
                <div style="display:flex">
                    <select id="inpElmJustifyContent" style="width:110px;">
                        <option value=""></option>
                        <option value="center">Center</option>
                        <option value="flex-start">Flex Start</option>
                        <option value="flex-end">Flex End</option>
                        <option value="space-around">Space Around</option>
                        <option value="space-between">Space Between</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div>Align Items:</div>
                <div style="display:flex">
                    <select id="inpElmAlignItems" style="width:110px;">
                        <option value=""></option>
                        <option value="center">Center</option>
                        <option value="flex-start">Flex Start</option>
                        <option value="flex-end">Flex End</option>
                        <option value="stretch">Stretch</option>
                        <option value="baseline">Baseline</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div>Align Content:</div>
                <div style="display:flex">
                    <select id="inpElmAlignContent" style="width:110px;">
                        <option value=""></option>
                        <option value="center">Center</option>
                        <option value="flex-start">Flex Start</option>
                        <option value="flex-end">Flex End</option>
                        <option value="stretch">Stretch</option>
                        <option value="space-around">Space Around</option>
                        <option value="space-between">Space Between</option>
                    </select>
                </div>
            </div>
        </div>

                        <div id="divElementPosition" class="is-tab-content" data-group="element" style="display:none;flex-flow:wrap;padding:12px 17px;">

            <div style="margin-top:13px;font-weight:bold;width:100%;">Position</div>

            <div class="is-settings clearfix" style="width:100%;">
                <div style="display:flex">
                    <select id="inpElmPosition">
                        <option value=""></option>
                        <option value="relative">Relative</option>
                        <option value="absolute">Absolute</option>
                        <option value="fixed">Fixed</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div>上方:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmTop" value="" style="width:45px">
                    <select id="inpElmTopUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                        <option value="vw">vw</option>
                        <option value="vh">vh</option>
                        <option value="%">%</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div>左側:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmLeft" value="" style="width:45px">
                    <select id="inpElmLeftUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                        <option value="vw">vw</option>
                        <option value="vh">vh</option>
                        <option value="%">%</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div>Bottom:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmBottom" value="" style="width:45px">
                    <select id="inpElmBottomUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                        <option value="vw">vw</option>
                        <option value="vh">vh</option>
                        <option value="%">%</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div>右側:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmRight" value="" style="width:45px">
                    <select id="inpElmRightUnit">
                        <option value="px">px</option>
                        <option value="em">em</option>
                        <option value="vw">vw</option>
                        <option value="vh">vh</option>
                        <option value="%">%</option>
                    </select>
                </div>
            </div>

            <div style="margin-top: 25px;font-weight: bold;width:100%;">Float</div>

            <div class="is-settings clearfix" style="width:100%;">
                <div style="display:flex">
                    <select id="inpElmFloat">
                        <option value=""></option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="none">None</option>
                    </select>
                </div>
            </div>
        </div>

                        <div id="divElementEffect" class="is-tab-content" data-group="element" style="display:none;flex-flow:wrap;padding:12px 17px;">

            <div style="margin-top:13px;font-weight:bold;">Effects</div>

            <div class="is-settings clearfix" style="width:100%;">
                <div>Opacity:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmOpacity" value="" style="width:45px">
                </div>
            </div>

            <div style="margin-top:25px;font-weight:bold;width:100%;">Filters</div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Blur:</div>
                <div>
                    <input type="text" id="inpElmBlur" value="" style="width:45px"> &nbsp;px
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Brightness:</div>
                <div>
                    <input type="text" id="inpElmBrightness" value="" style="width:45px">
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Contrast:</div>
                <div>
                    <input type="text" id="inpElmContrast" value="" style="width:45px"> &nbsp;%
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Grayscale:</div>
                <div>
                    <input type="text" id="inpElmGrayscale" value="" style="width:45px"> &nbsp;%
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Hue Rotate:</div>
                <div>
                    <input type="text" id="inpElmHueRotate" value="" style="width:45px"> &nbsp;<span style="font-size:12px">deg</span>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Invert:</div>
                <div>
                    <input type="text" id="inpElmInvert" value="" style="width:45px"> &nbsp;%
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Saturate:</div>
                <div>
                    <input type="text" id="inpElmSaturate" value="" style="width:45px">
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div>Sepia:</div>
                <div>
                    <input type="text" id="inpElmSepia" value="" style="width:45px"> &nbsp;%
                </div>
            </div>
        </div>

                        <div id="divElementAttribute" class="is-tab-content" data-group="element" style="display:none;flex-flow:wrap;padding:12px 17px;">

            <div style="margin-top:13px;font-weight:bold;width:100%;">Attributes</div>

            <div class="is-settings clearfix" style="width:120px;">
                <div style="width:100%">Names:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmAttr1" value="" style="width:90%">
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div style="width:100%">Values:</div>
                <div style="display:flex">
                    <input type="text" id="inpElmAttrVal1" value="" style="width:90%">
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div style="display:flex">
                    <input type="text" id="inpElmAttr2" value="" style="width:90%">
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div style="display:flex">
                    <input type="text" id="inpElmAttrVal2" value="" style="width:90%">
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div style="display:flex">
                    <input type="text" id="inpElmAttr3" value="" style="width:90%">
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div style="display:flex">
                    <input type="text" id="inpElmAttrVal3" value="" style="width:90%">
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div style="display:flex">
                    <input type="text" id="inpElmAttr4" value="" style="width:90%">
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div style="display:flex">
                    <input type="text" id="inpElmAttrVal4" value="" style="width:90%">
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;">
                <div style="display:flex">
                    <input type="text" id="inpElmAttr5" value="" style="width:90%">
                </div>
            </div>

            <div class="is-settings clearfix" style="width:120px;float:left;">
                <div style="display:flex">
                    <input type="text" id="inpElmAttrVal5" value="" style="width:90%">
                </div>
            </div>
        </div>

                        <div id="divElementAnimation" class="is-tab-content" data-group="element" style="display:none;flex-flow:wrap;padding:12px 17px;">

            <div style="margin-top:13px;font-weight:bold;">Animate</div>

            <div class="is-settings clearfix" style="width:100%;">
                <div style="display:flex">
                    <select id="selElmAnim">
                        <option value=""></option>
                        <option value="fade">fade</option>
                        <option value="fade-up">fade-up</option>
                        <option value="fade-down">fade-down</option>
                        <option value="fade-left">fade-left</option>
                        <option value="fade-right">fade-right</option>
                        <option value="fade-up-right">fade-up-right</option>
                        <option value="fade-up-left">fade-up-left</option>
                        <option value="fade-down-right">fade-down-right</option>
                        <option value="fade-down-left">fade-down-left</option>
                        <option value="flip-up">flip-up</option>
                        <option value="flip-down">flip-down</option>
                        <option value="flip-left">flip-left</option>
                        <option value="flip-right">flip-right</option>
                        <option value="slide-up">slide-up</option>
                        <option value="slide-down">slide-down</option>
                        <option value="slide-left">slide-left</option>
                        <option value="slide-right">slide-right</option>
                        <option value="zoom-in">zoom-in</option>
                        <option value="zoom-in-up">zoom-in-up</option>
                        <option value="zoom-in-down">zoom-in-down</option>
                        <option value="zoom-in-left">zoom-in-left</option>
                        <option value="zoom-in-right">zoom-in-right</option>
                        <option value="zoom-out">zoom-out</option>
                        <option value="zoom-out-up">zoom-out-up</option>
                        <option value="zoom-out-down">zoom-out-down</option>
                        <option value="zoom-out-left">zoom-out-left</option>
                        <option value="zoom-out-right">zoom-out-right</option>
                    </select>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div> Delay:</div>
                <div>
                    <select id="selElmAnimDelay">
                        <option value=""></option>
                        <option value="0">0</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="300">300</option>
                        <option value="400">400</option>
                        <option value="500">500</option>
                        <option value="600">600</option>
                        <option value="700">700</option>
                        <option value="800">800</option>
                        <option value="900">900</option>
                        <option value="1000">1000</option>
                        <option value="1100">1100</option>
                        <option value="1200">1200</option>
                        <option value="1300">1300</option>
                        <option value="1400">1400</option>
                        <option value="1500">1500</option>
                        <option value="1600">1600</option>
                        <option value="1700">1700</option>
                        <option value="1800">1800</option>
                        <option value="1900">1900</option>
                        <option value="2000">2000</option>
                        <option value="2100">2100</option>
                        <option value="2200">2200</option>
                        <option value="2300">2300</option>
                        <option value="2400">2400</option>
                        <option value="2500">2500</option>
                        <option value="2600">2600</option>
                        <option value="2700">2700</option>
                        <option value="2800">2800</option>
                        <option value="2900">2900</option>
                        <option value="3000">3000</option>
                    </select> &nbsp;ms
                </div>
            </div>

            <div class="is-settings clearfix" style="width:110px;">
                <div> Duration:</div>
                <div>
                    <select id="selElmAnimDuration">
                        <option value=""></option>
                        <option value="0">0</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="300">300</option>
                        <option value="400">400</option>
                        <option value="500">500</option>
                        <option value="600">600</option>
                        <option value="700">700</option>
                        <option value="800">800</option>
                        <option value="900">900</option>
                        <option value="1000">1000</option>
                        <option value="1100">1100</option>
                        <option value="1200">1200</option>
                        <option value="1300">1300</option>
                        <option value="1400">1400</option>
                        <option value="1500">1500</option>
                        <option value="1600">1600</option>
                        <option value="1700">1700</option>
                        <option value="1800">1800</option>
                        <option value="1900">1900</option>
                        <option value="2000">2000</option>
                        <option value="2100">2100</option>
                        <option value="2200">2200</option>
                        <option value="2300">2300</option>
                        <option value="2400">2400</option>
                        <option value="2500">2500</option>
                        <option value="2600">2600</option>
                        <option value="2700">2700</option>
                        <option value="2800">2800</option>
                        <option value="2900">2900</option>
                        <option value="3000">3000</option>
                    </select> &nbsp;ms
                </div>
            </div>

            <div class="is-settings clearfix" style="width:100%;">
                <div style="margin-top:15px">
                    <label for="chkAnimateOnce"><input type="checkbox" id="chkAnimateOnce" value=""> Animate Once </label>
                </div>
            </div>

            <div class="is-settings clearfix" style="width:100%;">
                <div style="display:flex">
                    <button title="Test" id="btnPreviewAnim" class="classic" value=""> TEST </button>
                </div>
            </div>
        </div>

                    </div>
            </div>

            <div class="is-modal editstyles">
                <div class="is-modal-bar is-draggable" style="" draggable="">
                    <div class="is-modal-close" style="z-index:1;width:20px;height:20px;position:absolute;top:0px;right:0px;box-sizing:border-box;padding:0;line-height:20px;font-size:10px;color:#777;text-align:center;cursor:pointer;">✕</div>
                </div>
                <div style="padding:12px">
                    <div class="is-settings clearfix" style="display:inline-block;width:100%;margin-bottom:0;">
                        <div>Style:</div>
                        <div>
                            <textarea id="inpElmInlineStyle" style="width:100%;height:256px;margin:0px;border:none;background:#f3f3f3;font-size: 14px;line-height: 1.5;letter-spacing: 0;" data-gramm="false" wt-ignore-input="true"></textarea>
                        </div>
                    </div>
                    <div class="is-settings clearfix" style="display:inline-block;width:100%;margin-bottom:0;">
                        <div>Class:</div>
                        <div>
                            <input type="text" id="inpElmClassName" value="" style="width:100%;padding-left: 16px;font-family: courier;font-size: 17px;line-height: 2;letter-spacing: 1px;border:none;background:#f3f3f3;">
                        </div>
                    </div>
                </div>
            </div>
            <div id="KOl2yRx">
            <div class="is-modal pickgradientcolor">
            <div style="max-width:201px;padding:0;">
                <div class="is-modal-bar is-draggable" style="position: absolute;top: 0;left: 0;height:11px;width: 100%;background: transparent;" draggable=""></div>
                <div style="padding:12px 12px 12px">
                    <div class="div-gradients" style="display: flex;flex-flow: wrap;margin-bottom:10px;">
                        <button data-elmgradient="linear-gradient(0deg, rgb(255, 57, 25), rgb(249, 168, 37))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(255, 57, 25), rgb(249, 168, 37));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(255, 57, 25), rgb(255, 104, 15))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(255, 57, 25), rgb(255, 104, 15));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, #FF5722, #FF9800)" data-textcolor="" style="background-image:linear-gradient(0deg, #FF5722, #FF9800);width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, #613ca2, rgb(110, 123, 217))" data-textcolor="" style="background-image:linear-gradient(0deg, #613ca2, rgb(110, 123, 217));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(65, 70, 206), rgb(236, 78, 130))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(65, 70, 206), rgb(236, 78, 130));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(0, 150, 102), rgb(90, 103, 197))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(0, 150, 102), rgb(90, 103, 197));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(30deg, rgb(249, 119, 148), rgb(98, 58, 162))" data-textcolor="" style="background-image:linear-gradient(30deg, rgb(249, 119, 148), rgb(98, 58, 162));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(223, 70, 137), rgb(90, 103, 197))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(223, 70, 137), rgb(90, 103, 197));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(40, 53, 147), rgb(90, 103, 197))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(40, 53, 147), rgb(90, 103, 197));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(21, 101, 192), rgb(52, 169, 239))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(21, 101, 192), rgb(52, 169, 239));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(32, 149, 219), rgb(139, 109, 230))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(32, 149, 219), rgb(139, 109, 230));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(90, 103, 197), rgb(0, 184, 201))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(90, 103, 197), rgb(0, 184, 201));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(0, 184, 201), rgb(253, 187, 45))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(0, 184, 201), rgb(253, 187, 45));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(255, 208, 100), rgb(239, 98, 159))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(255, 208, 100), rgb(239, 98, 159));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(0, 214, 223), rgb(130, 162, 253))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(0, 214, 223), rgb(130, 162, 253));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(50, 234, 251), rgb(248, 247, 126))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(50, 234, 251), rgb(248, 247, 126));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(141, 221, 255), rgb(255, 227, 255))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(141, 221, 255), rgb(255, 227, 255));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(255, 170, 170), rgb(255, 255, 200))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(255, 170, 170), rgb(255, 255, 200));width:35px;height:35px;border:none;"></button><button data-elmgradient="linear-gradient(0deg, rgb(239, 239, 239), rgb(252, 252, 252))" data-textcolor="" style="background-image:linear-gradient(0deg, rgb(239, 239, 239), rgb(252, 252, 252));width:35px;height:35px;border:none;"></button>
                        <button class="input-gradient-clear" title="清除格式設定" data-value="" style="width:35px;height:35px;border:rgba(0,0,0,0.09) 1px solid;border-left: none;border-top: none;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.8);width:23px;height:23px;"><use xlink:href="#ion-ios-close-empty"></use></svg></button>
                    </div>
                    <div class="is-settings" style="margin-bottom:0">
                        <div class="is-label" style="margin-top:0">Custom:</div>
                        <div class="div-custom-gradients clearfix" style="height:auto;display: flex;flex-flow: wrap;"></div>
                        <div>
                            <button title="Select Color" class="input-gradient-color1 is-btn-color" data-value="dark" style="border-right:none"></button>
                            <button title="Select Color" class="input-gradient-color2 is-btn-color" data-value="dark"></button>
                            <input type="text" class="input-gradient-deg" value="0" style="width:60px;height:35px;margin-left:7px;margin-right:5px;font-size:14px;"> deg
                        </div>
                    </div>
                    <div class="is-settings clearfix" style="margin-bottom:0">
                        <button title="新增" class="input-gradient-save" style="width:100%;border:none;"> 新增 </button>
                    </div>
                </div>
            </div>
        </div>
        </div><div id="vlekFx7"></div><div id="MTo0fmf" style=""><div class="is-modal pickcolor" style="background: rgba(255, 255, 255, 0);">
            <div style="max-width: 271px; padding: 0px;">
                <div class="is-modal-bar is-draggable" style="position: absolute;top: 0;left: 0;height:11px;width: 100%;background: transparent;" draggable=""></div>
                <div style="padding: 12px;">

                    <div class="color-default clearfix"><button title="#ff8f00" data-color="#ff8f00" style="background:#ff8f00;"></button><button title="#ef6c00" data-color="#ef6c00" style="background:#ef6c00;"></button><button title="#d84315" data-color="#d84315" style="background:#d84315;"></button><button title="#c62828" data-color="#c62828" style="background:#c62828;"></button><button title="#58362f" data-color="#58362f" style="background:#58362f;"></button><button title="#37474f" data-color="#37474f" style="background:#37474f;"></button><button title="#353535" data-color="#353535" style="background:#353535;"></button><button title="#f9a825" data-color="#f9a825" style="background:#f9a825;"></button><button title="#9e9d24" data-color="#9e9d24" style="background:#9e9d24;"></button><button title="#558b2f" data-color="#558b2f" style="background:#558b2f;"></button><button title="#ad1457" data-color="#ad1457" style="background:#ad1457;"></button><button title="#6a1b9a" data-color="#6a1b9a" style="background:#6a1b9a;"></button><button title="#4527a0" data-color="#4527a0" style="background:#4527a0;"></button><button title="#616161" data-color="#616161" style="background:#616161;"></button><button title="#00b8c9" data-color="#00b8c9" style="background:#00b8c9;"></button><button title="#009666" data-color="#009666" style="background:#009666;"></button><button title="#2e7d32" data-color="#2e7d32" style="background:#2e7d32;"></button><button title="#0277bd" data-color="#0277bd" style="background:#0277bd;"></button><button title="#1565c0" data-color="#1565c0" style="background:#1565c0;"></button><button title="#283593" data-color="#283593" style="background:#283593;"></button><button title="#9e9e9e" data-color="#9e9e9e" style="background:#9e9e9e;"></button></div>
                    <div class="color-gradient clearfix"><div id="row-0" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#414141" data-color="#414141" style="background: rgb(65, 65, 65);"></div><div title="#666666" data-color="#666666" style="background: rgb(102, 102, 102);"></div><div title="#8a8a8a" data-color="#8a8a8a" style="background: rgb(138, 138, 138);"></div><div title="#aeaeae" data-color="#aeaeae" style="background: rgb(174, 174, 174);"></div><div title="#d3d3d3" data-color="#d3d3d3" style="background: rgb(211, 211, 211);"></div><div title="#f7f7f7" data-color="#f7f7f7" style="background: rgb(247, 247, 247);"></div></div><div id="row-1" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#3a3a3a" data-color="#3a3a3a" style="background: rgb(58, 58, 58);"></div><div title="#5e5e5e" data-color="#5e5e5e" style="background: rgb(94, 94, 94);"></div><div title="#838383" data-color="#838383" style="background: rgb(131, 131, 131);"></div><div title="#a7a7a7" data-color="#a7a7a7" style="background: rgb(167, 167, 167);"></div><div title="#cccccc" data-color="#cccccc" style="background: rgb(204, 204, 204);"></div><div title="#f0f0f0" data-color="#f0f0f0" style="background: rgb(240, 240, 240);"></div></div><div id="row-2" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#333333" data-color="#333333" style="background: rgb(51, 51, 51);"></div><div title="#575757" data-color="#575757" style="background: rgb(87, 87, 87);"></div><div title="#7b7b7b" data-color="#7b7b7b" style="background: rgb(123, 123, 123);"></div><div title="#a0a0a0" data-color="#a0a0a0" style="background: rgb(160, 160, 160);"></div><div title="#c4c4c4" data-color="#c4c4c4" style="background: rgb(196, 196, 196);"></div><div title="#e9e9e9" data-color="#e9e9e9" style="background: rgb(233, 233, 233);"></div></div><div id="row-3" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#2b2b2b" data-color="#2b2b2b" style="background: rgb(43, 43, 43);"></div><div title="#505050" data-color="#505050" style="background: rgb(80, 80, 80);"></div><div title="#747474" data-color="#747474" style="background: rgb(116, 116, 116);"></div><div title="#999999" data-color="#999999" style="background: rgb(153, 153, 153);"></div><div title="#bdbdbd" data-color="#bdbdbd" style="background: rgb(189, 189, 189);"></div><div title="#e1e1e1" data-color="#e1e1e1" style="background: rgb(225, 225, 225);"></div></div><div id="row-4" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#242424" data-color="#242424" style="background: rgb(36, 36, 36);"></div><div title="#484848" data-color="#484848" style="background: rgb(72, 72, 72);"></div><div title="#6d6d6d" data-color="#6d6d6d" style="background: rgb(109, 109, 109);"></div><div title="#919191" data-color="#919191" style="background: rgb(145, 145, 145);"></div><div title="#b6b6b6" data-color="#b6b6b6" style="background: rgb(182, 182, 182);"></div><div title="#dadada" data-color="#dadada" style="background: rgb(218, 218, 218);"></div></div></div>

                    <div class="div-color-opacity" style="height: 10px; margin: 12px 0px 17px; position: relative;">
                        <div style="position:absolute;top:0;left:0;width:100%;height:23px;display:flex;flex-direction:column;flex-flow:wrap">
                            <div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div>
                        </div>
                        <input class="color-opacity" type="range" min="0" max="1" step="0.01" style="position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0;"><div class=" rangeSlider rangeSlider__horizontal" id="js-rangeSlider-651b25ca-5539-5fc7-1bdf-f19851d12e23" style=""><div class=" rangeSlider__buffer rangeSlider__buffer__horizontal"></div><div class=" rangeSlider__fill rangeSlider__fill__horizontal" style="width: 232.5px;"></div><div class=" rangeSlider__handle rangeSlider__handle__horizontal" style="transform: translateX(220px);"></div></div>
                    </div>
                    <div class="clearfix" style="margin:25px 0 3px;">
                        <button title="黑色" data-color="#000000" style="background:#111111;color:#f3f3f3;border:transparent 1px solid;width:35px;height:35px;line-height:35px;font-size:10px;border-right:none;">黑色</button>
                        <button title="白色" data-color="#ffffff" style="background:#ffffff;width:35px;height:35px;line-height:35px;font-size:10px;">白色</button>
                        <button title="清除格式設定" data-color="" class="clear" style="width:140px;height:35px;line-height:35px;border-right:none;">清除格式設定</button>
                        <button title="更多選項" class="input-hsl" style="background:#ffffff;width:35px;height:35px;line-height:35px;font-size:10px;"><svg class="is-icon-flex" style="fill: rgba(0, 0, 0, 0.45);width:13px;height:13px;"><use xlink:href="#ion-more"></use></svg></button>
                    </div>
                    <div style="display:flex">
                        <div style="border: rgba(231, 231, 231, 0.87) 1px solid;flex-grow: 0;flex-shrink: 0;flex-basis: 37px;height:35px;box-sizing:border-box;margin-top:8px;position:relative;">
                            <div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;flex-flow:wrap;overflow:hidden;">
                                <div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div>
                            </div>
                            <button class="is-color-preview" style="position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; transition: none 0s ease 0s; background: none;"></button>
                        </div>
                        <input class="input-text" type="text" style="width:209px;height:35px;margin-top:8px;font-size:13px;">
                        <button title="執行" class="input-ok" style="height:35px;margin-top:8px;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);"><use xlink:href="#icon-ok"></use></svg></button>
                    </div>

                </div>
            </div>
        </div><div class="is-modal pickcolormore" style="background: rgba(255, 255, 255, 0);">
            <div style="max-width: 341px; padding: 0px;">
                <div class="is-modal-bar is-draggable" style="position: absolute;top: 0;left: 0;height:11px;width: 100%;background: transparent;" draggable=""></div>
                <div style="padding: 12px;">

                    <div class="color-swatch clearfix"><div id="row-0" style="width: 100%;"><div title="#0d0c0c" data-color="#0d0c0c" style="background: rgb(13, 12, 12);"></div><div title="#282424" data-color="#282424" style="background: rgb(40, 36, 36);"></div><div title="#423c3c" data-color="#423c3c" style="background: rgb(66, 60, 60);"></div><div title="#5d5454" data-color="#5d5454" style="background: rgb(93, 84, 84);"></div><div title="#786d6d" data-color="#786d6d" style="background: rgb(120, 109, 109);"></div><div title="#857979" data-color="#857979" style="background: rgb(133, 121, 121);"></div><div title="#aaa1a1" data-color="#aaa1a1" style="background: rgb(170, 161, 161);"></div><div title="#c2bcbc" data-color="#c2bcbc" style="background: rgb(194, 188, 188);"></div><div title="#dad6d6" data-color="#dad6d6" style="background: rgb(218, 214, 214);"></div><div title="#f2f1f1" data-color="#f2f1f1" style="background: rgb(242, 241, 241);"></div></div><div id="row-1" style="width: 100%;"><div title="#0e0a0a" data-color="#0e0a0a" style="background: rgb(14, 10, 10);"></div><div title="#2c2020" data-color="#2c2020" style="background: rgb(44, 32, 32);"></div><div title="#4a3535" data-color="#4a3535" style="background: rgb(74, 53, 53);"></div><div title="#674a4a" data-color="#674a4a" style="background: rgb(103, 74, 74);"></div><div title="#856060" data-color="#856060" style="background: rgb(133, 96, 96);"></div><div title="#946a6a" data-color="#946a6a" style="background: rgb(148, 106, 106);"></div><div title="#b49797" data-color="#b49797" style="background: rgb(180, 151, 151);"></div><div title="#c9b4b4" data-color="#c9b4b4" style="background: rgb(201, 180, 180);"></div><div title="#ded2d2" data-color="#ded2d2" style="background: rgb(222, 210, 210);"></div><div title="#f4f0f0" data-color="#f4f0f0" style="background: rgb(244, 240, 240);"></div></div><div id="row-2" style="width: 100%;"><div title="#100909" data-color="#100909" style="background: rgb(16, 9, 9);"></div><div title="#301b1b" data-color="#301b1b" style="background: rgb(48, 27, 27);"></div><div title="#512e2e" data-color="#512e2e" style="background: rgb(81, 46, 46);"></div><div title="#714040" data-color="#714040" style="background: rgb(113, 64, 64);"></div><div title="#915353" data-color="#915353" style="background: rgb(145, 83, 83);"></div><div title="#a25c5c" data-color="#a25c5c" style="background: rgb(162, 92, 92);"></div><div title="#be8d8d" data-color="#be8d8d" style="background: rgb(190, 141, 141);"></div><div title="#d0adad" data-color="#d0adad" style="background: rgb(208, 173, 173);"></div><div title="#e3cece" data-color="#e3cece" style="background: rgb(227, 206, 206);"></div><div title="#f5eeee" data-color="#f5eeee" style="background: rgb(245, 238, 238);"></div></div><div id="row-3" style="width: 100%;"><div title="#110707" data-color="#110707" style="background: rgb(17, 7, 7);"></div><div title="#341717" data-color="#341717" style="background: rgb(52, 23, 23);"></div><div title="#582727" data-color="#582727" style="background: rgb(88, 39, 39);"></div><div title="#7b3737" data-color="#7b3737" style="background: rgb(123, 55, 55);"></div><div title="#9e4646" data-color="#9e4646" style="background: rgb(158, 70, 70);"></div><div title="#b04e4e" data-color="#b04e4e" style="background: rgb(176, 78, 78);"></div><div title="#c78383" data-color="#c78383" style="background: rgb(199, 131, 131);"></div><div title="#d7a6a6" data-color="#d7a6a6" style="background: rgb(215, 166, 166);"></div><div title="#e7caca" data-color="#e7caca" style="background: rgb(231, 202, 202);"></div><div title="#f7eded" data-color="#f7eded" style="background: rgb(247, 237, 237);"></div></div><div id="row-4" style="width: 100%;"><div title="#130606" data-color="#130606" style="background: rgb(19, 6, 6);"></div><div title="#391313" data-color="#391313" style="background: rgb(57, 19, 19);"></div><div title="#5f2020" data-color="#5f2020" style="background: rgb(95, 32, 32);"></div><div title="#852d2d" data-color="#852d2d" style="background: rgb(133, 45, 45);"></div><div title="#ab3a3a" data-color="#ab3a3a" style="background: rgb(171, 58, 58);"></div><div title="#be4040" data-color="#be4040" style="background: rgb(190, 64, 64);"></div><div title="#d17979" data-color="#d17979" style="background: rgb(209, 121, 121);"></div><div title="#de9f9f" data-color="#de9f9f" style="background: rgb(222, 159, 159);"></div><div title="#ebc5c5" data-color="#ebc5c5" style="background: rgb(235, 197, 197);"></div><div title="#f8ebeb" data-color="#f8ebeb" style="background: rgb(248, 235, 235);"></div></div><div id="row-5" style="width: 100%;"><div title="#140505" data-color="#140505" style="background: rgb(20, 5, 5);"></div><div title="#3d0f0f" data-color="#3d0f0f" style="background: rgb(61, 15, 15);"></div><div title="#661919" data-color="#661919" style="background: rgb(102, 25, 25);"></div><div title="#8f2323" data-color="#8f2323" style="background: rgb(143, 35, 35);"></div><div title="#b82d2d" data-color="#b82d2d" style="background: rgb(184, 45, 45);"></div><div title="#cc3232" data-color="#cc3232" style="background: rgb(204, 50, 50);"></div><div title="#db6f6f" data-color="#db6f6f" style="background: rgb(219, 111, 111);"></div><div title="#e59898" data-color="#e59898" style="background: rgb(229, 152, 152);"></div><div title="#efc1c1" data-color="#efc1c1" style="background: rgb(239, 193, 193);"></div><div title="#f9eaea" data-color="#f9eaea" style="background: rgb(249, 234, 234);"></div></div><div id="row-6" style="width: 100%;"><div title="#150303" data-color="#150303" style="background: rgb(21, 3, 3);"></div><div title="#410a0a" data-color="#410a0a" style="background: rgb(65, 10, 10);"></div><div title="#6d1212" data-color="#6d1212" style="background: rgb(109, 18, 18);"></div><div title="#991919" data-color="#991919" style="background: rgb(153, 25, 25);"></div><div title="#c42020" data-color="#c42020" style="background: rgb(196, 32, 32);"></div><div title="#da2424" data-color="#da2424" style="background: rgb(218, 36, 36);"></div><div title="#e56565" data-color="#e56565" style="background: rgb(229, 101, 101);"></div><div title="#ec9191" data-color="#ec9191" style="background: rgb(236, 145, 145);"></div><div title="#f4bdbd" data-color="#f4bdbd" style="background: rgb(244, 189, 189);"></div><div title="#fbe9e9" data-color="#fbe9e9" style="background: rgb(251, 233, 233);"></div></div><div id="row-7" style="width: 100%;"><div title="#170202" data-color="#170202" style="background: rgb(23, 2, 2);"></div><div title="#450606" data-color="#450606" style="background: rgb(69, 6, 6);"></div><div title="#740a0a" data-color="#740a0a" style="background: rgb(116, 10, 10);"></div><div title="#a30f0f" data-color="#a30f0f" style="background: rgb(163, 15, 15);"></div><div title="#d11313" data-color="#d11313" style="background: rgb(209, 19, 19);"></div><div title="#e91515" data-color="#e91515" style="background: rgb(233, 21, 21);"></div><div title="#ef5b5b" data-color="#ef5b5b" style="background: rgb(239, 91, 91);"></div><div title="#f48a8a" data-color="#f48a8a" style="background: rgb(244, 138, 138);"></div><div title="#f8b9b9" data-color="#f8b9b9" style="background: rgb(248, 185, 185);"></div><div title="#fce7e7" data-color="#fce7e7" style="background: rgb(252, 231, 231);"></div></div><div id="row-8" style="width: 100%;"><div title="#180000" data-color="#180000" style="background: rgb(24, 0, 0);"></div><div title="#4a0202" data-color="#4a0202" style="background: rgb(74, 2, 2);"></div><div title="#7b0303" data-color="#7b0303" style="background: rgb(123, 3, 3);"></div><div title="#ad0505" data-color="#ad0505" style="background: rgb(173, 5, 5);"></div><div title="#de0707" data-color="#de0707" style="background: rgb(222, 7, 7);"></div><div title="#f70707" data-color="#f70707" style="background: rgb(247, 7, 7);"></div><div title="#f95151" data-color="#f95151" style="background: rgb(249, 81, 81);"></div><div title="#fb8383" data-color="#fb8383" style="background: rgb(251, 131, 131);"></div><div title="#fcb4b4" data-color="#fcb4b4" style="background: rgb(252, 180, 180);"></div><div title="#fee6e6" data-color="#fee6e6" style="background: rgb(254, 230, 230);"></div></div><div id="row-9" style="width: 100%;"><div title="#190000" data-color="#190000" style="background: rgb(25, 0, 0);"></div><div title="#4c0000" data-color="#4c0000" style="background: rgb(76, 0, 0);"></div><div title="#7f0000" data-color="#7f0000" style="background: rgb(127, 0, 0);"></div><div title="#b20000" data-color="#b20000" style="background: rgb(178, 0, 0);"></div><div title="#e50000" data-color="#e50000" style="background: rgb(229, 0, 0);"></div><div title="#ff0000" data-color="#ff0000" style="background: rgb(255, 0, 0);"></div><div title="#fe4c4c" data-color="#fe4c4c" style="background: rgb(254, 76, 76);"></div><div title="#ff7f7f" data-color="#ff7f7f" style="background: rgb(255, 127, 127);"></div><div title="#ffb2b2" data-color="#ffb2b2" style="background: rgb(255, 178, 178);"></div><div title="#ffe5e5" data-color="#ffe5e5" style="background: rgb(255, 229, 229);"></div></div></div>

                    <div class="div-color-hue" style="height: 23px; margin: 10px 0px 0px;">
                        <input class="color-hue" type="range" min="0" max="360" step="1" style="position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0;"><div class=" rangeSlider rangeSlider__horizontal" id="js-rangeSlider-78661e6b-f876-1687-c0a5-0aa6ddaf0997" style=""><div class=" rangeSlider__buffer rangeSlider__buffer__horizontal"></div><div class=" rangeSlider__fill rangeSlider__fill__horizontal" style="width: 12.5px;"></div><div class=" rangeSlider__handle rangeSlider__handle__horizontal" style="transform: translateX(0px);"></div><div style="display: flex; position: absolute; top: 0px; left: 0px;"><div style="background-color: rgb(230, 0, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 4, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 8, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 11, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 15, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 19, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 23, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 27, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 31, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 34, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 38, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 42, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 46, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 50, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 54, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 57, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 61, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 65, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 69, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 73, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 77, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 80, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 84, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 88, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 92, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 96, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 99, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 103, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 107, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 111, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 115, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 119, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 122, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 126, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 130, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 134, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 138, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 142, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 145, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 149, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 153, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 157, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 161, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 164, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 168, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 172, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 176, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 180, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 184, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 187, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 191, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 195, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 199, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 203, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 207, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 210, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 214, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 218, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 222, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 226, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(226, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(222, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(218, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(214, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(210, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(207, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(203, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(199, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(195, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(191, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(187, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(184, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(180, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(176, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(172, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(168, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(164, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(161, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(157, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(153, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(149, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(145, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(142, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(138, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(134, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(130, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(126, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(122, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(119, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(115, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(111, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(107, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(103, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(99, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(96, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(92, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(88, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(84, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(80, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(76, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(73, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(69, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(65, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(61, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(57, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(54, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(50, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(46, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(42, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(38, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(34, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(31, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(27, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(23, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(19, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(15, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(11, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(8, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(4, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 4); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 8); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 11); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 15); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 19); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 23); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 27); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 31); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 34); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 38); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 42); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 46); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 50); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 54); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 57); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 61); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 65); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 69); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 73); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 77); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 80); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 84); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 88); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 92); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 96); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 99); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 103); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 107); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 111); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 115); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 119); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 122); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 126); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 130); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 134); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 138); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 142); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 145); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 149); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 153); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 157); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 161); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 164); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 168); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 172); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 176); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 180); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 184); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 187); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 191); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 195); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 199); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 203); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 207); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 210); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 214); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 218); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 222); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 226); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 226, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 222, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 218, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 214, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 210, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 207, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 203, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 199, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 195, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 191, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 187, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 184, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 180, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 176, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 172, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 168, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 164, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 161, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 157, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 153, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 149, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 145, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 142, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 138, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 134, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 130, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 126, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 122, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 119, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 115, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 111, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 107, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 103, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 99, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 96, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 92, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 88, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 84, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 80, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 77, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 73, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 69, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 65, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 61, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 57, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 54, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 50, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 46, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 42, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 38, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 34, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 31, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 27, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 23, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 19, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 15, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 11, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 8, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 4, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(4, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(8, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(11, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(15, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(19, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(23, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(27, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(31, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(34, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(38, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(42, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(46, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(50, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(54, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(57, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(61, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(65, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(69, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(73, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(76, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(80, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(84, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(88, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(92, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(96, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(99, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(103, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(107, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(111, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(115, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(119, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(122, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(126, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(130, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(134, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(138, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(142, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(145, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(149, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(153, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(157, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(161, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(164, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(168, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(172, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(176, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(180, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(184, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(187, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(191, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(195, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(199, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(203, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(207, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(210, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(214, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(218, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(222, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(226, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 226); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 222); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 218); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 214); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 210); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 207); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 203); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 199); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 195); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 191); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 187); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 184); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 180); width: 1px; height: 23px;"></div></div></div>
                    </div>

                </div>
            </div>
        </div></div><div id="rMoSYRQ"></div>
            <div class="is-modal pickfontfamily">
                <div style="max-width:303px;padding:0;box-sizing:border-box;position:relative;">
                    <div class="is-modal-bar is-draggable" style="position: absolute;top: 0;left: 0;width: 100%;z-index:1;" draggable=""> 字型 </div>
                    <div class="clearfix" style="margin-top:28px;padding:0px;height:300px;position:relative;">
                        <iframe src="about:blank" style="width:100%;height:100%;position:absolute;top:0;left:0;border: none;"></iframe>
                    </div>
                </div>
            </div>
        <div class="is-tool is-element-tool" style="top: 1112.4px; left: 1630px; display: flex;">
                <button type="button" title="新增" class="elm-add" data-title="新增"><svg class="is-icon-flex"><use xlink:href="#ion-ios-plus-empty"></use></svg></button>
                <button type="button" title="更多選項" class="elm-more" data-title="更多選項"><svg class="is-icon-flex"><use xlink:href="#ion-more"></use></svg></button>
                <button type="button" title="刪除" class="elm-remove" data-title="刪除"><svg class="is-icon-flex" style="margin-left:-1px"><use xlink:href="#ion-ios-close-empty"></use></svg></button>
                <button type="button" title="設定" class="elm-settings" data-title="設定"><svg class="is-icon-flex"><use xlink:href="#ion-ios-gear"></use></svg></button>
            </div>
            <div class="is-pop elmmore" style="z-index:10002;">
                <div style="display:flex;flex-flow:wrap;">
                    <button type="button" title="往上移" class="elm-up"><span><svg class="is-icon-flex" style="width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-up"></use></svg></span>往上移</button>
                    <button type="button" title="往下移" class="elm-down"><span><svg class="is-icon-flex" style="width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-down"></use></svg></span>往下移</button>
                    <button type="button" title="複製" class="elm-duplicate"><span><svg class="is-icon-flex" style="width:12px;height:12px;"><use xlink:href="#ion-ios-photos-outline"></use></svg></span>複製</button>

                    <button type="button" title="設定" class="elm-settings"><span><svg class="is-icon-flex" style="width:12px;height:12px;"><use xlink:href="#ion-ios-gear"></use></svg></span>設定</button>

                </div>
            </div>
            <div id="divLinkTool" class="is-tool"><button title="Edit Button" data-title="Edit Button" class="button-edit" style="display:none;"><svg class="is-icon-flex" style="width:13px;height:13px;"><use xlink:href="#ion-android-create"></use></svg></button>
                <button title="連結" data-title="連結" class="link-edit"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#ion-link"></use></svg></button>
                <button title="複製" data-title="複製" class="link-duplicate"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#ion-ios-photos-outline"></use></svg></button>
                <button title="刪除" data-title="刪除" class="link-remove"><svg class="is-icon-flex" style="width:22px;height:22px;"><use xlink:href="#ion-ios-close-empty"></use></svg></button>
            </div>
            <div class="is-modal createlink">
                <div style="max-width:526px;">
                    <div class="link-src">
                        <input class="input-url" type="text" placeholder="Url">
                        <button title="Select" class="input-select"><svg class="is-icon-flex"><use xlink:href="#ion-more"></use></svg></button>
                    </div>
                    <label style="display:inline-block;margin-top:14px;margin-bottom:10px;float:left;">
                        <input class="input-newwindow" type="checkbox">  開新視窗&nbsp;
                    </label>
                    <input class="input-text" type="text" placeholder="文字" style="width:100%;">
                    <input class="input-title" type="text" placeholder="標題" style="width:100%;border-top: none;margin-bottom:12px;">
                    <div style="text-align:right">
                        <button title="取消" class="input-cancel classic-secondary">取消</button>
                        <button title="確認" class="input-ok classic-primary">確認</button>
                    </div>
                </div>
            </div>

            <div class="is-modal fileselect">
                <div style="max-width:800px;height:80%;padding:0;">
                    <iframe style="width:100%;height:100%;border: none;display: block;" src="about:blank"></iframe>
                </div>
            </div>

                <div id="divImageTool" class="is-tool" style="background: rgba(0, 0, 0, 0.15); border: 1px solid transparent; top: 1134.8px; left: 1259.22px;">
                    <div class="image-embed" style="width: 40px; height: 40px; overflow: hidden; display: none;">
                        <div style="position:absolute;width:100%;height:100%;"><svg class="is-icon-flex" style="position: absolute;top: 13px;left: 15px;width: 14px;height: 14px;fill:rgb(255,255,255);"><use xlink:href="#ion-image"></use></svg></div>
                        <input title="選擇圖片" data-title="選擇圖片" id="fileEmbedImage" type="file" accept="image/*" style="position:absolute;top:-20px;left:0;width:100%;height:60px;opacity: 0;cursor: pointer;">
                    </div>
                    <button title="連結" data-title="連結" class="image-link" style="width:40px;height:40px;background:none;color:#fff;"><svg class="is-icon-flex" style="fill:rgba(255, 255, 255, 0.95);width:17px;height:17px;"><use xlink:href="#ion-link"></use></svg></button>
                    <button title="編輯" data-title="編輯" class="image-edit" style="width: 40px; height: 40px; background: none; color: rgb(255, 255, 255); display: none;"><svg class="is-icon-flex" style="fill:rgb(255,255,255);width:14px;height:14px;"><use xlink:href="#ion-android-create"></use></svg></button>
                </div>
                <div id="divImageProgress">
                    <div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>

                <div class="is-modal imageedit">
                    <div style="width:auto;max-width:826px;padding-top:7px;display:flex;flex-direction:column;align-items:center;">
                        <div class="imageedit-crop" style="display:flex;height:80px;align-items:center;align-self:flex-start;">
                            <button title="5x5" data-crop-size="1" style="width: 60px;height: 60px;">5x5</button>
                            <button title="4x3" data-crop-size="1.33333" style="width: 60px;height: 45px;">4x3</button>
                            <button title="3x4" data-crop-size="0.75" style="width: 45px;height: 60px;">3x4</button>
                            <button title="6x4" data-crop-size="1.5" style="width: 60px;height: 40px;">6x4</button>
                            <button title="4x6" data-crop-size="0.6666" style="width: 40px;height: 60px;">4x6</button>
                            <button title="不限定" data-crop-size="" style="width: 60px;height: 45px;">不限定</button>
                        </div>
                        <div class="imageedit-preview" style="min-width:200px;">
                        </div>
                        <div style="margin-top:7px;text-align:right;align-self:flex-end;">
                            <button title="取消" class="input-cancel classic-secondary">取消</button>
                            <button title="執行" class="input-ok classic-primary">執行</button>
                        </div>
                    </div>
                </div>

                <div class="is-modal imagelink">
                    <div style="max-width:526px;">

                        <div class="image-src">
                            <input class="input-src" type="text" placeholder="連結">
                            <button title="Select" class="input-select" style="flex:none;width:50px;height:50px;"><svg class="is-icon-flex"><use xlink:href="#ion-more"></use></svg></button>
                            <div class="image-larger1" style="position: relative; flex: 0 0 auto; width: 50px; height: 50px; box-shadow: rgba(0, 0, 0, 0.32) 0px 3px 6px -6px; display: none;">
                                <form class="form-upload-larger" target="frameTargetImageUpload" method="post" action="" enctype="multipart/form-data" style="position:absolute;top:0;left:0;width:100%;height:100%;">
				                    <input id="hidRefId1" name="hidRefId" type="hidden" value="">
                                    <svg class="is-icon-flex" style="position: absolute;top: 16px;left: 15px;width: 18px;height: 18px;fill:rgb(53, 53, 53);"><use xlink:href="#ion-image"></use></svg>
                                    <input title="Select" id="fileImage1" name="fileImage" type="file" accept="image/*" style="position:absolute;top:-30px;left:0;width:100%;height:80px;opacity: 0;cursor: pointer;">
                                </form>

                                <iframe id="frameTargetImageUpload" name="frameTargetImageUpload" src="about:blank" style="width:1px;height:1px;position:absolute;top:0;right:-100000px"></iframe>
                            </div>
                        </div>

                        <input class="input-title" type="text" placeholder="Title" style="width:100%;border-top: none;">

                        <div class="image-link">
                            <input class="input-link" type="text" placeholder="連結" style="width:100%;border-top: none;">
                            <button title="Select" class="input-select2" style="flex:none;width:50px;height:50px;"><svg class="is-icon-flex"><use xlink:href="#ion-more"></use></svg></button>
                            <div class="image-larger2" style="position: relative; flex: 0 0 auto; width: 50px; height: 50px; box-shadow: rgba(0, 0, 0, 0.32) 0px 3px 6px -6px; display: none;">
                                <form class="form-upload-larger" target="frameTargetImageUpload" method="post" action="" enctype="multipart/form-data" style="position:absolute;top:0;left:0;width:100%;height:100%;">
				                    <input id="hidRefId2" name="hidRefId" type="hidden" value="">
                                    <svg class="is-icon-flex" style="position: absolute;top: 16px;left: 15px;width: 18px;height: 18px;fill:rgb(53, 53, 53);"><use xlink:href="#ion-image"></use></svg>
                                    <input title="Select" id="fileImage2" name="fileImage" type="file" accept="image/*" style="position:absolute;top:-30px;left:0;width:100%;height:80px;opacity: 0;cursor: pointer;">
                                </form>
                            </div>
                        </div>

                        <label style="display:inline-block;margin-top:14px;margin-bottom:10px;">
                            <input class="input-newwindow" type="checkbox"> 開新視窗&nbsp;
                        </label>
                        <div style="text-align:right">
                            <button title="取消" class="input-cancel classic-secondary">取消</button>
                            <button title="確認" class="input-ok classic-primary">確認</button>
                        </div>
                    </div>
                </div>

                <div class="is-modal imageselect" style="z-index:10005">
                    <div style="max-width:800px;height:80%;padding:0;">
                        <iframe style="width:100%;height:100%;border: none;display: block;" src="about:blank"></iframe>
                    </div>
                </div>

                <div id="divImageResizer" data-x="0" data-y="0" class="is-tool moveable resizable" style="top: -10px; left: -10px; width: 1px; height: 1px; display: none;" data-width="764">
                </div>

            <div id="divSpacerTool" class="is-tool is-spacer-tool">
                <button title="減少" data-value="-"><svg class="is-icon-flex"><use xlink:href="#ion-ios-minus-empty"></use></svg></button>
                <button title="增加" data-value="+" style="border-left: none;"><svg class="is-icon-flex"><use xlink:href="#ion-ios-plus-empty"></use></svg></button>
            </div>

            <div class="is-tool is-module-tool">
                <button title="設定" data-title="設定" style="width:40px;height:40px;background:none;"><svg class="is-icon-flex"><use xlink:href="#ion-ios-gear"></use></svg></button>
            </div>

            <input id="hidContentModuleCode" type="hidden">
            <input id="hidContentModuleSettings" type="hidden">

            <div class="is-modal custommodule">
                <div style="max-width:900px;height:570px;padding:0;box-sizing:border-box;position:relative;">
                    <div class="is-modal-bar is-draggable" style="position: absolute;top: 0;left: 0;width: 100%;z-index:1;" draggable="">Module Settings</div>
                    <iframe style="position: absolute;top: 0;left: 0;width:100%;height:100%;border:none;border-bottom:60px solid transparent;border-top:40px solid transparent;margin:0;box-sizing:border-box;" src="about:blank"></iframe>
                    <div style="width:100%;height:50px;position:absolute;left:0;bottom:0;border-top: #efefef 1px solid;overflow:hidden;text-align:right">
                        <button title="取消" class="input-cancel classic-secondary">取消</button>
                        <button title="確認" class="input-ok classic-primary">確認</button>
                    </div>
                </div>
            </div>

            <div class="is-tool is-code-tool">
                <button title="設定" data-title="設定" style="width:40px;height:40px;background:none;"><svg class="is-icon-flex"><use xlink:href="#ion-ios-gear"></use></svg></button>
            </div>

            <div class="is-modal customcode">
                <div style="max-width:900px;height:570px;padding:0;box-sizing:border-box;position:relative;">
                    <div class="is-modal-bar is-draggable" style="position: absolute;top: 0;left: 0;width: 100%;z-index:1;" draggable="">Custom Code (Javascript Allowed)</div>
                    <textarea class="input-customcode" type="text" style="background: #fff;position: absolute;top: 0;left: 0;width:100%;height:100%;border:none;border-bottom:60px solid transparent;border-top:40px solid transparent;box-sizing:border-box;" data-gramm="false" wt-ignore-input="true"></textarea>
                    <div style="width:100%;height:50px;position:absolute;left:0;bottom:0;border-top: #efefef 1px solid;overflow:hidden;text-align:right">
                        <button title="取消" class="input-cancel classic-secondary">取消</button>
                        <button title="確認" class="input-ok classic-primary">確認</button>
                    </div>
                </div>
            </div>

            <div class="is-tool is-iframe-tool">
                <button title="設定" data-title="設定" style="width:40px;height:40px;background:none;"><svg class="is-icon-flex"><use xlink:href="#ion-ios-gear"></use></svg></button>
            </div>

            <div class="is-modal iframelink">
                <div style="max-width:550px;">
                    <input class="input-src" type="text" placeholder="Source" style="width:100%;margin-bottom:12px;">
                    <textarea class="input-embedcode" type="text" placeholder="Embed Code" style="width:100%;height:300px;margin-bottom:12px;display:none;" data-gramm="false" wt-ignore-input="true"></textarea>
                    <div style="text-align:right">
                        <button title="取消" class="input-cancel classic-secondary">取消</button>
                        <button title="確認" class="input-ok classic-primary">確認</button>
                    </div>
                </div>
            </div>


            <div class="is-tool is-table-tool">
                <button title="設定" style="width:40px;height:40px;background:none;"><svg class="is-icon-flex"><use xlink:href="#ion-ios-gear"></use></svg></button>
            </div>
            <div class="is-modal edittable" style="z-index:10002;">
                <div class="is-modal-bar is-draggable" style="position: absolute;top: 0;left: 0;width: 100%;z-index:1;line-height:30px;height:30px;border:none;" draggable="">
                    表格
                    <div class="is-modal-close" style="z-index:1;width:20px;height:20px;position:absolute;top:0px;right:0px;box-sizing:border-box;padding:0;line-height:20px;font-size:10px;color:#777;text-align:center;cursor:pointer;">✕</div>
                </div>
                <div style="padding:0">
                    <div class="is-tabs clearfix" data-group="table">
                        <a title="Style" id="tabTableGeneral" href="" data-content="divTableGeneral" class="active">Style</a>
                        <a title="Layout" id="tabTableLayout" href="" data-content="divTableLayout">Layout</a>
                    </div>
                    <div id="divTableGeneral" class="is-tab-content" data-group="table" style="display:block">

                        <div style="display:flex;padding-bottom:12px">
                            <div style="padding-right:15px">
                                <div>Background:</div>
                                <div>
                                    <button title="背景色" class="input-table-bgcolor is-btn-color"></button>
                                </div>
                            </div>
                            <div>
                                <div>文字顏色:</div>
                                <div>
                                    <button title="文字顏色" class="input-table-textcolor is-btn-color"></button>
                                </div>
                            </div>
                        </div>

                        <div style="padding-bottom:12px;">
                            <div>Border Thickness:</div>
                            <div>
                                <select id="selCellBorderWidth" style="width:120px;"><option value="0">No Border</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select>
                            </div>
                        </div>

                        <div style="padding-bottom:12px;">
                            <div>Border Color:</div>
                            <div>
                                <button title="Border Color" class="input-table-bordercolor is-btn-color"></button>
                            </div>
                        </div>

                        <div style="padding-bottom:12px;">
                            <div>Apply To:</div>
                            <div>
                                <select id="selTableApplyTo" style="width:120px;">
                                    <option value="table">表格</option>
                                    <option value="currentrow">Current Row</option>
                                    <option value="currentcol">Current Column</option>
                                    <option value="evenrows">Even Rows</option>
                                    <option value="oddrows">Odd Rows</option>
                                    <option value="currentcell">Current Cell</option>
                                </select>
                            </div>
                        </div>

                    </div>

                    <div id="divTableLayout" class="is-tab-content" data-group="table">

                        <div style="padding-bottom:12px;">
                            <div>Insert Row:</div>
                            <div style="display:flex">
                                <button title="Above" data-table-cmd="rowabove" style="width:90px;margin-right:5px"> Above </button>
                                <button title="Below" data-table-cmd="rowbelow" style="width:90px;"> Below </button>
                            </div>
                        </div>

                        <div style="padding-bottom:12px;">
                            <div>Insert Column:</div>
                            <div style="display:flex">
                                <button title="左側" data-table-cmd="columnleft" style="width:90px;margin-right:5px"> 左側 </button>
                                <button title="右側" data-table-cmd="columnright" style="width:90px;"> 右側 </button>
                            </div>
                        </div>

                        <div style="padding-bottom:12px;">
                            <button title="Delete Row" data-table-cmd="delrow" style="width:205px;margin-right:5px"> Delete Row </button>
                        </div>

                        <div style="padding-bottom:12px;">
                            <button title="Delete Column" data-table-cmd="delcolumn" style="width:205px;"> Delete Column </button>
                        </div>

                        <div style="padding-bottom:12px;">
                            <button title="Merge Cell" data-table-cmd="mergecell" style="width:205px">Merge Cell</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="is-rte-tool" style="position: fixed; flex-direction: column; display: flex; top: 176px;">
                <div style="display:flex">
                    <button title="粗體" class="rte-format" data-command="bold" data-title="粗體"><span style="font-family:serif;font-size:14px;">B</span></button><button title="斜體" class="rte-format" data-command="italic" data-title="斜體"><span style="font-family:serif;font-size:14px;font-style:italic;">i</span></button><button title="底線" class="rte-format" data-command="underline" data-title="底線"><span style="font-family:serif;font-size:14px;text-decoration:underline;">U</span></button><button title="字型" class="rte-formatting" data-title="字型"><span style="font-family:serif;font-size:15px;display:inline-block;">A</span></button><button title="顏色" class="rte-color" data-title="顏色"><svg class="is-icon-flex" style="width:12px;height:12px;"><use xlink:href="#ion-contrast"></use></svg></button><button title="對齊" class="rte-align" data-title="對齊"><svg class="is-icon-flex" style="width:12px;height:12px;margin-top:-2px;"><use xlink:href="#icon-align-full"></use></svg></button><button title="字型設定" class="rte-textsettings" data-title="字型設定"><svg class="is-icon-flex" style="width:16px;height:16px;"><use xlink:href="#ion-ios-settings"></use></svg></button><button title="連結" class="rte-link" data-title="連結"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#ion-link"></use></svg></button><button title="更多選項" class="rte-more" data-title="更多選項"><svg class="is-icon-flex" style="width:13px;height:13px;"><use xlink:href="#ion-more"></use></svg></button><div class="rte-separator"></div><button title="復原" class="rte-undo" data-title="復原"><svg class="is-icon-flex" style="margin-top:2px;width:15px;height:15px;"><use xlink:href="#ion-ios-undo"></use></svg></button><button title="取消復原" class="rte-redo" data-title="取消復原"><svg class="is-icon-flex" style="margin-top:2px;width:15px;height:15px;"><use xlink:href="#ion-ios-redo"></use></svg></button>
                </div>
            </div>

            <div class="is-elementrte-tool" style="position: fixed; flex-direction: column; display: none; top: 407.5px;">
                <div style="display:flex">
                    <button title="靠左對齊" data-align="left" data-title="靠左對齊"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#icon-align-left"></use></svg></button><button title="置中" data-align="center" data-title="置中"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#icon-align-center"></use></svg></button><button title="靠右對齊" data-align="right" data-title="靠右對齊"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#icon-align-right"></use></svg></button><button title="左右對齊" data-align="justify" data-title="左右對齊"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#icon-align-full"></use></svg></button><button title="更多選項" class="rte-more" data-title="更多選項"><svg class="is-icon-flex" style="width:13px;height:13px;"><use xlink:href="#ion-more"></use></svg></button><div class="rte-separator"></div><button title="復原" class="rte-undo" data-title="復原"><svg class="is-icon-flex" style="margin-top:2px;width:15px;height:15px;"><use xlink:href="#ion-ios-undo"></use></svg></button><button title="取消復原" class="rte-redo" data-title="取消復原"><svg class="is-icon-flex" style="margin-top:2px;width:15px;height:15px;"><use xlink:href="#ion-ios-redo"></use></svg></button>
                </div>
            </div>

            <div class="rte-formatting-options is-rte-pop">
                <div>
                    <button title="刪除線" class="rte-format" data-command="strikethrough" style="float:left" data-title="刪除線"><svg class="is-icon-flex" style="width:17px;height:17px;"><use xlink:href="#icon-strike"></use></svg></button>
                    <button title="上標" class="rte-format" data-command="superscript" style="float:left" data-title="上標"><span style="font-family:serif;font-size:13px;">x</span><sup style="font-size:10px">2</sup></button>
                    <button title="下標" class="rte-format" data-command="subscript" style="float:left" data-title="下標"><span style="font-family:serif;font-size:13px;">x</span><sub style="font-size:10px">2</sub></button>
                    <button title="大小寫轉換" class="rte-format" data-command="uppercase" style="float:left" data-title="大小寫轉換"><span style="font-family:serif;font-size:14px;display:inline-block;text-transform: none;">Aa</span></button>
                    <button title="簡易版" class="rte-format" data-command="clean" data-title="簡易版"><svg class="is-icon-flex" style="width:11px;height:11px;"><use xlink:href="#icon-clean"></use></svg></button>
                </div>
            </div>

            <div class="rte-align-options is-rte-pop">
                <div>
                    <button title="靠左對齊" data-align="left" data-title="靠左對齊"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#icon-align-left"></use></svg></button>
                    <button title="置中" data-align="center" data-title="置中" class="on"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#icon-align-center"></use></svg></button>
                    <button title="靠右對齊" data-align="right" data-title="靠右對齊"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#icon-align-right"></use></svg></button>
                    <button title="左右對齊" data-align="justify" data-title="左右對齊"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#icon-align-full"></use></svg></button>
                </div>
            </div>

            <div class="rte-list-options is-rte-pop">
                <div>
                    <button title="項目符號" data-action="insertUnorderedList" data-title="項目符號"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#icon-list-bullet"></use></svg></button>
                    <button title="編號" data-action="insertOrderedList" data-title="編號"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#icon-list-number"></use></svg></button>
                    <button title="增加縮排" data-action="indent" data-title="增加縮排"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#icon-indent"></use></svg></button>
                    <button title="減少縮排" data-action="outdent" data-title="減少縮排"><svg class="is-icon-flex" style="width:14px;height:14px;"><use xlink:href="#icon-outdent"></use></svg></button>
                </div>
            </div>

            <div class="rte-paragraph-options is-rte-pop">
                <div>
                    <div title="標題 1" data-block="h1"><h1>Heading 1</h1></div>
                    <div title="標題 2" data-block="h2"><h2>Heading 2</h2></div>
                    <div title="標題 3" data-block="h3" class="on"><h3>Heading 3</h3></div>
                    <div title="標題 4" data-block="h4"><h4>Heading 4</h4></div>
                    <div title="內文" data-block="p"><p>Paragraph</p></div>
                    <div title="程式碼區塊" data-block="pre"><p style="font-family:courier;">Preformatted</p></div>
                </div>
            </div>

            <div class="rte-fontfamily-options is-rte-pop">
                <iframe src="about:blank"></iframe>
            </div>

            <div class="rte-color-picker is-rte-pop" data-command="forecolor" style="">
                <div class="is-pop-tabs">
                    <div class="is-pop-tab-item active" data-value="forecolor">字型色彩</div>
                    <div class="is-pop-tab-item" data-value="backcolor">字型背景色彩</div>
                </div>
                <div class="rte-color-picker-area" style=""><div class="pickcolor" style="width: 269px; padding: 12px; box-sizing: border-box;">
            <div class="color-default clearfix"><button title="#ff8f00" data-color="#ff8f00" style="background:#ff8f00;"></button><button title="#ef6c00" data-color="#ef6c00" style="background:#ef6c00;"></button><button title="#d84315" data-color="#d84315" style="background:#d84315;"></button><button title="#c62828" data-color="#c62828" style="background:#c62828;"></button><button title="#58362f" data-color="#58362f" style="background:#58362f;"></button><button title="#37474f" data-color="#37474f" style="background:#37474f;"></button><button title="#353535" data-color="#353535" style="background:#353535;"></button><button title="#f9a825" data-color="#f9a825" style="background:#f9a825;"></button><button title="#9e9d24" data-color="#9e9d24" style="background:#9e9d24;"></button><button title="#558b2f" data-color="#558b2f" style="background:#558b2f;"></button><button title="#ad1457" data-color="#ad1457" style="background:#ad1457;"></button><button title="#6a1b9a" data-color="#6a1b9a" style="background:#6a1b9a;"></button><button title="#4527a0" data-color="#4527a0" style="background:#4527a0;"></button><button title="#616161" data-color="#616161" style="background:#616161;"></button><button title="#00b8c9" data-color="#00b8c9" style="background:#00b8c9;"></button><button title="#009666" data-color="#009666" style="background:#009666;"></button><button title="#2e7d32" data-color="#2e7d32" style="background:#2e7d32;"></button><button title="#0277bd" data-color="#0277bd" style="background:#0277bd;"></button><button title="#1565c0" data-color="#1565c0" style="background:#1565c0;"></button><button title="#283593" data-color="#283593" style="background:#283593;"></button><button title="#9e9e9e" data-color="#9e9e9e" style="background:#9e9e9e;"></button></div>
            <div class="color-gradient clearfix"><div id="row-0" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#414141" data-color="#414141" style="background: rgb(65, 65, 65);"></div><div title="#666666" data-color="#666666" style="background: rgb(102, 102, 102);"></div><div title="#8a8a8a" data-color="#8a8a8a" style="background: rgb(138, 138, 138);"></div><div title="#aeaeae" data-color="#aeaeae" style="background: rgb(174, 174, 174);"></div><div title="#d3d3d3" data-color="#d3d3d3" style="background: rgb(211, 211, 211);"></div><div title="#f7f7f7" data-color="#f7f7f7" style="background: rgb(247, 247, 247);"></div></div><div id="row-1" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#3a3a3a" data-color="#3a3a3a" style="background: rgb(58, 58, 58);"></div><div title="#5e5e5e" data-color="#5e5e5e" style="background: rgb(94, 94, 94);"></div><div title="#838383" data-color="#838383" style="background: rgb(131, 131, 131);"></div><div title="#a7a7a7" data-color="#a7a7a7" style="background: rgb(167, 167, 167);"></div><div title="#cccccc" data-color="#cccccc" style="background: rgb(204, 204, 204);"></div><div title="#f0f0f0" data-color="#f0f0f0" style="background: rgb(240, 240, 240);"></div></div><div id="row-2" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#333333" data-color="#333333" style="background: rgb(51, 51, 51);"></div><div title="#575757" data-color="#575757" style="background: rgb(87, 87, 87);"></div><div title="#7b7b7b" data-color="#7b7b7b" style="background: rgb(123, 123, 123);"></div><div title="#a0a0a0" data-color="#a0a0a0" style="background: rgb(160, 160, 160);"></div><div title="#c4c4c4" data-color="#c4c4c4" style="background: rgb(196, 196, 196);"></div><div title="#e9e9e9" data-color="#e9e9e9" style="background: rgb(233, 233, 233);"></div></div><div id="row-3" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#2b2b2b" data-color="#2b2b2b" style="background: rgb(43, 43, 43);"></div><div title="#505050" data-color="#505050" style="background: rgb(80, 80, 80);"></div><div title="#747474" data-color="#747474" style="background: rgb(116, 116, 116);"></div><div title="#999999" data-color="#999999" style="background: rgb(153, 153, 153);"></div><div title="#bdbdbd" data-color="#bdbdbd" style="background: rgb(189, 189, 189);"></div><div title="#e1e1e1" data-color="#e1e1e1" style="background: rgb(225, 225, 225);"></div></div><div id="row-4" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#242424" data-color="#242424" style="background: rgb(36, 36, 36);"></div><div title="#484848" data-color="#484848" style="background: rgb(72, 72, 72);"></div><div title="#6d6d6d" data-color="#6d6d6d" style="background: rgb(109, 109, 109);"></div><div title="#919191" data-color="#919191" style="background: rgb(145, 145, 145);"></div><div title="#b6b6b6" data-color="#b6b6b6" style="background: rgb(182, 182, 182);"></div><div title="#dadada" data-color="#dadada" style="background: rgb(218, 218, 218);"></div></div></div>

            <div class="div-color-opacity" style="height: 10px; margin: 12px 0px 17px; position: relative;">
                <div style="position:absolute;top:0;left:0;width:100%;height:23px;display:flex;flex-direction:column;flex-flow:wrap">
                    <div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div>
                </div>
                <input class="color-opacity" type="range" min="0" max="1" step="0.01" style="position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0;"><div class=" rangeSlider rangeSlider__horizontal" id="js-rangeSlider-163ada08-d82f-665f-3605-58b0c0d477f1" style=""><div class=" rangeSlider__buffer rangeSlider__buffer__horizontal"></div><div class=" rangeSlider__fill rangeSlider__fill__horizontal" style="width: 232.5px;"></div><div class=" rangeSlider__handle rangeSlider__handle__horizontal" style="transform: translateX(220px);"></div></div>
            </div>
            <div class="clearfix" style="margin:25px 0 3px;">
                <button title="黑色" data-color="#000000" style="background:#111111;color:#f3f3f3;border:transparent 1px solid;width:35px;height:35px;line-height:35px;font-size:10px;border-right:none;">黑色</button>
                <button title="白色" data-color="#ffffff" style="background:#ffffff;width:35px;height:35px;line-height:35px;font-size:10px;">白色</button>
                <button title="清除格式設定" data-color="" class="clear" style="width:140px;height:35px;line-height:35px;border-right:none;">清除格式設定</button>
                <button title="更多選項" class="input-hsl" style="background:#ffffff;width:35px;height:35px;line-height:35px;font-size:10px;"><svg class="is-icon-flex" style="fill: rgba(0, 0, 0, 0.45);width:13px;height:13px;"><use xlink:href="#ion-more"></use></svg></button>
            </div>
            <div style="display:flex">
                <div style="border: rgba(231, 231, 231, 0.87) 1px solid;flex-grow: 0;flex-shrink: 0;flex-basis: 37px;height:35px;box-sizing:border-box;margin-top:8px;position:relative;">
                    <div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;flex-flow:wrap;overflow:hidden;">
                        <div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div>
                    </div>
                    <button class="is-color-preview" style="position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; transition: none 0s ease 0s; background: none;"></button>
                </div>
                <input class="input-text" type="text" style="width:209px;height:35px;margin-top:8px;font-size:13px;">
                <button title="執行" class="input-ok" style="height:35px;margin-top:8px;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);"><use xlink:href="#icon-ok"></use></svg></button>
            </div>
        </div></div>
            </div>

            <div class="rte-textsetting-options is-rte-pop">
                <div>
                    <div class="is-label" style="margin-top:0;border-top:none">字型大小</div>
                    <div class="rte-fontsize-options" style="display: flex;flex-flow: wrap;">
                        <button title="14px" data-value="14">14</button>
                        <button title="16px" data-value="16">16</button>
                        <button title="18px" data-value="18">18</button>
                        <button title="21px" data-value="21">21</button>
                        <button title="24px" data-value="24">24</button>
                        <button title="28px" data-value="28">28</button>
                        <button title="32px" data-value="32">32</button>
                        <!--<button title="35px" data-value="35">35</button>-->
                        <button title="38px" data-value="38">38</button>
                        <!--<button title="42px" data-value="42">42</button>-->
                        <button title="48px" data-value="48">48</button>
                        <!--<button title="54px" data-value="54">54</button>-->
                        <button title="60px" data-value="60">60</button>
                        <!--<button title="68px" data-value="68">68</button>-->
                        <button title="76px" data-value="76">76</button>
                        <!--<button title="84px" data-value="84">84</button>-->
                        <button title="96px" data-value="96">96</button>
                        <button title="減少" data-value="-" style="font-size:13px">-</button>
                        <button title="增加" data-value="+" style="font-size:13px">+</button>
                        <button title="清除格式設定" data-value=""><svg class="is-icon-flex" style="width:18px;height:18px;margin-top: 2px;"><use xlink:href="#ion-ios-close-empty"></use></svg></button>
                    </div>
                    <div class="is-label">行距</div>
                    <div class="rte-lineheight-options" style="display: flex;flex-flow: wrap;">
                        <button title="1" data-value="1">1</button>
                        <button title="1.2" data-value="1.2">1.2</button>
                        <button title="1.4" data-value="1.4">1.4</button>
                        <button title="1.6" data-value="1.6">1.6</button>
                        <button title="1.8" data-value="1.8">1.8</button>
                        <button title="2" data-value="2">2</button>
                        <button title="2.2" data-value="2.2">2.2</button>
                        <button title="減少" data-value="-" style="font-size:13px">-</button>
                        <button title="增加" data-value="+" style="font-size:13px">+</button>
                        <button title="清除格式設定" data-value=""><svg class="is-icon-flex" style="width:18px;height:18px;margin-top: 2px;"><use xlink:href="#ion-ios-close-empty"></use></svg></button>
                    </div>
                    <div class="is-label">間距</div>
                    <div class="rte-letterspacing-options" style="display: flex;flex-flow: wrap;">
                        <button title="1" data-value="1">1</button>
                        <button title="2" data-value="2">2</button>
                        <button title="減少" data-value="-" style="font-size:13px">-</button>
                        <button title="增加" data-value="+" style="font-size:13px">+</button>
                        <button title="清除格式設定" data-value=""><svg class="is-icon-flex" style="width:18px;height:18px;margin-top: 2px;"><use xlink:href="#ion-ios-close-empty"></use></svg></button>
                    </div>
                </div>
            </div>

            <div class="is-modal insertimage">
                <div style="max-width:560px;">
                    <div class="is-browse-area">
                        <div class="is-drop-area">
                            <input id="fileInsertImage" type="file" accept="image/*">
                            <div class="drag-text">
                                <p style="display:flex;justify-content:center;align-items:center;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);width:20px;height:20px;"><use xlink:href="#ion-camera"></use></svg> <span style="margin-left:5px;margin-top:3px;"> 拖曳或選擇圖片 </span></p>
                            </div>
                        </div>
                        <div class="is-preview-area">
                            <div><img id="imgInsertImagePreview" alt=""><i class="ion-ios-close-empty"></i></div>
                        </div>
                    </div>
                    <p>或者輸入圖片連結:</p>
                    <div class="image-src clearfix image-select" style="margin-bottom: 12px;"><input class="input-src" type="text" placeholder="連結"><button title="Select" class="input-select" style="flex:none;width:50px;height:50px;"><svg class="is-icon-flex"><use xlink:href="#ion-more"></use></svg></button></div>
                    <div style="text-align:right">
                        <button title="取消" class="input-cancel classic-secondary">取消</button>
                        <button title="確認" class="input-ok classic-primary">確認</button>
                    </div>
                </div>
            </div>

            <div class="rte-icon-options is-rte-pop">
                <iframe id="ifrIconInsert" src="about:blank"></iframe>
            </div>

            <div class="rte-customtag-options is-rte-pop">
                <div></div>
            </div>

            <div class="rte-more-options is-rte-pop">
                <div><button class="previewcontent-button" title="Preview" style="font-size:15px;vertical-align:bottom;" data-title="Preview"><svg class="is-icon-flex" style="fill:rgba(0,0,0,0.7);width:19px;height:19px;"><use xlink:href="#ion-eye"></use></svg></button><button class="wordcount-button" title="Word Count" style="font-size:15px;vertical-align:bottom;" data-title="Word Count"><svg class="is-icon-flex" style="margin-top:-1px"><use xlink:href="#ion-information"></use></svg></button><button class="insertsymbol-button" title="Symbol" style="font-size:14px;vertical-align:bottom;" data-title="Symbol">Ω</button>
                <button title="圖示" class="rte-icon" data-title="圖示"><svg class="is-icon-flex" style="width:14px;height:14px;margin-top:2px;"><use xlink:href="#ion-android-happy"></use></svg></button><button title="圖片" class="rte-image" data-title="圖片"><svg class="is-icon-flex" style="width:13px;height:13px;"><use xlink:href="#ion-image"></use></svg></button><div class="rte-separator"></div><button title="項目" class="rte-list" data-title="項目"><svg class="is-icon-flex" style="width:12px;height:12px;"><use xlink:href="#icon-list-bullet"></use></svg></button><button title="字型" class="rte-fontfamily" data-title="字型"><span style="font-family:serif;font-size:18px;text-transform:none;display:inline-block;margin-top: -3px;">a</span></button><button title="內文" class="rte-paragraph" data-title="內文"><span style="font-family:serif;font-size:14px;display:inline-block;margin-top:2px;">H</span></button><div class="rte-separator"></div><button title="原始碼" class="rte-html" data-title="原始碼"><svg class="is-icon-flex" style="margin-right:-3px;width:14px;height:14px;"><use xlink:href="#ion-ios-arrow-left"></use></svg><svg class="is-icon-flex" style="margin-left:-2px;fill:rgba(0, 0, 0, 0.65);width:14px;height:14px;"><use xlink:href="#ion-ios-arrow-right"></use></svg></button><button title="工具列設定" class="rte-preferences" data-title="工具列設定"><svg class="is-icon-flex" style="width:13px;height:13px;"><use xlink:href="#ion-wrench"></use></svg></button>
                </div>
            </div>

            <div class="elementrte-more-options is-rte-pop">
                <div><button class="previewcontent-button" title="Preview" style="font-size:15px;vertical-align:bottom;" data-title="Preview"><svg class="is-icon-flex" style="fill:rgba(0,0,0,0.7);width:19px;height:19px;"><use xlink:href="#ion-eye"></use></svg></button><button class="wordcount-button" title="Word Count" style="font-size:15px;vertical-align:bottom;" data-title="Word Count"><svg class="is-icon-flex" style="margin-top:-1px"><use xlink:href="#ion-information"></use></svg></button><button class="insertsymbol-button" title="Symbol" style="font-size:14px;vertical-align:bottom;" data-title="Symbol">Ω</button>
                <div class="rte-separator"></div><button title="原始碼" class="rte-html" data-title="原始碼"><svg class="is-icon-flex" style="margin-right:-3px;width:14px;height:14px;"><use xlink:href="#ion-ios-arrow-left"></use></svg><svg class="is-icon-flex" style="margin-left:-2px;fill:rgba(0, 0, 0, 0.65);width:14px;height:14px;"><use xlink:href="#ion-ios-arrow-right"></use></svg></button><button title="工具列設定" class="rte-preferences" data-title="工具列設定"><svg class="is-icon-flex" style="width:13px;height:13px;"><use xlink:href="#ion-wrench"></use></svg></button>
                </div>
            </div>
            <div id="dPqp9i2" style=""><div class="is-modal pickcolormore" style="background: rgba(255, 255, 255, 0);">
            <div style="max-width: 341px; padding: 0px;">
                <div class="is-modal-bar is-draggable" style="position: absolute;top: 0;left: 0;height:11px;width: 100%;background: transparent;" draggable=""></div>
                <div style="padding: 12px;">

                    <div class="color-swatch clearfix"><div id="row-0" style="width: 100%;"><div title="#0d0c0c" data-color="#0d0c0c" style="background: rgb(13, 12, 12);"></div><div title="#282424" data-color="#282424" style="background: rgb(40, 36, 36);"></div><div title="#423c3c" data-color="#423c3c" style="background: rgb(66, 60, 60);"></div><div title="#5d5454" data-color="#5d5454" style="background: rgb(93, 84, 84);"></div><div title="#786d6d" data-color="#786d6d" style="background: rgb(120, 109, 109);"></div><div title="#857979" data-color="#857979" style="background: rgb(133, 121, 121);"></div><div title="#aaa1a1" data-color="#aaa1a1" style="background: rgb(170, 161, 161);"></div><div title="#c2bcbc" data-color="#c2bcbc" style="background: rgb(194, 188, 188);"></div><div title="#dad6d6" data-color="#dad6d6" style="background: rgb(218, 214, 214);"></div><div title="#f2f1f1" data-color="#f2f1f1" style="background: rgb(242, 241, 241);"></div></div><div id="row-1" style="width: 100%;"><div title="#0e0a0a" data-color="#0e0a0a" style="background: rgb(14, 10, 10);"></div><div title="#2c2020" data-color="#2c2020" style="background: rgb(44, 32, 32);"></div><div title="#4a3535" data-color="#4a3535" style="background: rgb(74, 53, 53);"></div><div title="#674a4a" data-color="#674a4a" style="background: rgb(103, 74, 74);"></div><div title="#856060" data-color="#856060" style="background: rgb(133, 96, 96);"></div><div title="#946a6a" data-color="#946a6a" style="background: rgb(148, 106, 106);"></div><div title="#b49797" data-color="#b49797" style="background: rgb(180, 151, 151);"></div><div title="#c9b4b4" data-color="#c9b4b4" style="background: rgb(201, 180, 180);"></div><div title="#ded2d2" data-color="#ded2d2" style="background: rgb(222, 210, 210);"></div><div title="#f4f0f0" data-color="#f4f0f0" style="background: rgb(244, 240, 240);"></div></div><div id="row-2" style="width: 100%;"><div title="#100909" data-color="#100909" style="background: rgb(16, 9, 9);"></div><div title="#301b1b" data-color="#301b1b" style="background: rgb(48, 27, 27);"></div><div title="#512e2e" data-color="#512e2e" style="background: rgb(81, 46, 46);"></div><div title="#714040" data-color="#714040" style="background: rgb(113, 64, 64);"></div><div title="#915353" data-color="#915353" style="background: rgb(145, 83, 83);"></div><div title="#a25c5c" data-color="#a25c5c" style="background: rgb(162, 92, 92);"></div><div title="#be8d8d" data-color="#be8d8d" style="background: rgb(190, 141, 141);"></div><div title="#d0adad" data-color="#d0adad" style="background: rgb(208, 173, 173);"></div><div title="#e3cece" data-color="#e3cece" style="background: rgb(227, 206, 206);"></div><div title="#f5eeee" data-color="#f5eeee" style="background: rgb(245, 238, 238);"></div></div><div id="row-3" style="width: 100%;"><div title="#110707" data-color="#110707" style="background: rgb(17, 7, 7);"></div><div title="#341717" data-color="#341717" style="background: rgb(52, 23, 23);"></div><div title="#582727" data-color="#582727" style="background: rgb(88, 39, 39);"></div><div title="#7b3737" data-color="#7b3737" style="background: rgb(123, 55, 55);"></div><div title="#9e4646" data-color="#9e4646" style="background: rgb(158, 70, 70);"></div><div title="#b04e4e" data-color="#b04e4e" style="background: rgb(176, 78, 78);"></div><div title="#c78383" data-color="#c78383" style="background: rgb(199, 131, 131);"></div><div title="#d7a6a6" data-color="#d7a6a6" style="background: rgb(215, 166, 166);"></div><div title="#e7caca" data-color="#e7caca" style="background: rgb(231, 202, 202);"></div><div title="#f7eded" data-color="#f7eded" style="background: rgb(247, 237, 237);"></div></div><div id="row-4" style="width: 100%;"><div title="#130606" data-color="#130606" style="background: rgb(19, 6, 6);"></div><div title="#391313" data-color="#391313" style="background: rgb(57, 19, 19);"></div><div title="#5f2020" data-color="#5f2020" style="background: rgb(95, 32, 32);"></div><div title="#852d2d" data-color="#852d2d" style="background: rgb(133, 45, 45);"></div><div title="#ab3a3a" data-color="#ab3a3a" style="background: rgb(171, 58, 58);"></div><div title="#be4040" data-color="#be4040" style="background: rgb(190, 64, 64);"></div><div title="#d17979" data-color="#d17979" style="background: rgb(209, 121, 121);"></div><div title="#de9f9f" data-color="#de9f9f" style="background: rgb(222, 159, 159);"></div><div title="#ebc5c5" data-color="#ebc5c5" style="background: rgb(235, 197, 197);"></div><div title="#f8ebeb" data-color="#f8ebeb" style="background: rgb(248, 235, 235);"></div></div><div id="row-5" style="width: 100%;"><div title="#140505" data-color="#140505" style="background: rgb(20, 5, 5);"></div><div title="#3d0f0f" data-color="#3d0f0f" style="background: rgb(61, 15, 15);"></div><div title="#661919" data-color="#661919" style="background: rgb(102, 25, 25);"></div><div title="#8f2323" data-color="#8f2323" style="background: rgb(143, 35, 35);"></div><div title="#b82d2d" data-color="#b82d2d" style="background: rgb(184, 45, 45);"></div><div title="#cc3232" data-color="#cc3232" style="background: rgb(204, 50, 50);"></div><div title="#db6f6f" data-color="#db6f6f" style="background: rgb(219, 111, 111);"></div><div title="#e59898" data-color="#e59898" style="background: rgb(229, 152, 152);"></div><div title="#efc1c1" data-color="#efc1c1" style="background: rgb(239, 193, 193);"></div><div title="#f9eaea" data-color="#f9eaea" style="background: rgb(249, 234, 234);"></div></div><div id="row-6" style="width: 100%;"><div title="#150303" data-color="#150303" style="background: rgb(21, 3, 3);"></div><div title="#410a0a" data-color="#410a0a" style="background: rgb(65, 10, 10);"></div><div title="#6d1212" data-color="#6d1212" style="background: rgb(109, 18, 18);"></div><div title="#991919" data-color="#991919" style="background: rgb(153, 25, 25);"></div><div title="#c42020" data-color="#c42020" style="background: rgb(196, 32, 32);"></div><div title="#da2424" data-color="#da2424" style="background: rgb(218, 36, 36);"></div><div title="#e56565" data-color="#e56565" style="background: rgb(229, 101, 101);"></div><div title="#ec9191" data-color="#ec9191" style="background: rgb(236, 145, 145);"></div><div title="#f4bdbd" data-color="#f4bdbd" style="background: rgb(244, 189, 189);"></div><div title="#fbe9e9" data-color="#fbe9e9" style="background: rgb(251, 233, 233);"></div></div><div id="row-7" style="width: 100%;"><div title="#170202" data-color="#170202" style="background: rgb(23, 2, 2);"></div><div title="#450606" data-color="#450606" style="background: rgb(69, 6, 6);"></div><div title="#740a0a" data-color="#740a0a" style="background: rgb(116, 10, 10);"></div><div title="#a30f0f" data-color="#a30f0f" style="background: rgb(163, 15, 15);"></div><div title="#d11313" data-color="#d11313" style="background: rgb(209, 19, 19);"></div><div title="#e91515" data-color="#e91515" style="background: rgb(233, 21, 21);"></div><div title="#ef5b5b" data-color="#ef5b5b" style="background: rgb(239, 91, 91);"></div><div title="#f48a8a" data-color="#f48a8a" style="background: rgb(244, 138, 138);"></div><div title="#f8b9b9" data-color="#f8b9b9" style="background: rgb(248, 185, 185);"></div><div title="#fce7e7" data-color="#fce7e7" style="background: rgb(252, 231, 231);"></div></div><div id="row-8" style="width: 100%;"><div title="#180000" data-color="#180000" style="background: rgb(24, 0, 0);"></div><div title="#4a0202" data-color="#4a0202" style="background: rgb(74, 2, 2);"></div><div title="#7b0303" data-color="#7b0303" style="background: rgb(123, 3, 3);"></div><div title="#ad0505" data-color="#ad0505" style="background: rgb(173, 5, 5);"></div><div title="#de0707" data-color="#de0707" style="background: rgb(222, 7, 7);"></div><div title="#f70707" data-color="#f70707" style="background: rgb(247, 7, 7);"></div><div title="#f95151" data-color="#f95151" style="background: rgb(249, 81, 81);"></div><div title="#fb8383" data-color="#fb8383" style="background: rgb(251, 131, 131);"></div><div title="#fcb4b4" data-color="#fcb4b4" style="background: rgb(252, 180, 180);"></div><div title="#fee6e6" data-color="#fee6e6" style="background: rgb(254, 230, 230);"></div></div><div id="row-9" style="width: 100%;"><div title="#190000" data-color="#190000" style="background: rgb(25, 0, 0);"></div><div title="#4c0000" data-color="#4c0000" style="background: rgb(76, 0, 0);"></div><div title="#7f0000" data-color="#7f0000" style="background: rgb(127, 0, 0);"></div><div title="#b20000" data-color="#b20000" style="background: rgb(178, 0, 0);"></div><div title="#e50000" data-color="#e50000" style="background: rgb(229, 0, 0);"></div><div title="#ff0000" data-color="#ff0000" style="background: rgb(255, 0, 0);"></div><div title="#fe4c4c" data-color="#fe4c4c" style="background: rgb(254, 76, 76);"></div><div title="#ff7f7f" data-color="#ff7f7f" style="background: rgb(255, 127, 127);"></div><div title="#ffb2b2" data-color="#ffb2b2" style="background: rgb(255, 178, 178);"></div><div title="#ffe5e5" data-color="#ffe5e5" style="background: rgb(255, 229, 229);"></div></div></div>

                    <div class="div-color-hue" style="height: 23px; margin: 10px 0px 0px;">
                        <input class="color-hue" type="range" min="0" max="360" step="1" style="position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0;"><div class=" rangeSlider rangeSlider__horizontal" id="js-rangeSlider-5b9e9e68-12cb-1434-5752-197e8e98fa9f" style=""><div class=" rangeSlider__buffer rangeSlider__buffer__horizontal"></div><div class=" rangeSlider__fill rangeSlider__fill__horizontal" style="width: 12.5px;"></div><div class=" rangeSlider__handle rangeSlider__handle__horizontal" style="transform: translateX(0px);"></div><div style="display: flex; position: absolute; top: 0px; left: 0px;"><div style="background-color: rgb(230, 0, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 4, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 8, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 11, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 15, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 19, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 23, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 27, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 31, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 34, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 38, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 42, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 46, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 50, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 54, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 57, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 61, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 65, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 69, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 73, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 77, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 80, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 84, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 88, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 92, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 96, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 99, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 103, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 107, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 111, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 115, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 119, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 122, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 126, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 130, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 134, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 138, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 142, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 145, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 149, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 153, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 157, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 161, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 164, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 168, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 172, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 176, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 180, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 184, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 187, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 191, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 195, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 199, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 203, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 207, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 210, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 214, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 218, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 222, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 226, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(226, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(222, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(218, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(214, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(210, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(207, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(203, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(199, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(195, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(191, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(187, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(184, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(180, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(176, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(172, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(168, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(164, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(161, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(157, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(153, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(149, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(145, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(142, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(138, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(134, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(130, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(126, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(122, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(119, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(115, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(111, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(107, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(103, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(99, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(96, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(92, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(88, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(84, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(80, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(76, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(73, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(69, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(65, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(61, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(57, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(54, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(50, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(46, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(42, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(38, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(34, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(31, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(27, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(23, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(19, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(15, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(11, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(8, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(4, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 4); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 8); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 11); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 15); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 19); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 23); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 27); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 31); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 34); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 38); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 42); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 46); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 50); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 54); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 57); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 61); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 65); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 69); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 73); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 77); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 80); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 84); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 88); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 92); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 96); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 99); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 103); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 107); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 111); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 115); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 119); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 122); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 126); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 130); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 134); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 138); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 142); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 145); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 149); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 153); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 157); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 161); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 164); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 168); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 172); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 176); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 180); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 184); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 187); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 191); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 195); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 199); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 203); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 207); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 210); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 214); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 218); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 222); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 226); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 226, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 222, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 218, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 214, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 210, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 207, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 203, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 199, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 195, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 191, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 187, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 184, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 180, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 176, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 172, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 168, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 164, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 161, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 157, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 153, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 149, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 145, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 142, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 138, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 134, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 130, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 126, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 122, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 119, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 115, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 111, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 107, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 103, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 99, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 96, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 92, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 88, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 84, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 80, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 77, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 73, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 69, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 65, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 61, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 57, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 54, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 50, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 46, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 42, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 38, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 34, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 31, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 27, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 23, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 19, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 15, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 11, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 8, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 4, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(4, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(8, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(11, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(15, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(19, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(23, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(27, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(31, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(34, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(38, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(42, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(46, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(50, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(54, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(57, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(61, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(65, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(69, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(73, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(76, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(80, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(84, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(88, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(92, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(96, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(99, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(103, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(107, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(111, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(115, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(119, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(122, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(126, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(130, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(134, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(138, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(142, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(145, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(149, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(153, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(157, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(161, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(164, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(168, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(172, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(176, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(180, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(184, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(187, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(191, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(195, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(199, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(203, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(207, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(210, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(214, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(218, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(222, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(226, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 226); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 222); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 218); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 214); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 210); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 207); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 203); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 199); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 195); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 191); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 187); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 184); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 180); width: 1px; height: 23px;"></div></div></div>
                    </div>

                </div>
            </div>
        </div></div><div id="fIX6nm3"></div><div class="is-tooltip"></div><div class="is-pop rowmore" style="z-index:10002;">
                <div style="display:flex;flex-flow:wrap;padding-top:3px;">
                    <button type="button" title="往上移" class="row-up"><span><svg class="is-icon-flex" style="width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-up"></use></svg></span>往上移</button>
                    <button type="button" title="往下移" class="row-down"><span><svg class="is-icon-flex" style="width:15px;height:15px;"><use xlink:href="#ion-ios-arrow-thin-down"></use></svg></span>往下移</button>
                    <button type="button" title="複製" class="row-duplicate"><span><svg class="is-icon-flex" style="width:12px;height:12px;"><use xlink:href="#ion-ios-photos-outline"></use></svg></span>複製</button>
                    <button type="button" title="原始碼" class="row-html">
                <span><svg class="is-icon-flex" style="margin-right:-3px;width:12px;height:12px;"><use xlink:href="#ion-ios-arrow-left"></use></svg><svg class="is-icon-flex" style="margin-left:-2px;fill:rgba(0, 0, 0, 0.65);width:12px;height:12px;"><use xlink:href="#ion-ios-arrow-right"></use></svg></span>原始碼
            </button>
                </div>
            </div><div id="Gf0o71R" style=""><div class="is-modal pickcolor" style="background: rgba(255, 255, 255, 0);">
            <div style="max-width: 271px; padding: 0px;">
                <div class="is-modal-bar is-draggable" style="position: absolute;top: 0;left: 0;height:11px;width: 100%;background: transparent;" draggable=""></div>
                <div style="padding: 12px;">

                    <div class="color-default clearfix"><button title="#ff8f00" data-color="#ff8f00" style="background:#ff8f00;"></button><button title="#ef6c00" data-color="#ef6c00" style="background:#ef6c00;"></button><button title="#d84315" data-color="#d84315" style="background:#d84315;"></button><button title="#c62828" data-color="#c62828" style="background:#c62828;"></button><button title="#58362f" data-color="#58362f" style="background:#58362f;"></button><button title="#37474f" data-color="#37474f" style="background:#37474f;"></button><button title="#353535" data-color="#353535" style="background:#353535;"></button><button title="#f9a825" data-color="#f9a825" style="background:#f9a825;"></button><button title="#9e9d24" data-color="#9e9d24" style="background:#9e9d24;"></button><button title="#558b2f" data-color="#558b2f" style="background:#558b2f;"></button><button title="#ad1457" data-color="#ad1457" style="background:#ad1457;"></button><button title="#6a1b9a" data-color="#6a1b9a" style="background:#6a1b9a;"></button><button title="#4527a0" data-color="#4527a0" style="background:#4527a0;"></button><button title="#616161" data-color="#616161" style="background:#616161;"></button><button title="#00b8c9" data-color="#00b8c9" style="background:#00b8c9;"></button><button title="#009666" data-color="#009666" style="background:#009666;"></button><button title="#2e7d32" data-color="#2e7d32" style="background:#2e7d32;"></button><button title="#0277bd" data-color="#0277bd" style="background:#0277bd;"></button><button title="#1565c0" data-color="#1565c0" style="background:#1565c0;"></button><button title="#283593" data-color="#283593" style="background:#283593;"></button><button title="#9e9e9e" data-color="#9e9e9e" style="background:#9e9e9e;"></button></div>
                    <div class="color-gradient clearfix"><div id="row-0" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#414141" data-color="#414141" style="background: rgb(65, 65, 65);"></div><div title="#666666" data-color="#666666" style="background: rgb(102, 102, 102);"></div><div title="#8a8a8a" data-color="#8a8a8a" style="background: rgb(138, 138, 138);"></div><div title="#aeaeae" data-color="#aeaeae" style="background: rgb(174, 174, 174);"></div><div title="#d3d3d3" data-color="#d3d3d3" style="background: rgb(211, 211, 211);"></div><div title="#f7f7f7" data-color="#f7f7f7" style="background: rgb(247, 247, 247);"></div></div><div id="row-1" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#3a3a3a" data-color="#3a3a3a" style="background: rgb(58, 58, 58);"></div><div title="#5e5e5e" data-color="#5e5e5e" style="background: rgb(94, 94, 94);"></div><div title="#838383" data-color="#838383" style="background: rgb(131, 131, 131);"></div><div title="#a7a7a7" data-color="#a7a7a7" style="background: rgb(167, 167, 167);"></div><div title="#cccccc" data-color="#cccccc" style="background: rgb(204, 204, 204);"></div><div title="#f0f0f0" data-color="#f0f0f0" style="background: rgb(240, 240, 240);"></div></div><div id="row-2" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#333333" data-color="#333333" style="background: rgb(51, 51, 51);"></div><div title="#575757" data-color="#575757" style="background: rgb(87, 87, 87);"></div><div title="#7b7b7b" data-color="#7b7b7b" style="background: rgb(123, 123, 123);"></div><div title="#a0a0a0" data-color="#a0a0a0" style="background: rgb(160, 160, 160);"></div><div title="#c4c4c4" data-color="#c4c4c4" style="background: rgb(196, 196, 196);"></div><div title="#e9e9e9" data-color="#e9e9e9" style="background: rgb(233, 233, 233);"></div></div><div id="row-3" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#2b2b2b" data-color="#2b2b2b" style="background: rgb(43, 43, 43);"></div><div title="#505050" data-color="#505050" style="background: rgb(80, 80, 80);"></div><div title="#747474" data-color="#747474" style="background: rgb(116, 116, 116);"></div><div title="#999999" data-color="#999999" style="background: rgb(153, 153, 153);"></div><div title="#bdbdbd" data-color="#bdbdbd" style="background: rgb(189, 189, 189);"></div><div title="#e1e1e1" data-color="#e1e1e1" style="background: rgb(225, 225, 225);"></div></div><div id="row-4" style="width: 100%;"><div title="#000000" data-color="#000000" style="background: rgb(0, 0, 0);"></div><div title="#242424" data-color="#242424" style="background: rgb(36, 36, 36);"></div><div title="#484848" data-color="#484848" style="background: rgb(72, 72, 72);"></div><div title="#6d6d6d" data-color="#6d6d6d" style="background: rgb(109, 109, 109);"></div><div title="#919191" data-color="#919191" style="background: rgb(145, 145, 145);"></div><div title="#b6b6b6" data-color="#b6b6b6" style="background: rgb(182, 182, 182);"></div><div title="#dadada" data-color="#dadada" style="background: rgb(218, 218, 218);"></div></div></div>

                    <div class="div-color-opacity" style="height: 10px; margin: 12px 0px 17px; position: relative;">
                        <div style="position:absolute;top:0;left:0;width:100%;height:23px;display:flex;flex-direction:column;flex-flow:wrap">
                            <div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div>
                        </div>
                        <input class="color-opacity" type="range" min="0" max="1" step="0.01" style="position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0;"><div class=" rangeSlider rangeSlider__horizontal" id="js-rangeSlider-88c94ddf-1794-4e5b-3bcb-e856133021b8" style=""><div class=" rangeSlider__buffer rangeSlider__buffer__horizontal"></div><div class=" rangeSlider__fill rangeSlider__fill__horizontal" style="width: 232.5px;"></div><div class=" rangeSlider__handle rangeSlider__handle__horizontal" style="transform: translateX(220px);"></div></div>
                    </div>
                    <div class="clearfix" style="margin:25px 0 3px;">
                        <button title="黑色" data-color="#000000" style="background:#111111;color:#f3f3f3;border:transparent 1px solid;width:35px;height:35px;line-height:35px;font-size:10px;border-right:none;">黑色</button>
                        <button title="白色" data-color="#ffffff" style="background:#ffffff;width:35px;height:35px;line-height:35px;font-size:10px;">白色</button>
                        <button title="清除格式設定" data-color="" class="clear" style="width:140px;height:35px;line-height:35px;border-right:none;">清除格式設定</button>
                        <button title="更多選項" class="input-hsl" style="background:#ffffff;width:35px;height:35px;line-height:35px;font-size:10px;"><svg class="is-icon-flex" style="fill: rgba(0, 0, 0, 0.45);width:13px;height:13px;"><use xlink:href="#ion-more"></use></svg></button>
                    </div>
                    <div style="display:flex">
                        <div style="border: rgba(231, 231, 231, 0.87) 1px solid;flex-grow: 0;flex-shrink: 0;flex-basis: 37px;height:35px;box-sizing:border-box;margin-top:8px;position:relative;">
                            <div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;flex-flow:wrap;overflow:hidden;">
                                <div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div><div style="background:#fff;width:7px;height:7px"></div><div style="background:#eee;width:7px;height:7px"></div>
                            </div>
                            <button class="is-color-preview" style="position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; transition: none 0s ease 0s; background: none;"></button>
                        </div>
                        <input class="input-text" type="text" style="width:209px;height:35px;margin-top:8px;font-size:13px;">
                        <button title="執行" class="input-ok" style="height:35px;margin-top:8px;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.7);"><use xlink:href="#icon-ok"></use></svg></button>
                    </div>

                </div>
            </div>
        </div><div class="is-modal pickcolormore" style="background: rgba(255, 255, 255, 0);">
            <div style="max-width: 341px; padding: 0px;">
                <div class="is-modal-bar is-draggable" style="position: absolute;top: 0;left: 0;height:11px;width: 100%;background: transparent;" draggable=""></div>
                <div style="padding: 12px;">

                    <div class="color-swatch clearfix"><div id="row-0" style="width: 100%;"><div title="#0d0c0c" data-color="#0d0c0c" style="background: rgb(13, 12, 12);"></div><div title="#282424" data-color="#282424" style="background: rgb(40, 36, 36);"></div><div title="#423c3c" data-color="#423c3c" style="background: rgb(66, 60, 60);"></div><div title="#5d5454" data-color="#5d5454" style="background: rgb(93, 84, 84);"></div><div title="#786d6d" data-color="#786d6d" style="background: rgb(120, 109, 109);"></div><div title="#857979" data-color="#857979" style="background: rgb(133, 121, 121);"></div><div title="#aaa1a1" data-color="#aaa1a1" style="background: rgb(170, 161, 161);"></div><div title="#c2bcbc" data-color="#c2bcbc" style="background: rgb(194, 188, 188);"></div><div title="#dad6d6" data-color="#dad6d6" style="background: rgb(218, 214, 214);"></div><div title="#f2f1f1" data-color="#f2f1f1" style="background: rgb(242, 241, 241);"></div></div><div id="row-1" style="width: 100%;"><div title="#0e0a0a" data-color="#0e0a0a" style="background: rgb(14, 10, 10);"></div><div title="#2c2020" data-color="#2c2020" style="background: rgb(44, 32, 32);"></div><div title="#4a3535" data-color="#4a3535" style="background: rgb(74, 53, 53);"></div><div title="#674a4a" data-color="#674a4a" style="background: rgb(103, 74, 74);"></div><div title="#856060" data-color="#856060" style="background: rgb(133, 96, 96);"></div><div title="#946a6a" data-color="#946a6a" style="background: rgb(148, 106, 106);"></div><div title="#b49797" data-color="#b49797" style="background: rgb(180, 151, 151);"></div><div title="#c9b4b4" data-color="#c9b4b4" style="background: rgb(201, 180, 180);"></div><div title="#ded2d2" data-color="#ded2d2" style="background: rgb(222, 210, 210);"></div><div title="#f4f0f0" data-color="#f4f0f0" style="background: rgb(244, 240, 240);"></div></div><div id="row-2" style="width: 100%;"><div title="#100909" data-color="#100909" style="background: rgb(16, 9, 9);"></div><div title="#301b1b" data-color="#301b1b" style="background: rgb(48, 27, 27);"></div><div title="#512e2e" data-color="#512e2e" style="background: rgb(81, 46, 46);"></div><div title="#714040" data-color="#714040" style="background: rgb(113, 64, 64);"></div><div title="#915353" data-color="#915353" style="background: rgb(145, 83, 83);"></div><div title="#a25c5c" data-color="#a25c5c" style="background: rgb(162, 92, 92);"></div><div title="#be8d8d" data-color="#be8d8d" style="background: rgb(190, 141, 141);"></div><div title="#d0adad" data-color="#d0adad" style="background: rgb(208, 173, 173);"></div><div title="#e3cece" data-color="#e3cece" style="background: rgb(227, 206, 206);"></div><div title="#f5eeee" data-color="#f5eeee" style="background: rgb(245, 238, 238);"></div></div><div id="row-3" style="width: 100%;"><div title="#110707" data-color="#110707" style="background: rgb(17, 7, 7);"></div><div title="#341717" data-color="#341717" style="background: rgb(52, 23, 23);"></div><div title="#582727" data-color="#582727" style="background: rgb(88, 39, 39);"></div><div title="#7b3737" data-color="#7b3737" style="background: rgb(123, 55, 55);"></div><div title="#9e4646" data-color="#9e4646" style="background: rgb(158, 70, 70);"></div><div title="#b04e4e" data-color="#b04e4e" style="background: rgb(176, 78, 78);"></div><div title="#c78383" data-color="#c78383" style="background: rgb(199, 131, 131);"></div><div title="#d7a6a6" data-color="#d7a6a6" style="background: rgb(215, 166, 166);"></div><div title="#e7caca" data-color="#e7caca" style="background: rgb(231, 202, 202);"></div><div title="#f7eded" data-color="#f7eded" style="background: rgb(247, 237, 237);"></div></div><div id="row-4" style="width: 100%;"><div title="#130606" data-color="#130606" style="background: rgb(19, 6, 6);"></div><div title="#391313" data-color="#391313" style="background: rgb(57, 19, 19);"></div><div title="#5f2020" data-color="#5f2020" style="background: rgb(95, 32, 32);"></div><div title="#852d2d" data-color="#852d2d" style="background: rgb(133, 45, 45);"></div><div title="#ab3a3a" data-color="#ab3a3a" style="background: rgb(171, 58, 58);"></div><div title="#be4040" data-color="#be4040" style="background: rgb(190, 64, 64);"></div><div title="#d17979" data-color="#d17979" style="background: rgb(209, 121, 121);"></div><div title="#de9f9f" data-color="#de9f9f" style="background: rgb(222, 159, 159);"></div><div title="#ebc5c5" data-color="#ebc5c5" style="background: rgb(235, 197, 197);"></div><div title="#f8ebeb" data-color="#f8ebeb" style="background: rgb(248, 235, 235);"></div></div><div id="row-5" style="width: 100%;"><div title="#140505" data-color="#140505" style="background: rgb(20, 5, 5);"></div><div title="#3d0f0f" data-color="#3d0f0f" style="background: rgb(61, 15, 15);"></div><div title="#661919" data-color="#661919" style="background: rgb(102, 25, 25);"></div><div title="#8f2323" data-color="#8f2323" style="background: rgb(143, 35, 35);"></div><div title="#b82d2d" data-color="#b82d2d" style="background: rgb(184, 45, 45);"></div><div title="#cc3232" data-color="#cc3232" style="background: rgb(204, 50, 50);"></div><div title="#db6f6f" data-color="#db6f6f" style="background: rgb(219, 111, 111);"></div><div title="#e59898" data-color="#e59898" style="background: rgb(229, 152, 152);"></div><div title="#efc1c1" data-color="#efc1c1" style="background: rgb(239, 193, 193);"></div><div title="#f9eaea" data-color="#f9eaea" style="background: rgb(249, 234, 234);"></div></div><div id="row-6" style="width: 100%;"><div title="#150303" data-color="#150303" style="background: rgb(21, 3, 3);"></div><div title="#410a0a" data-color="#410a0a" style="background: rgb(65, 10, 10);"></div><div title="#6d1212" data-color="#6d1212" style="background: rgb(109, 18, 18);"></div><div title="#991919" data-color="#991919" style="background: rgb(153, 25, 25);"></div><div title="#c42020" data-color="#c42020" style="background: rgb(196, 32, 32);"></div><div title="#da2424" data-color="#da2424" style="background: rgb(218, 36, 36);"></div><div title="#e56565" data-color="#e56565" style="background: rgb(229, 101, 101);"></div><div title="#ec9191" data-color="#ec9191" style="background: rgb(236, 145, 145);"></div><div title="#f4bdbd" data-color="#f4bdbd" style="background: rgb(244, 189, 189);"></div><div title="#fbe9e9" data-color="#fbe9e9" style="background: rgb(251, 233, 233);"></div></div><div id="row-7" style="width: 100%;"><div title="#170202" data-color="#170202" style="background: rgb(23, 2, 2);"></div><div title="#450606" data-color="#450606" style="background: rgb(69, 6, 6);"></div><div title="#740a0a" data-color="#740a0a" style="background: rgb(116, 10, 10);"></div><div title="#a30f0f" data-color="#a30f0f" style="background: rgb(163, 15, 15);"></div><div title="#d11313" data-color="#d11313" style="background: rgb(209, 19, 19);"></div><div title="#e91515" data-color="#e91515" style="background: rgb(233, 21, 21);"></div><div title="#ef5b5b" data-color="#ef5b5b" style="background: rgb(239, 91, 91);"></div><div title="#f48a8a" data-color="#f48a8a" style="background: rgb(244, 138, 138);"></div><div title="#f8b9b9" data-color="#f8b9b9" style="background: rgb(248, 185, 185);"></div><div title="#fce7e7" data-color="#fce7e7" style="background: rgb(252, 231, 231);"></div></div><div id="row-8" style="width: 100%;"><div title="#180000" data-color="#180000" style="background: rgb(24, 0, 0);"></div><div title="#4a0202" data-color="#4a0202" style="background: rgb(74, 2, 2);"></div><div title="#7b0303" data-color="#7b0303" style="background: rgb(123, 3, 3);"></div><div title="#ad0505" data-color="#ad0505" style="background: rgb(173, 5, 5);"></div><div title="#de0707" data-color="#de0707" style="background: rgb(222, 7, 7);"></div><div title="#f70707" data-color="#f70707" style="background: rgb(247, 7, 7);"></div><div title="#f95151" data-color="#f95151" style="background: rgb(249, 81, 81);"></div><div title="#fb8383" data-color="#fb8383" style="background: rgb(251, 131, 131);"></div><div title="#fcb4b4" data-color="#fcb4b4" style="background: rgb(252, 180, 180);"></div><div title="#fee6e6" data-color="#fee6e6" style="background: rgb(254, 230, 230);"></div></div><div id="row-9" style="width: 100%;"><div title="#190000" data-color="#190000" style="background: rgb(25, 0, 0);"></div><div title="#4c0000" data-color="#4c0000" style="background: rgb(76, 0, 0);"></div><div title="#7f0000" data-color="#7f0000" style="background: rgb(127, 0, 0);"></div><div title="#b20000" data-color="#b20000" style="background: rgb(178, 0, 0);"></div><div title="#e50000" data-color="#e50000" style="background: rgb(229, 0, 0);"></div><div title="#ff0000" data-color="#ff0000" style="background: rgb(255, 0, 0);"></div><div title="#fe4c4c" data-color="#fe4c4c" style="background: rgb(254, 76, 76);"></div><div title="#ff7f7f" data-color="#ff7f7f" style="background: rgb(255, 127, 127);"></div><div title="#ffb2b2" data-color="#ffb2b2" style="background: rgb(255, 178, 178);"></div><div title="#ffe5e5" data-color="#ffe5e5" style="background: rgb(255, 229, 229);"></div></div></div>

                    <div class="div-color-hue" style="height: 23px; margin: 10px 0px 0px;">
                        <input class="color-hue" type="range" min="0" max="360" step="1" style="position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0;"><div class=" rangeSlider rangeSlider__horizontal" id="js-rangeSlider-7c48ff81-5009-baa4-d479-776a615e7377" style=""><div class=" rangeSlider__buffer rangeSlider__buffer__horizontal"></div><div class=" rangeSlider__fill rangeSlider__fill__horizontal" style="width: 12.5px;"></div><div class=" rangeSlider__handle rangeSlider__handle__horizontal" style="transform: translateX(0px);"></div><div style="display: flex; position: absolute; top: 0px; left: 0px;"><div style="background-color: rgb(230, 0, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 4, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 8, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 11, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 15, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 19, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 23, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 27, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 31, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 34, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 38, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 42, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 46, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 50, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 54, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 57, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 61, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 65, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 69, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 73, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 77, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 80, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 84, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 88, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 92, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 96, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 99, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 103, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 107, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 111, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 115, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 119, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 122, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 126, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 130, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 134, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 138, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 142, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 145, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 149, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 153, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 157, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 161, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 164, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 168, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 172, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 176, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 180, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 184, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 187, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 191, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 195, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 199, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 203, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 207, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 210, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 214, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 218, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 222, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 226, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(226, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(222, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(218, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(214, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(210, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(207, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(203, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(199, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(195, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(191, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(187, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(184, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(180, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(176, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(172, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(168, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(164, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(161, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(157, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(153, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(149, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(145, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(142, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(138, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(134, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(130, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(126, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(122, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(119, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(115, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(111, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(107, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(103, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(99, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(96, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(92, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(88, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(84, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(80, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(76, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(73, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(69, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(65, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(61, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(57, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(54, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(50, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(46, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(42, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(38, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(34, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(31, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(27, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(23, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(19, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(15, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(11, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(8, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(4, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 0); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 4); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 8); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 11); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 15); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 19); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 23); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 27); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 31); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 34); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 38); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 42); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 46); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 50); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 54); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 57); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 61); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 65); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 69); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 73); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 77); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 80); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 84); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 88); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 92); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 96); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 99); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 103); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 107); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 111); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 115); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 119); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 122); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 126); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 130); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 134); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 138); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 142); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 145); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 149); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 153); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 157); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 161); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 164); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 168); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 172); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 176); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 180); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 184); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 187); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 191); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 195); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 199); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 203); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 207); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 210); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 214); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 218); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 222); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 226); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 230, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 226, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 222, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 218, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 214, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 210, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 207, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 203, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 199, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 195, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 191, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 187, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 184, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 180, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 176, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 172, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 168, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 164, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 161, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 157, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 153, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 149, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 145, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 142, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 138, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 134, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 130, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 126, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 122, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 119, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 115, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 111, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 107, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 103, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 99, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 96, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 92, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 88, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 84, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 80, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 77, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 73, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 69, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 65, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 61, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 57, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 54, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 50, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 46, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 42, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 38, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 34, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 31, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 27, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 23, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 19, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 15, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 11, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 8, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 4, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(0, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(4, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(8, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(11, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(15, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(19, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(23, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(27, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(31, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(34, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(38, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(42, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(46, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(50, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(54, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(57, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(61, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(65, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(69, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(73, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(76, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(80, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(84, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(88, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(92, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(96, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(99, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(103, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(107, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(111, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(115, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(119, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(122, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(126, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(130, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(134, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(138, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(142, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(145, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(149, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(153, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(157, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(161, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(164, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(168, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(172, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(176, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(180, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(184, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(187, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(191, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(195, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(199, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(203, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(207, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(210, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(214, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(218, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(222, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(226, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 230); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 226); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 222); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 218); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 214); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 210); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 207); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 203); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 199); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 195); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 191); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 187); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 184); width: 1px; height: 23px;"></div><div style="background-color: rgb(230, 0, 180); width: 1px; height: 23px;"></div></div></div>
                    </div>

                </div>
            </div>
        </div></div><div id="sYz2NaU"></div><div class="is-modal wordcount" style="z-index:10005"><div style="max-width:300px;height:200px;padding:0;"><div class="is-modal-bar is-draggable" style="height:32px;line-height:32px;" draggable="">字數統計<div class="is-modal-close">✕</div></div><div style="padding:19px 20px 0;"><div style="line-height:1"><span id="spanWords" style="font-size:60px;font-weight:700;color:#333"></span> &nbsp;<span style="letter-spacing: 1px;color: #333;font-size:15px;">words</span></div><div style="padding:8px 0 0 5px;letter-spacing: 1px;color: #333;font-size:15px;">Characters: <span id="spanChars"></span><br>Characters (no spaces): <span id="spanCharsNoSpaces"></span></div><div id="tmp_wordcount" style="width:1px;height:1px;visibility:hidden;" "=""></div></div></div></div><svg width="0" height="0" style="display:none;"><defs><symbol viewBox="0 0 512 512" id="ion-information"><path d="M288 448V192h-96v16h32v240h-32v16h128v-16zM255.8 144.5c26.6 0 48.2-21.6 48.2-48.2s-21.6-48.2-48.2-48.2-48.2 21.6-48.2 48.2 21.6 48.2 48.2 48.2z"></path></symbol></defs></svg><div class="is-modal is-side viewsymbols" style="width:280px;z-index:10004;"><button title="Close" class="is-side-close" style="z-index:1;width:25px;height:25px;position:absolute;top:10px;right:13px;box-sizing:border-box;padding:0;line-height:25px;font-size: 12px;text-align:center;cursor:pointer;background:transparent"><svg class="is-icon-flex" style="width:25px;height:25px;"><use xlink:href="#ion-ios-close-empty"></use></svg></button><iframe src="about:blank" style="width:100%;height:100%;position:absolute;top:0;left:0;border: none;"></iframe></div><div class="is-modal previewcontent" style="z-index:10004"><div style="width:100%;height:100%;background:#fff;position: relative;display: flex;flex-direction: column;align-items: center;padding: 0px;background:#f8f8f8;"><div class="is-modal-bar" style="position: absolute;top: 0;left: 0;width: 100%;z-index:1;line-height:1.5;height:32px;padding:0;"><div style="width:100%;height:100%;display:flex;justify-content:center;"><div class="size-control" data-width="1440" style="width:1440px;"><div class="size-control" data-width="1024" style="width:1024px;"><div class="size-control" data-width="768" style="width:768px;"><div class="size-control" data-width="425" style="width:425px;"><div class="size-control" data-width="375" style="width:375px;"><div class="size-control" data-width="320" style="width:320px;"><div class="size-control-info" style="line-height:32px;">1440px</div></div></div></div></div></div></div></div><div class="is-modal-close" style="z-index:1;width:30px;height:30px;position:absolute;top:0px;right:0px;box-sizing:border-box;padding:0;line-height:30px;font-size: 12px;color:#777;text-align:center;cursor:pointer;"><svg class="is-icon-flex" style="fill:rgba(0, 0, 0, 0.47);width:30px;height:30px;"><use xlink:href="#ion-ios-close-empty"></use></svg></div></div><iframe data-width="1440" style="width:100%;height:100%;max-width:1440px;border:none;border-top:32px solid transparent;margin:0;box-sizing:border-box;background:#fff;" src="about:blank"></iframe></div></div><svg width="0" height="0" style="position:absolute;display:none;"><defs><symbol viewBox="0 0 512 512" id="ion-ios-close-empty"><path d="M340.2 160l-84.4 84.3-84-83.9-11.8 11.8 84 83.8-84 83.9 11.8 11.7 84-83.8 84.4 84.2 11.8-11.7-84.4-84.3 84.4-84.2z"></path></symbol><symbol viewBox="0 0 512 512" id="ion-ios-search-strong"><path d="M344.5 298c15-23.6 23.8-51.6 23.8-81.7 0-84.1-68.1-152.3-152.1-152.3C132.1 64 64 132.2 64 216.3c0 84.1 68.1 152.3 152.1 152.3 30.5 0 58.9-9 82.7-24.4l6.9-4.8L414.3 448l33.7-34.3-108.5-108.6 5-7.1zm-43.1-166.8c22.7 22.7 35.2 52.9 35.2 85s-12.5 62.3-35.2 85c-22.7 22.7-52.9 35.2-85 35.2s-62.3-12.5-85-35.2c-22.7-22.7-35.2-52.9-35.2-85s12.5-62.3 35.2-85c22.7-22.7 52.9-35.2 85-35.2s62.3 12.5 85 35.2z"></path></symbol></defs></svg><div class="is-modal buttoneditor"><div style="width:505px;height:620px;background:#fff;position: relative;display: flex;flex-direction: column;align-items: center;padding: 0px;background:#f8f8f8;"><div class="is-modal-bar is-draggable" style="position: absolute;top: 0;left: 0;width: 100%;z-index:1;line-height:32px;height:32px;background:#f9f9f9;" draggable="">Button Editor<div class="is-modal-close" style="z-index:1;width:32px;height:32px;position:absolute;top:0px;right:0px;box-sizing:border-box;padding:0;line-height:32px;font-size: 12px;color:#777;text-align:center;cursor:pointer;">✕</div></div><iframe data-width="1440" style="width:100%;height:100%;max-width:1440px;border:none;border-top:32px solid transparent;margin:0;box-sizing:border-box;background:#fff;" src="about:blank"></iframe></div></div>










            </div><div data-styled-id="rCSwtyrwf" data-able-resizable="true" data-able-padding="true" data-able-origin="true" class="moveable-control-box moveable-reverse   rCSwtyrwf" style="position: absolute; display: none; transform: translate3d(0px, 0px, 0px); --zoom:1; --zoompx:1px;"><div data-rotation="0" data-direction="n" class="moveable-control moveable-direction moveable-n" style="transform: translateZ(0px) translate(0px, 0px) rotate(0rad) scale(1);"></div><div data-rotation="90" data-direction="w" class="moveable-control moveable-direction moveable-w" style="transform: translateZ(0px) translate(0px, 0px) rotate(0rad) scale(1);"></div><div data-rotation="0" data-direction="s" class="moveable-control moveable-direction moveable-s" style="transform: translateZ(0px) translate(0px, 0px) rotate(0rad) scale(1);"></div><div data-rotation="90" data-direction="e" class="moveable-control moveable-direction moveable-e" style="transform: translateZ(0px) translate(0px, 0px) rotate(0rad) scale(1);"></div><div data-rotation="45" data-direction="nw" class="moveable-control moveable-direction moveable-nw" style="transform: translateZ(0px) translate(0px, 0px) rotate(0rad) scale(1);"></div><div data-rotation="135" data-direction="ne" class="moveable-control moveable-direction moveable-ne" style="transform: translateZ(0px) translate(0px, 0px) rotate(0rad) scale(1);"></div><div data-rotation="135" data-direction="sw" class="moveable-control moveable-direction moveable-sw" style="transform: translateZ(0px) translate(0px, 0px) rotate(0rad) scale(1);"></div><div data-rotation="45" data-direction="se" class="moveable-control moveable-direction moveable-se" style="transform: translateZ(0px) translate(0px, 0px) rotate(0rad) scale(1);"></div><div class="moveable-control moveable-origin" style="transform: translateZ(0px) translate(50px, 50px) rotate(0rad) scale(1);"></div><div data-rotation="-1" data-line-index="0" data-direction="" class="moveable-line moveable-direction " style="transform: translateY(-50%) translate(0px, 0px) rotate(0rad) scaleY(1); width: 0px;"></div><div data-rotation="-1" data-line-index="1" data-direction="" class="moveable-line moveable-direction " style="transform: translateY(-50%) translate(0px, 0px) rotate(0rad) scaleY(1); width: 0px;"></div><div data-rotation="-1" data-line-index="2" data-direction="" class="moveable-line moveable-direction " style="transform: translateY(-50%) translate(0px, 0px) rotate(0rad) scaleY(1); width: 0px;"></div><div data-rotation="-1" data-line-index="3" data-direction="" class="moveable-line moveable-direction " style="transform: translateY(-50%) translate(0px, 0px) rotate(0rad) scaleY(1); width: 0px;"></div></div>



<quillbot-extension-portal></quillbot-extension-portal>
    `
    const css = new MasterCSS()
    document.body.innerHTML = ''
    await delay()
    expect(css.countOfClass).toEqual({})
})