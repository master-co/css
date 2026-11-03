import clsx from 'clsx'
import Link from '~/components/Link';
import { useEffect, useState } from 'react'
import { anchor } from '~/utils/anchor'
import { cls } from '~/utils/cls'
import ContentsSvg from '~/svgs/contents.svg'
import ChevronForwardSvg from '~/svgs/chevron-forward.svg'
import { useTranslation } from 'next-i18next';

function PageContents({ sections, t }: any) {
    const [currentId, setCurrentId] = useState('');
    const { t: tCommon } = useTranslation();

    useEffect(() => {
        if (sections) {
            const contents: any[] = sections
                .reduce((a: any[], b: any) => {
                    a.push(document.querySelector('#' + b.id))
                    if (b.children) {
                        a.push(...b.children.map((eachChildren: any) => document.querySelector('#' + eachChildren.id)))
                    }
                    return a;
                }, [])
                .filter((eachContent: any) => eachContent);

            const targets: Element[] = [];
            const sectionsObserver = new IntersectionObserver((entries) => {
                entries.forEach(({ isIntersecting, target, intersectionRatio }) => {
                    if (intersectionRatio === 1) {
                        targets.push(target)
                    } else if (targets.includes(target)) {
                        targets.splice(targets.indexOf(target), 1)
                    }
                })
                targets.sort((a, b) => contents.indexOf(a) - contents.indexOf(b))
                if (targets.length) {
                    setCurrentId(targets[0].id)
                }
            }, {
                rootMargin: '-109px 0px 0px 0px',
                threshold: [0, 1]
            })
            for (const content of contents) {
                sectionsObserver.observe(content)
            }
            return () => {
                for (const content of contents) {
                    sectionsObserver?.unobserve(content)
                }
            }
        }
    }, [sections])

    return (
        <aside className="
            fixed right:max(0px,calc(50%-45.3125rem))
            top:0 w:260 w:300@xl pt:120 pb:40 h:full overflow-y:auto
            bg:white/.8@<lg bg:gray-16/.9@<lg@dark bd:blur(25)@<lg
            hide@print hide@<lg
            bl:1|solid|transparent@<lg
            b:fade-20/.06:not(.top)@light
            b:gray-96/.03:not(.top)@dark 
        ">
            <div className="px:25 mb:10 flex align-items:center">
                <ContentsSvg width="18" height="18" fill="currentColor" />
                <span className="f:12 ls:1 ml:5 f:semibold">{tCommon('ON THIS PAGE')}</span>
            </div>
            <ul className="px:15">
                {
                    sections?.map((section: any) => (
                        <li key={section.id}>
                            <Link href={'#' + section.id}>
                                <a className={
                                    clsx(
                                        cls`
                                            block my:8 px:12 t:14 cursor:pointer
                                            f:semibold.active f:fade-30 f:black:hover f:black.active
                                            f:gray-60@dark f:gray-80:hover@dark f:gray-80.active@dark 
                                            f:90%>code contain:content
                                        `,
                                        { active: currentId === section.id }
                                    )}
                                    ref={(el) => section.el = el}
                                    onClick={(event) => {
                                        event.preventDefault()
                                        // setCurrentId(section.id)
                                        anchor(section.id, { offset: 110 })
                                    }}>
                                    {t(section.name.replace(/{t\('(.*)'\)}/g, '$1'))}
                                </a>
                            </Link>
                            {!!section.children.length &&
                                <ul>
                                    {
                                        section.children.map((childSection: any) => (
                                            <li key={childSection.id}>
                                                <a className={clsx(
                                                    cls`
                                                        flex align-items:center my:8 px:12 t:14 cursor:pointer
                                                        f:semibold.active f:fade-30 f:black:hover f:black.active
                                                        f:gray-60@dark f:gray-80:hover@dark f:gray-80.active@dark 
                                                        b:white.active@dark fill:current.active>svg
                                                        f:90%>code contain:content
                                                    `,
                                                    { active: currentId === childSection.id }
                                                )}
                                                    ref={(el) => childSection.el = el}
                                                    onClick={(event) => {
                                                        event.preventDefault()
                                                        // setCurrentId(childSection.id)
                                                        anchor(childSection.id, { offset: 110 })
                                                    }}>
                                                    <ChevronForwardSvg width="16" height="16" className="flex:0|0|auto mr:4 ml:-4 fill:fade-70 fill:gray-30@dark" />
                                                    {t(childSection.name.replace(/{t\('(.*)'\)}/g, '$1'))}
                                                </a>
                                            </li>
                                        ))
                                    }
                                </ul>
                            }
                        </li>
                    ))
                }
            </ul>
        </aside>
    )
}

export default PageContents