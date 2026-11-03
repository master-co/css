import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import StyleEditor from '~/components/Css/StyleEditor';
import DocHTMLDemoCode from '~/components/DocHTMLDemoCode';
import CssDoc from '~/layouts/CssDoc'

export default function GridAndFlexLayout({ t }: any) {
    return (
        <>
            <p>歸因 Master 強大的語法，我們輕易地突破傳統十二因數限定的響應式網格以及彈性佈局，你可以輸入五、七甚至超過十二的任何欄/列數，依照你當下所需。</p>
            <h2 id="grid-system">網格系統</h2>
            <h3 id="adding-column-grids">新增欄式網格</h3>
            <p>使用 <code>grid-cols:n</code> 建立 <code>n</code> 欄相同大小的網格，<code>n</code> 可為 <code>&gt;=1</code> 的任意整數。</p>
            <DocHTMLDemoCode defaultValue={7} min={1} max={16}>
                {(value: any) => `
                    <div class="**grid-cols:${value}** gap:15 ..w:full stripe-bg..">
                        <div class="box">1</div>
                        <div class="box">2</div>
                        <div class="box">3</div>
                        ...
                        <div class="box">4</div>
                        <div class="box">5</div>
                        <div class="box">6</div>
                        <div class="box">7</div>
                        <div class="box">8</div>
                        <div class="box">9</div>
                        <div class="box">10</div>
                        <div class="box">11</div>
                        <div class="box">12</div>
                        <div class="box">13</div>
                        <div class="box">14</div>
                        <div class="box">15</div>
                        <div class="box">16</div>
                        ...
                    </div>
                `}
            </DocHTMLDemoCode>
            <h3 id="adding-row-grids">新增列式網格</h3>
            <p>使用 <code>grid-rows:n</code> 建立 <code>n</code> 列相同大小的網格，<code>n</code> 可為 <code>&gt;=1</code> 的任意整數。</p>
            <DocHTMLDemoCode defaultValue={3} min={1} max={16}>
                {(value: any) => `
                    <div class="**grid-rows:${value}** gap:15 ..w:full stripe-bg..">
                        <div class="box">1</div>
                        <div class="box">2</div>
                        <div class="box">3</div>
                        ...
                        <div class="box">4</div>
                        <div class="box">5</div>
                        <div class="box">6</div>
                        <div class="box">7</div>
                        <div class="box">8</div>
                        <div class="box">9</div>
                        <div class="box">10</div>
                        <div class="box">11</div>
                        <div class="box">12</div>
                        <div class="box">13</div>
                        <div class="box">14</div>
                        <div class="box">15</div>
                        <div class="box">16</div>
                        ...
                    </div>
                `}
            </DocHTMLDemoCode>
            <h3 id="adding-grid-gaps">新增網格的間隙</h3>
            <p>使用 <code>gap:size</code>、<code>gap:x|y</code>、<code>gap-x:size</code>、<code>gap-y:size</code> 為網格新增間隙，<code>size</code>、<code>x</code>、<code>y</code> 可為 <code>&gt;=0</code> 任意數。</p>
            <DocHTMLDemoCode defaultValue={15} min={0} max={50}>
                {(value: any) => `
                    <div class="grid-cols:6 **gap:${value}** ..w:full pink-stripe-bg..">
                        <div class="box">1</div>
                        <div class="box">2</div>
                        <div class="box">3</div>
                        ...
                        <div class="box">4</div>
                        <div class="box">5</div>
                        <div class="box">6</div>
                        <div class="box">7</div>
                        <div class="box">8</div>
                        <div class="box">9</div>
                        <div class="box">10</div>
                        <div class="box">11</div>
                        <div class="box">12</div>
                        ...
                    </div>
                `}
            </DocHTMLDemoCode>
            <h2 id="flex-layout">彈性佈局</h2>
        </>
    )
}

const localeNamespace = 'docs.css.grid-and-flex-layout'

GridAndFlexLayout.page = {
    layout: CssDoc,
    title: 'Responsive grid and flex layout',
    description: 'We devised a hybrid architecture that allows you to pre-generate CSS from HTML on the server side, and then continue to use JIT on the client side by reverse parsing.',
    authors: ['Aron'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
