import clsx from 'clsx'
import { throttle } from 'lodash-es';
import { useEffect, useRef, useState } from 'react';
import engineContents from '~/contents/engineContents';
import kitContents from '~/contents/kitContents';
import uiContents from '~/contents/uiContents';
import { cls } from '../../utils/cls'
import { isBrowser } from '../../utils/isBrowser';
import Logo from './Logo';
import MenuNav from './MenuNav';
import { useRouter } from 'next/router';

import DiscussionSvg from '~/svgs/discussion.svg';
import LanguageButton from '~/components/LanguageButton';
import ThemeButton from '~/components/ThemeButton';
import VersionSelect from './VersionSelect';

export default function Header(props: any) {
    const { top } = props
    const lowerCaseName = props?.name?.toLowerCase() || ''
    const initialScrollTop = isBrowser ? window.pageYOffset || document.documentElement.scrollTop : 0;
    const ref = useRef<any>();
    let lastScrollTop = initialScrollTop;
    const scrollDirectionRef = useRef(0);
    const [ready, setReady] = useState(false);
    const handleScroll = throttle(() => {
        const navbar: HTMLElement = ref.current;
        if (navbar) {
            const { current: scrollDirection } = scrollDirectionRef;
            let st = window.pageYOffset || document.documentElement.scrollTop;
            if (st <= 10) {
                if (!navbar.classList.contains('top')) {
                    navbar.classList.add('top');
                }
            } else {
                if (navbar.classList.contains('top')) {
                    navbar.classList.remove('top');
                }
            }
            if (!ready || Math.abs(st - lastScrollTop) <= 100) {
                return
            }
            if (st > lastScrollTop) {
                // downscroll code
                if (scrollDirection !== 1) {
                    scrollDirectionRef.current = 1;
                    navbar.classList.add('unreveal');
                }
            } else {
                if (scrollDirection !== -1) {
                    // upscroll code
                    scrollDirectionRef.current = -1;
                    navbar.classList.remove('unreveal');
                }
            }
            lastScrollTop = st <= 0 ? 0 : st // For Mobile or negative scrolling
        }
    }, 50, { leading: true });

    const router = useRouter();

    useEffect(() => {
        if (top) {
            return
        }
        handleScroll()
        setTimeout(() => {
            window.addEventListener('scroll', handleScroll, { passive: true })
            setReady(true)
        }, 100)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [handleScroll, top]);

    useEffect(() => {
        setTimeout(() => {
            ref.current.classList.add('~transform|.2s,height|.2s,padding|.2s,backdrop-filter|.2s')
        })
    }, []);

    const Navs = ({ className }: any) => (
        <div className={clsx(className, 'flex h:full align-items:center min-w:0')}>
            {props.navStart}
            {lowerCaseName === 'css' && <VersionSelect />}
            {props.children}
        </div>
    )

    return (
        <>
            <nav ref={ref} className={
                clsx(
                    cls`
                        fixed top:0 w:full z:1040
                        bb:1|solid|transparent
                        b:fade-20/.06:not(.top)@light
                        b:gray-96/.03:not(.top)@dark
                        bg:white/.8:not(.top)
                        bg:gray-16/.9:not(.top)@dark
                        bd:blur(25):not(.top)
                        pt:env(safe-area-inset-top)
                        px:20 px:30@lg
                        min-h:48 min-h:60@lg
                        hide@print
                        contain:layout|style
                    `,
                    props.className,
                    {
                        'opacity:0_.logo@lg': props.fixedLogo
                    }
                )}
            >
                <div className="max-w:1390 mx:auto flex h:full align-items:center w:full">
                    <Logo {...props} />
                    {<Navs className="flex:1 hide@<lg" />}
                    <div className="ml:auto@<lg w:fit flex h:full align-items:center mr:-10>*:last">
                        {props.end}
                        <a className="headerIcon"
                            href={'https://github.com/master-co/' + lowerCaseName}
                            target="blank">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path
                                    d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                        </a>
                        {lowerCaseName &&
                            <a href={'https://github.com/master-co/' + lowerCaseName + '/discussions'}
                                target="blank"
                                className="headerIcon hide@<sm">
                                <DiscussionSvg height="21" width="21" fill="currentColor" />
                            </a>
                        }
                        <a className="headerIcon hide@<sm"
                            href="https://twitter.com/mastercorg"
                            target="blank">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 310 310" width="20" height="20" fill="currentColor">
                                <g id="XMLID_826_">
                                    <path id="XMLID_827_"
                                        d="M302.973,57.388c-4.87,2.16-9.877,3.983-14.993,5.463c6.057-6.85,10.675-14.91,13.494-23.73   c0.632-1.977-0.023-4.141-1.648-5.434c-1.623-1.294-3.878-1.449-5.665-0.39c-10.865,6.444-22.587,11.075-34.878,13.783   c-12.381-12.098-29.197-18.983-46.581-18.983c-64.695,0-66.549,29.853-66.549,66.547c0,2.89,0.183,5.764,0.545,8.598   C101.163,99.244,58.83,76.863,29.76,41.204c-1.036-1.271-2.632-1.956-4.266-1.825c-1.635,0.128-3.104,1.05-3.93,2.467   c-5.896,10.117-9.013,21.688-9.013,33.461c0,16.035,5.725,31.249,15.838,43.137c-3.075-1.065-6.059-2.396-8.907-3.977   c-1.529-0.851-3.395-0.838-4.914,0.033c-1.52,0.871-2.473,2.473-2.513,4.224c-0.007,0.295-0.007,0.59-0.007,0.889   c0,23.935,12.882,45.484,32.577,57.229c-1.692-0.169-3.383-0.414-5.063-0.735c-1.732-0.331-3.513,0.276-4.681,1.597   c-1.17,1.32-1.557,3.16-1.018,4.84c7.29,22.76,26.059,39.501,48.749,44.605c-18.819,11.787-40.34,17.961-62.932,17.961   c-4.714,0-9.455-0.277-14.095-0.826c-2.305-0.274-4.509,1.087-5.294,3.279c-0.785,2.193,0.047,4.638,2.008,5.895   c29.023,18.609,62.582,28.445,97.047,28.445c67.754,0,110.139-31.95,133.764-58.753c29.46-33.421,46.356-77.658,46.356-121.367   c0-1.826-0.028-3.67-0.084-5.508c11.623-8.757,21.63-19.355,29.773-31.536c1.237-1.85,1.103-4.295-0.33-5.998   C307.394,57.037,305.009,56.486,302.973,57.388z" />
                                </g>
                            </svg>
                        </a>
                        <a className="headerIcon"
                            href="https://discord.gg/sZNKpAAAw6"
                            target="blank">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                fill="currentColor"
                                viewBox="0 0 127.14 96.36">
                                <g>
                                    <path
                                        d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                                </g>
                            </svg>
                        </a>
                        <LanguageButton />
                        {props.showThemeToggle && <ThemeButton className="headerIcon"/>}
                    </div>
                </div>
                <div className="hide@lg max-w:1390 mx:auto bt:1|solid|transparent b:fade-20/.06@light b:gray-96/.03@dark overflow-x:auto mx:-20@<lg px:20@<lg">
                    <Navs className="min-h:48 min-h:60@lg" />
                </div>
            </nav>
            {props.fixedLogo &&
                <div className={
                    clsx(
                        cls`
                        fixed top:0 ml:20 ml:30@lg z:1040
                        left:max(0px,calc(50%-45.3125rem))
                        hide@print hide@<lg
                        fixed_.serie@<lg
                        inset:auto|0_.serie@<lg
                        mx:auto_.serie@<lg
                    `
                    )}
                >
                    <Logo series={props.series}></Logo>
                </div>
            }
        </>
    )
}

// TODO
function goHome() {
    // if (environment.production) {
    //     window.location.href = 'https://master.co';
    // } else {
    //     this.router.navigate(['/'])
    // }
}
