import Image from 'next/image';
import Link from '~/components/Link';
import { Fragment } from 'react';
import { toSlug } from '~/utils/toSlug';
import ALink from './ALink';

const ContentsOverview = ({ contents, name }: any) => {
    return (
        <>
            {
                Object.keys(contents)
                    .filter((groupName) => groupName !== '' && groupName !== 'News')
                    .map((groupName: string) => {
                        const groupContents = (contents as any)[groupName];
                        return (
                            <Fragment key={groupName}>
                                <h2 id={toSlug(groupName)}>{groupName}</h2>
                                <div className="grid-cols:2 grid-cols:3@sm grid-cols:4@md gap:20">
                                    {
                                        groupContents.map((link: any) => {
                                            let linkName = link
                                            let subtitle
                                            if (typeof link !== 'string') {
                                                linkName = link.name
                                                subtitle = link.subtitle
                                            }
                                            return (
                                                <ALink className="text-decoration:none" key={linkName} href={`/docs/${name}/` + toSlug(linkName)}>
                                                    <Image src="/images/page.png" width="350" height="175" alt="page" className="r:3" />
                                                    <div className="font:medium text:14 mt:3">{linkName}</div>
                                                    {subtitle && <div className="font:regular font:fade-50@light font:gray-60@dark text:12">{subtitle}</div>}
                                                </ALink>
                                            )
                                        })
                                    }
                                </div>
                            </Fragment>
                        )
                    })
            }
        </>
    )
}

export default ContentsOverview;