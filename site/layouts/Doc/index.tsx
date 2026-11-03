import Meta, { MetaProps } from '../../components/Meta'
import Header from '../Header'
import Sidebar from './Sidebar'
import clsx from 'clsx'
import { cls } from '../../utils/cls'
import PageContents from './PageContents'
import Link from '~/components/Link'
import { authors } from '~/data/authors'
import { snackbar } from '~/utils/snackbar'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import MdnButton from '~/components/MdnButton'
import CanIUseButton from '~/components/CanIUseButton'
import MenuSvg from '~/svgs/menu.svg'
import { useRef } from 'react'
import ALink from '~/components/ALink'
import copy from 'copy-to-clipboard'
import ChevronRightSvg from '~/svgs/chevron-right.svg';

export interface DocProps extends MetaProps {
    contents?: any,
    seriesContents?: any,
    name?: string,
    showThemeToggle?: boolean,
    hideContents?: boolean,
    canIUse?: string,
    series?: string,
    mdn?: string,
    subtitle?: string,
    version?: string,
    authors?: string[],
    makers?: string[],
    className?: string
}

export default function Doc(props: any) {
    const { t, h1ClassName } = props
    const { t: tCommon } = useTranslation('common')
    const sidebarRef = useRef<HTMLElement>()
    let subtitle = props.subtitle
    if (!subtitle) {
        for (const key in props.contents) {
            const groupContents = props.contents[key] as string[]
            const lowerCaseTitle = props.title.toLowerCase()
            if (
                groupContents.find((eachContent: any) => typeof eachContent === 'string'
                    ? eachContent === props.title || eachContent === lowerCaseTitle
                    : eachContent.name === props.title || eachContent.name === lowerCaseTitle)
            ) {
                subtitle = key
            }
        }
    }
    return (
        <>
            <Header {...props}>
                <button className="headerNav hide@lg" onClick={() => {
                    sidebarRef.current?.classList.toggle('hide@<lg')
                }}>
                    <MenuSvg className="fill:current ml:-4" width="20" height="20" />
                </button>
                {
                    Object
                        .keys(props.seriesContents)
                        .map((name) => {
                            const info: any = props.seriesContents[name]
                            return (
                                <ALink href={`/docs`} key={name} className={clsx('headerNav inline-flex mx:10', {
                                    'active': name === props.name,
                                    'opacity:.5 untouchable': info.disabled
                                })}>
                                    v{props.version}
                                </ALink>
                            )
                        })
                }
                <ALink href="https://rc.css.master.co/docs" className='r:3 inline-flex font:medium center-content bg:rgba(251,224,157,.1)@dark f:rgb(251,224,157)@dark bg:rgba(235,187,64,.1) f:#dca000 text:12 p:4|10 my:-4 ml:5'>
                    {tCommon('v2.0 release candidate is now available')}
                    <ChevronRightSvg width="16" height="16" className="my:-4 ml:4 mr:-4" fill="currentColor" />
                </ALink>
            </Header>
            <Meta {...props} subdomain="docs" />
            <main className={clsx(cls`
                max-w:none@print
                w:100%@print
                mx:auto 
                p:120|20 p:140|20@md&<lg p:60|30@print
                mt:1em_:where(h2)+*>h3:first
                cursor:pointer_:where(h2,h3)
                rel_:where(h2,h3)
                visible_:where(h2,h3):hover>svg
            `, {
                'max-w:790 w:calc(100vw-500px)@lg': !props.hideContents,
                'max-w:1050 rel left:115@lg': props.hideContents
            })}>
                <article className={clsx({
                    'font:20_:where(h2) mt:3em_:where(h2)': !props.type,
                    'font:24_:where(h2) font:28_:where(h2)@sm': props.type === 'article'
                }, cls`
                    w:fit_:where(h2,h3)
                    text-underline-offset:3_:where(a,mark,u)
                    text-decoration:2|underline|fade-78_:where(a,u)
                    text-decoration-color:fade-34_:where(a,u)@dark
                    text-decoration-color:blue-64!_:where(a):hover
                    text-decoration:1|underline|#fce016_:where(mark)
                    text-decoration-color:rgb(252|224|22/.5)_:where(mark)@dark
                    text-decoration:1|line-through|fade-34_:where(del)
                    text-decoration-color:red-64_:where(del)@dark
                    bg:transparent_:where(mark)
                    {contents;font-weight:inherit}_:where(h2,h3)_a
                    content:'\\00a0↗'_a[target=blank]:not([class]):after
                    mb:15_:where(h2)
                    font:40_:where(h1)
                    font:24_:where(h3)
                    font:16_:where(h5)
                    font:14_:where(h6)
                    font:90%_:where(code)
                    font:semibold_:where(h2,h3,h4,h5,h6,th)
                    font:medium_:where(code,b,strong,a,mark)
                    ls:-.4_:where(code)
                    font:gray-24_:where(th)
                    font:gray-80_:where(th)@dark
                    font:extrabold_:where(h1)
                    p:20_:where(pre)
                    pl:1.5em_:where(ul,ol,blockquote)
                    pl:.375em_:where(li)
                    my:.5625em_:where(li)
                    mt:.5625em_:where(h1,h2,h3)+:where(h1,h2,h3,p)
                    my:1.125em_:where(.code,p,blockquote,figure,ul,ol)
                    mt:2em_:where(h1,h2,h3,h4,h5,h6)
                    list-style-type:disc_:where(ul)
                    font:fade-34_:where(p,li)
                    font:gray-60_:where(p,li)@dark
                    font:fade-14_:where(strong,b,code,a,mark,del)
                    font:gray-80_:where(strong,b,code,a,mark,del)@dark
                    font:fade-56_:where(li)::marker
                    font:gray-60_:where(li)::marker@dark
                    font:16_:where(p,li)
                    color:inherit_:where(blockquote)_p@dark
                    line-height:1.75rem_:where(p,li)
                    bl:5|solid|fade-80_:where(blockquote)
                    bl:5|solid|gray-30_:where(blockquote)@dark
                    max-width:full_:where(video,img)
                    text:14_:where(figcaption)
                    p:10|20|0_:where(figcaption)
                    width:fit_:where(figcaption)
                    mx:auto_:where(figcaption)
                    font:fade-52_:where(figcaption)
                    font:gray-60_:where(figcaption)@dark
                    width:full_:where(table)
                    border-spacing:0_:where(table)
                    bb:1|solid|fade-20/.06_:where(td,th)
                    {bb:1|solid|fade-88;my:30}_:where(hr) b:gray-22_:where(hr)@dark
                    my:50_:where(hr)@sm
                    mt:0_hr+*
                    b:gray-96/.03_:where(td,th)@dark
                    text:left_:where(th)
                    pl:0_:where(td,th):first
                    pr:0_:where(td,th):last
                    p:8_:where(td,th)
                    v:middle_:where(code)
                    font:14_:where(th)
                    v:baseline_:where(td)
                    ls:-.4_:where(h1,h2,h3,h4,h5,h6)
                `, props.className)} onClick={({ target }: any) => {
                        if (target.tagName === 'H2' || target.tagName === 'H3') {
                            const link = location.origin + location.pathname + '#' + target.id
                            snackbar('Link copied <b>' + link + '</b>')
                            copy(link)
                        }
                    }}>
                    {subtitle && <div className="f:semibold mb:.5em">
                        {t(subtitle)}
                    </div>
                    }
                    <div className="flex mb:20 gap:8 align-items:center">
                        <h1 className={clsx('f:30 f:40@lg mt:0 lh:1.1 ls:-.4', h1ClassName)}>{t(props.title)}</h1>
                        {props.canIUse && <CanIUseButton src={props.canIUse} className="ml:auto r:5" width="24" height="24"></CanIUseButton>}
                        {props.mdn && <MdnButton src={props.mdn} className={clsx('r:5', { 'ml:auto': !props.canIUse })} width="24" height="24"></MdnButton>}
                    </div>
                    {props.children}
                </article>
                {
                    (props.prevNav || props.nextNav)
                    && (
                        <>
                            <hr className="bg:white/.04@dark bg:fade-8/.06@light h:1 mt:80 mb:40" />
                            <div className="grid-cols:2 gap:40">
                                {props.prevNav ?
                                    <Link href={props.prevNav.path} passHref={true}>
                                        <button className="text-align:inherit">
                                            <div className="flex justify-content:start align-items:center">
                                                <svg xmlns="http://www.w3.org/2000/svg" height="26" viewBox="0 0 24 24" width="26" className="fill:fade-64@light fill:gray-60@dark ml:-8 my:-4">
                                                    <path d="M0 0h24v24H0V0z" fill="none" /><path d="M14.71 6.71c-.39-.39-1.02-.39-1.41 0L8.71 11.3c-.39.39-.39 1.02 0 1.41l4.59 4.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L10.83 12l3.88-3.88c.39-.39.38-1.03 0-1.41z" />
                                                </svg>
                                                <div className="ml:6 f:medium">{props.prevNav.t(props.prevNav.name)}</div>
                                            </div>
                                            {props.prevNav.description && <p className="lines:2 mb:0 mt:10 f:14 lh:1.5 f:fade-30@light f:gray-60@dark" dangerouslySetInnerHTML={{ __html: props.prevNav.description.replace(/t\('(.*)'\)/g, (_: string, key: string) => props.prevNav.t(key)) }}></p>}
                                        </button>
                                    </Link> :
                                    <div></div>
                                }
                                {props.nextNav &&
                                    <Link href={props.nextNav.path} passHref={true}>
                                        <button className="text-align:right">
                                            <div className="flex justify-content:right align-items:center">
                                                <div className="mr:6 f:medium">{props.nextNav.t(props.nextNav.name)}</div>
                                                <svg xmlns="http://www.w3.org/2000/svg" height="26" viewBox="0 0 24 24" width="26" className="fill:fade-64@light fill:gray-60@dark mr:-8 my:-4">
                                                    <path d="M0 0h24v24H0V0z" fill="none" /><path d="M9.29 6.71c-.39.39-.39 1.02 0 1.41L13.17 12l-3.88 3.88c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l4.59-4.59c.39-.39.39-1.02 0-1.41L10.7 6.7c-.38-.38-1.02-.38-1.41.01z" />
                                                </svg>
                                            </div>
                                            {props.nextNav.description && <p className="lines:2 mb:0 mt:10 f:14 lh:1.5 f:fade-30@light f:gray-60@dark" dangerouslySetInnerHTML={{ __html: props.nextNav.description.replace(/t\('(.*)'\)/g, (_: string, key: string) => props.nextNav.t(key)) }}></p>}
                                        </button>
                                    </Link>
                                }
                            </div>
                        </>
                    )
                }
                <hr className="bg:white/.04@dark bg:fade-8/.06@light h:1 my:40" />
                <div className="f:fade-50 f:gray-60@dark f:14 mb:-64 flex flex:wrap@<xs gap:20 justify-content:space-between@<xs align-items:center mt:-10">
                    <div className='w:1/3@xs'> © Aoyue Design LLC.</div>
                    <a href={'https://github.com/master-co/' + props.name.toLowerCase() + '/issues'}
                        target="blank"
                        className="t:center w:1/3@xs">
                        {tCommon('Issue on this page')}
                    </a>
                    {(props.editors || props.makers || props.authors) &&
                        (() => {
                            let label = ''
                            if (props.editors) {
                                label = 'Edited by'
                            } else if (props.makers) {
                                label = 'Made by'
                            } else if (props.authors) {
                                label = 'Authored by'
                            }
                            return (
                                <div className="w:1/3@xs flex align-items:center justify-content:right">
                                    <span className="mr:16">{tCommon(label)}</span>
                                    {(props.editors || props.makers || props.authors).map((userName: string) => {
                                        const user = authors[userName]
                                        return (
                                            <a key={userName} target="blank" href={user.url} className="rel ml:-8 round b:2|solid|white b:gray-16@dark font:0 overflow:hidden">
                                                <Image src={'/images/users/' + user.avatar} layout="fixed" className="object:cover" width="32" height="32" alt={userName} />
                                            </a>
                                        )
                                    })}
                                </div>
                            )
                        })()
                    }
                </div>
            </main>
            <Sidebar ref={sidebarRef} {...props}></Sidebar>
            {!props.hideContents && <PageContents t={t} sections={props.sections}></PageContents>}
        </>
    )
}
