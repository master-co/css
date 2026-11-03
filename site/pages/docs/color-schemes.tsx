/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import Code from '~/components/Code';
import ReferenceTable from '~/components/Css/ReferenceTable'
import StyleEditor from '~/components/Css/StyleEditor';
import CssDoc from '~/layouts/CssDoc'
import { useLoaded } from '~/uses/loaded';
import { getLocalStorage } from '~/utils/getLocalStorage';
import { toggleTheme } from '~/utils/toggleTheme';
import SunSvg from '~/svgs/sun.svg';
import MoonSvg from '~/svgs/moon.svg';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import CodeHTML2CSS from '~/components/Code/CodeHTML2CSS';

export default function ColorSchemes() {
    const loaded = useLoaded();
    const [theme, setTheme] = useState('');

    useEffect(() => {
        setTheme(getLocalStorage('theme') ?? '');
    }, []);

    return (
        <>
            <ReferenceTable
                title="class"
                names={[
                    {
                        name: '@light',
                        description: '☀️ Use descendant combinator html.light to apply a style in light mode.',
                        hiddenRef: true
                    },
                    {
                        name: '@dark',
                        description: '🌙 Use descendant combinator html.dark to apply a style in dark mode.',
                        hiddenRef: true
                    },
                ]}>
            </ReferenceTable>

            <h2 id="Overview">Overview</h2>
            <p>
                Master uses an intelligent matching algorithm to make <b>all styles support color schemes toggling</b>,
                and the feature <strong>isn&rsquo;t limited to color-related properties</strong>, which means you can also apply it in layout, sizing, typography, and more.
            </p>
            <ul>
                <li>Using descendant combinator to apply a style based on color schemes.</li>
                <li>Chaining style with <code>@dark</code> or <code>@light</code>.</li>
                <li>Prioritizing <code>@dark</code> and <code>@light</code> suffix styles smartly.</li>
            </ul>

            <div className="demo">
                <div className="grid-cols:2 gap:12">
                    <div className="bg:gray-80.dark bg:gray-1 d:flex flex:wrap r:10 mx:auto box-shadow:0|8|20|rgba(0,0,0,.12) dark">
                        <div className="rel rt:inherit">
                            <img src="/images/mountain.jpg" className="rt:inherit aspect:16/9 object:cover" alt="" />
                            <div className="bg:linear-gradient(0deg,gray-80|0%,gray-80/0)|100%).dark bg:linear-gradient(0deg,white|0%,white/0)|100%) rt:inherit abs inset:0 dark"></div>
                        </div>
                        <div className="direction:rtl rel p:0|25|25|25 mt:-60">
                            <div className="f:gray-12.dark t:24 f:fade-92 f:bold dark">Mountain</div>
                            <div className="f:gray-34.dark t:14 f:fade-68 lines:2 mt:8 dark">
                                {`A mountain is an elevated portion of the Earth's crust, generally with steep sides that show
                                significant exposed bedrock.
                                `}
                            </div>
                        </div>
                    </div>
                    <div className="bg:gray-20.light bg:gray-1 d:flex flex:wrap r:10 mx:auto box-shadow:0|8|20|rgba(0,0,0,.12) light">
                        <div className="rel rt:inherit">
                            <img src="/images/mountain.jpg" className="rt:inherit aspect:16/9 object:cover" alt="" />
                            <div className="bg:linear-gradient(0deg,gray-20|0%,gray-20/0|100%).light bg:linear-gradient(0deg,white|0%,white/0|100%) rt:inherit abs inset:0 light"></div>
                        </div>
                        <div className="direction:rtl rel p:0|25|25|25 mt:-60">
                            <div className="f:gray-80.light t:24 f:fade-92 f:bold light">Mountain</div>
                            <div className="f:gray-70.light t:14 f:fade-68 lines:2 mt:8 light">
                                {`A mountain is an elevated portion of the Earth's crust, generally with steep sides that show
                                significant exposed bedrock.
                                `}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <CodeHTML2CSS>
                {`
                    <div class="f:gray-80**@light** f:gray-20**@dark**"></div>
                `}
            </CodeHTML2CSS>

            <h2 id="basic-usage">Basic usage</h2>
            <ul>
                <li>
                    set <code>bg:fade-50</code> on default
                    (overrided if set <code>@dark</code> or <code>@light</code> properties and set its related-mode).
                </li>
                <li>
                    set <code>bg:fade-20</code> on dark mode.
                </li>
                <li>
                    set <code>bg:fade-80</code> on light mode.
                </li>
            </ul>
            <CodeHTML2CSS>
                {`
                    <div class="--bg--:--fade-50-- bg:fade-20**@dark** bg:fade-80**@light** …"></div>
                `}
            </CodeHTML2CSS>

            <h2 id="setup">Setup</h2>
            <p>
                The most common practice is to <strong>provide and store the user&rsquo;s preference</strong>,
                it is unlikely to rely solely on CSS <code>prefers-color-schemes</code> to implement a color schemes.
            </p>
            <Code lang="js">
                {`
                    const storagedTheme = localStorage.getItem('theme');
                    const htmlClassList = document.documentElement.classList;
                    const DARK = 'dark';
                    const LIGHT = 'light';
                    const isDark = storagedTheme === DARK
                        || !storagedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches;
                `}
            </Code>
            <h3 id="detect-user-preferences">Detect user preferences</h3>
            <Code lang="js">
                {`
                    htmlClassList.toggle(LIGHT, !isDark);
                    htmlClassList.toggle(DARK, isDark);
                    if (!storagedTheme) {
                        localStorage.setItem('theme', isDark ? DARK : LIGHT);
                    }
                `}
            </Code>
            <h3 id="toggle-and-storage-theme">Toggle and storage theme</h3>
            <div className="demo">
                <div className="
                    b:1|solid|fade-80/.2@dark b:1|solid|fade-20/.2@light 
                    bg:fade-80/.05:hover@dark bg:fade-20/.05:hover@light
                    rounded">
                    <button id="theme-toggle" className="headerIcon f:gold-44@light f:gray-60@dark"
                        onClick={() => {
                            const theme = toggleTheme()
                            setTheme(theme)
                        }}>
                        {loaded && theme === 'dark'
                            ? <MoonSvg height="20" width="20" fill="currentColor" />
                            : <SunSvg height="20" width="20" className="fill:gold-80" />
                        }
                    </button>
                </div>
                <p className="ml:20">Current theme is <b>{theme}</b>.</p>
            </div>

            <Code lang="html">
                {`
                    <button id="theme-toggle">toggle theme</button>
                `}
            </Code>
            <Code lang="js">
                {`
                    const toggleTheme = () => {
                        const theme = localStorage.getItem('theme');
                        const htmlClassList = document.documentElement.classList;
                        const isDark = theme === 'dark';
                        htmlClassList.toggle('dark', !isDark);
                        htmlClassList.toggle('light', isDark);
                        localStorage.setItem('theme', isDark ? 'light' : 'dark');
                    };
                    document.getElementById('theme-toggle')
                            .addEventListener('click', toggleTheme, { passive: true })
                `}
            </Code>
            <p>
                <b>Warning</b> ! the following are the most common access errors in <code>localStorage</code>,
                which will cause the storage event to fail to trigger, etc.
            </p>
            <Code lang="js">
                {`
                    // Don't do this !
                    localStorage.theme = 'light';
                `}
            </Code>
        </>
    )
}

const localeNamespace = 'docs.css.color-schemes'

ColorSchemes.page = {
    layout: CssDoc,
    title: 'Color Schemes',
    description: 'Master uses an intelligent matching algorithm to make all styles support color schemes toggling, and the feature isn’t limited to color-related properties, which means you can also apply it in layout, sizing, typography, and more.',
    editors: ['Aron', 'Lola'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
