import clsx from 'clsx'
import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { cls } from '~/utils/cls'
import ActiveLink from '~/components/ActiveLink'

import ReactTimeAgo from 'react-time-ago'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en.json'
import { useTranslation } from 'next-i18next'
import { debounce } from 'lodash-es'
TimeAgo.addDefaultLocale(en);

// eslint-disable-next-line react/display-name
const Sidebar = forwardRef(({ contents, name }: any, ref: any) => {
    const lowerCaseName = name.toLowerCase()
    const { t } = useTranslation(lowerCaseName as string)
    const searchRef = useRef<HTMLInputElement>(null)
    const [searchKeyword, setSearchKeyword] = useState('')
    const [searchPlaceholder, setSearchPlaceholder] = useState('')
    const onSearch = (event: any) => {
        if (event.metaKey && event.keyCode === 83) {
            event.preventDefault()
            searchRef?.current?.focus()
        }
    }
    useEffect(() => {
        setSearchPlaceholder(window.navigator.userAgent.indexOf('Mac') > -1
            ? '⌘ S to Search …'
            : 'Ctrl S to Search …')
        window.addEventListener('keydown', onSearch)
        return () => {
            window.removeEventListener('keydown', onSearch)
        }
    }, [])

    const searchKeywordHandler = debounce((value) => setSearchKeyword(value), 100)

    return (
        <aside ref={ref}
            className={cls`
            scrollbar
            fixed z:1050@<lg
            h:calc(100%-6rem-1px) h:calc(100%-3.75rem)@lg 
            top:97 top:60@lg
            w:full w:260@lg w:300@xl
            left:max(0px,calc(50%-45.3125rem))
            overflow-y:auto
            overflow-y:overlay!@supports(overflow:overlay)
            r:0!::scrollbar
            r:0!::scrollbar-thumb 
            invisible:not(:hover)::scrollbar
            invisible:not(:hover)::scrollbar-thumb
            hide@print hide@<lg
            bg:white/.8@<lg
            bg:gray-16/.9@<lg@dark 
            bd:blur(25)@<lg
            overscroll-behavior:contain
            direction:rtl
        `}>
            <div className={cls`
                p:20|15 direction:ltr
                block:not([hidden])_a r:5_a px:12_a lh:1.75rem_a f:14_a
                f:fade-34_:where(a) f:gray-60_:where(a)@dark
                f:black_a:hover f:gray-80_a:hover@dark
                f:bold_a.active f:black_a.active f:gray-80_a.active@dark
                bg:fade-90_a:hover:not(.active) bg:gray-22_a:hover:not(.active)@dark
                contain:content:where(a,h4)
                {f:14;px:12;pt:0;mb:4;f:semibold;mt:24}_h4 f:gray-80_h4@dark
            `}>
                <div className="my:-10 py:10 sticky@lg top:20 top:0@lg bg:white@lg bg:gray-16@dark@lg z:1 flex align-items:center">
                    <input ref={searchRef}
                        className={
                            cls`
                            f:fade-60::placeholder f:gray::placeholder@dark
                            f:14 block w:full px:12 lh:2.25rem r:5 outline:0
                            hidden::search-cancel-button
                            bg:fade-90:is(:focus,:hover) bg:gray-22:is(:focus,:hover)@dark
                        `}
                        // onInput={searchKeyword}
                        onInput={(event) => searchKeywordHandler(event.currentTarget.value)}
                        onFocus={() => searchRef.current && (searchRef.current.placeholder = 'Search …')}
                        onBlur={() => searchRef.current && (searchRef.current.placeholder = searchPlaceholder)}
                        placeholder={searchPlaceholder}
                        type="search" />
                </div>
                { // Contents
                    Object
                        .keys(contents)
                        .map((title: string, index) => {
                            const links = contents[title]
                                .filter((link: any) => {
                                    if (!searchKeyword) return true;
                                    const linkName = typeof link === 'string'
                                        ? link.toString().toLowerCase()
                                        : link.name.toString().toLowerCase()
                                    const translatedLinkName = t(linkName)
                                    const lowerCaseSearchKeyword = searchKeyword.toLowerCase()
                                    return linkName.includes(lowerCaseSearchKeyword) || translatedLinkName.includes(lowerCaseSearchKeyword)
                                }) as string[]
                            // Nav Group
                            return (
                                <React.Fragment key={title + index}>
                                    <h4 className={clsx({
                                        hidden: !links || links.length === 0,
                                        'mb:-24!': !title
                                    })}>
                                        {t(title)}
                                    </h4>
                                    {
                                        links
                                            .map((link: any, linkIndex) => {
                                                let linkName = ''
                                                let linkPath = ''
                                                if (link.href) {
                                                    linkName = link.name || ''
                                                } else if (typeof link === 'string') {
                                                    linkName = link
                                                    linkPath = linkName.toLowerCase().replace(/ /g, '-')
                                                } else {
                                                    linkName = link.name || ''
                                                    linkPath = link.path === undefined ? link.name.toLowerCase().replace(/ /g, '-') : link.path
                                                }
                                                return (
                                                    <ActiveLink activeClassName="f:semibold f:fade-20@light f:gray-80@dark"
                                                        href={link.href || `/docs/${linkPath || ''}`}
                                                        key={linkName + linkIndex}>
                                                        <a onClick={() => ref.current?.classList.toggle('hide@<lg')}
                                                            target={link.target}
                                                            className="flex">
                                                            <div className="lines:1 break-word">
                                                                {t(linkName)}
                                                            </div>
                                                            {(link?.type || link?.date) &&
                                                                <div className="font:10 f:fade-50@light f:gray-60@dark mt:-10">
                                                                    {link?.type && t(link?.type) + (link?.date ? ', ' : '')}
                                                                    {link?.date && <ReactTimeAgo date={new Date(link.date)} />}
                                                                </div>
                                                            }
                                                        </a>
                                                    </ActiveLink>
                                                )
                                            })
                                    }
                                </React.Fragment>
                            )
                        })
                }
            </div>
        </aside>
    )
})

export default Sidebar