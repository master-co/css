'use client'

import { Fragment } from 'react'
import SearchButton from 'websites/components/SearchButton'
import clsx from 'clsx'
import { getDictionary } from 'websites/dictionaries'
import Link from 'websites/components/Link'
import { pageCategories } from '~/app/[locale]/(root)/pages'

export default function DocSidebar(props: any) {
    const $ = getDictionary(props.locale)
    return (
        <aside id="sidebar" className="scrollbar fixed hide@print hide@<md invisible:not(:hover)::scrollbar-thumb invisible:not(:hover)::scrollbar bd:blur(25)@<md bg:transparent!::scrollbar bg:gray-10/.9@<md@dark bg:white/.8@<md direction:rtl h:calc(100%-6rem-1px) h:calc(100%-3.75rem)@md left:max(0px,calc(50%-45.3125rem)) overflow-y:overlay!@supports(overflow:overlay) overflow-y:auto overscroll-behavior:contain top:97 top:60@md w:full w:260@md w:300@xl z:1050@<md">
            <div className="direction:ltr p:0|15|20|15">
                <div className="flex sticky@md untouchable align-items:center gradient(180deg,base|0%,base|calc(100%-2rem),transparent|100%)@md mb:-30 pb:30 pt:20 top:20 top:0@md z:1">
                    <SearchButton className="pointer-events:auto" locale={props.locale} />
                </div>
                <div className="{flex;min-h:32;px:15;rel;align-items:center}_:where(h4,.app-nav) {pt:0;fg:strong;mt:30;font:semibold;text:12}_:where(h4) {lines:1;break-word}_.app-nav_span {size:1x;abs;inset:0;my:auto;round}_svg bg:text-lightest_.app-nav:hover_svg bg:primary_.app-nav.active_svg contain:content:where(.app-nav,h4) fg:light_.app-nav pb:12x">
                    {pageCategories.map((eachPageCategory: any) => (
                        <Fragment key={eachPageCategory.name}>
                            <h4>{$(eachPageCategory.name)}</h4>
                            {eachPageCategory.pages
                                .map((eachPage: any) => (
                                    <Link activeClassName="active font:semibold"
                                        ambiguous
                                        href={eachPage.pathname}
                                        className="app-nav"
                                        scrollIntoView
                                        disabled={eachPage.metadata.disabled}
                                        unfinished={eachPage.metadata.unfinished}
                                        key={eachPage.pathname}>
                                        {!eachPage.metadata.disabled && <svg></svg>}
                                        {$(eachPage.metadata.other?.subject || eachPage.metadata.title)}
                                    </Link>
                                ))}
                        </Fragment>
                    ))}
                </div>
            </div>
        </aside>
    )
}