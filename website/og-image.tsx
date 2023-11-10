/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */

import type { Metadata } from 'next';
import type { Author } from 'next/dist/lib/metadata/types/metadata-types';
import type { Props } from '../../../types/Props';

import { ImageResponse } from 'next/og';
import authors from '../../../data/authors';
import { queryDictionary } from '../../../dictionaries';
import stringWidth from 'string-width'
import fs from 'fs'
import path from 'path';
import mime from 'mime-types'

export default async function create({
    metadata,
    title,
    description,
    size = { width: 1200, height: 630 },
    icon,
    props
}: {
    metadata?: Metadata
    title?: string | null
    description?: string | null
    size?: { width: number, height: number }
    icon?: JSX.Element,
    props: Props
}): Promise<ImageResponse> {
    const fonts = [
        {
            name: 'Inter Medium',
            data: fs.readFileSync(path.join(process.cwd(), 'public/fonts/Inter-Medium.ttf'))
        },
        {
            name: 'Inter SemiBold',
            data: fs.readFileSync(path.join(process.cwd(), 'public/fonts/Inter-SemiBold.ttf'))
        },
        {
            name: 'Inter ExtraBold',
            data: fs.readFileSync(path.join(process.cwd(), 'public/fonts/Inter-ExtraBold.ttf'))
        },
        {
            name: 'NotoSansTC Regular',
            data: fs.readFileSync(path.join(process.cwd(), 'public/fonts/NotoSansTC-Regular.ttf'))
        },
        {
            name: 'NotoSansTC Medium',
            data: fs.readFileSync(path.join(process.cwd(), 'public/fonts/NotoSansTC-Medium.ttf'))
        },
        {
            name: 'NotoSansTC Black',
            data: fs.readFileSync(path.join(process.cwd(), 'public/fonts/NotoSansTC-Black.ttf'))
        }
    ]

    const readImage = (filename: string) => {
        filename = (process.env.VERCEL === '1' ? '../../../' : 'public/') + filename

        const extname = path.extname(filename);
        const mimeType = mime.lookup(extname);
        return `data:${mimeType};base64,` + fs.readFileSync(path.join(process.cwd(), filename), { encoding: 'base64' })
    }

    const authorImageURLs: any = {
        Aron: readImage('images/authors/aron.jpg'),
        Joy: readImage('images/authors/joy.jpg'),
        Benseage: readImage('images/authors/benseage.jpg'),
        Miles: readImage('images/authors/miles.jpg'),
        Lola: readImage('images/authors/lola.jpg'),
        Monting: readImage('images/authors/monting.jpg'),
    }

    const $ = await queryDictionary(props.params?.locale)
    title = $(title || metadata?.openGraph?.title).replace(' - Master CSS', '') as string
    description = $(description || metadata?.openGraph?.description || metadata?.description) as string
    const authorNames = metadata?.authors as Author[] || []
    const category = $(metadata?.category) as string
    if (stringWidth(description) > 110) {
        description = description.substring(0, 109)
        if (stringWidth(description) >= 110) {
            description = description.substring(0, 59)
        }
        description = description.replace(/[,.;]?\s[\w']*$|.$/, '...')
    }
    const titleStringWidth = stringWidth(title as string) + (icon ? 8 : 0)
    let titleFontSize = 64
    if (icon) {
        if (titleStringWidth > 84) {
            titleFontSize = 40
        } else if (titleStringWidth > 56) {
            titleFontSize = 48
        } else if (titleStringWidth > 28) {
            titleFontSize = 56
        }
    }

    const fontFamily = {
        medium: ['Inter Medium', 'NotoSansTC Regular'].join(','),
        semibold: ['Inter SemiBold', 'NotoSansTC Medium'].join(','),
        extrabold: ['Inter ExtraBold', 'NotoSansTC Black'].join(',')
    }

    return new ImageResponse(
        (
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                padding: '70px 95px',
                WebkitFontSmoothing: 'subpixel-antialiased',
                textRendering: 'geometricPrecision',
                ...size
            }}>
                <img src={readImage('public/images/cover-bg.jpg')}
                    width={size.width}
                    height={size.height}
                    style={{
                        position: 'absolute',
                        inset: 0
                    }} />
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flex: '1 1 auto'
                }}>
                    {/* logotype */}
                    <div style={{
                        display: 'flex'
                    }}>
                        <img src={readImage('public/images/css-logotype@light.png')} width="340" />
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '25px'
                    }}>
                        {/* title */}
                        <div style={{
                            display: 'flex',
                            fontFamily: fontFamily.extrabold,
                            fontWeight: 'bolder',
                            fontSize: `${titleFontSize}px`,
                            letterSpacing: '-0.025em'
                        }}>
                            {title}
                        </div>
                        {/* description */}
                        {
                            description && <div style={{
                                display: 'flex',
                                fontFamily: fontFamily.medium,
                                fontSize: `32px`,
                                color: '#6C7693',
                                width: '92%',
                                letterSpacing: '-0.015em',
                                lineHeight: '56px'
                            }}>
                                {description}
                            </div>
                        }
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-end'
                    }}>
                        {/* authors */}
                        {!!authorNames.length && authorNames.map((authorName, index) => {
                            const author: any = authors.find((eachAuthor) => eachAuthor.name === authorName)
                            return (
                                // eslint-disable-next-line react/jsx-key
                                <div style={{ display: 'flex', marginRight: '30px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', width: 70, height: 70, padding: 5, border: '1px solid #878D9F', borderRadius: '50%' }}>
                                        <img src={authorImageURLs[author.name]} width="100%" height="100%" style={{ objectFit: 'cover', borderRadius: '50%' }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', margin: '0px 15px' }}>
                                        <div style={{
                                            fontFamily: fontFamily.semibold,
                                            fontSize: `26px`,
                                            letterSpacing: '-0.025em',
                                        }}>
                                            {author.name}
                                        </div>
                                        <div style={{
                                            fontFamily: fontFamily.medium,
                                            fontSize: 18,
                                            color: '#878D9F',
                                            letterSpacing: '-0.025em',
                                            marginTop: 5
                                        }}>
                                            {author.twitter}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {/* category */}
                        {!authorNames.length && category &&
                            <div style={{
                                display: 'flex',
                                fontFamily: fontFamily.semibold,
                                fontSize: '28px',
                                color: '#e6a300'
                            }}>
                                {category}
                            </div>
                        }
                    </div>
                </div>
                {icon &&
                    <div style={{
                        display: 'flex',
                        justifyItems: 'center',
                        alignItems: 'center',
                        height: '100%',
                        flex: '0 0 280px'
                    }}>
                        {icon}
                    </div>}
            </div>
        ),
        {
            ...size,
            fonts,
            headers: {
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        },
    )
}

