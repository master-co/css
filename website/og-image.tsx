/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */

import type { Metadata } from 'next';
import type { Author } from 'next/dist/lib/metadata/types/metadata-types';
import type { Props } from 'websites/types/Props';

import { ImageResponse } from 'next/og';
import authors from 'websites/data/authors';
import { queryDictionary } from 'websites/dictionaries';
import stringWidth from 'string-width'
import fs from 'fs'
import path from 'path';
import mime from 'mime-types'

const readImage = (filename: string) => {
    console.log('cwd:', process.cwd())
    console.log('read image:', filename)
    const extname = path.extname(filename);
    const mimeType = mime.lookup(extname);
    return `data:${mimeType};base64,` + fs.readFileSync(filename, { encoding: 'base64' })
}

const cssLogotypeSrc = readImage('public/images/css-logotype@light.png')
const coverBgSrc = readImage('public/images/cover-bg.jpg')
const authorImages: any = {
    Aron: readImage('public/images/authors/aron.jpg'),
    Joy: readImage('public/images/authors/joy.jpg'),
    Benseage: readImage('public/images/authors/benseage.jpg'),
    Miles: readImage('public/images/authors/miles.jpg'),
    Lola: readImage('public/images/authors/lola.jpg'),
    Monting: readImage('public/images/authors/monting.jpg'),
}

const fonts = [
    {
        name: 'Inter Medium',
        data: fs.readFileSync(path.resolve('public/fonts/Inter-Medium.ttf'))
    },
    {
        name: 'Inter SemiBold',
        data: fs.readFileSync(path.resolve('public/fonts/Inter-SemiBold.ttf'))
    },
    {
        name: 'Inter ExtraBold',
        data: fs.readFileSync(path.resolve('public/fonts/Inter-ExtraBold.ttf'))
    },
    {
        name: 'NotoSansTC Regular',
        data: fs.readFileSync(path.resolve('../../../fonts/NotoSansTC-Regular.ttf'))
    },
    {
        name: 'NotoSansTC Medium',
        data: fs.readFileSync(path.resolve('../../../fonts/NotoSansTC-Medium.ttf'))
    },
    {
        name: 'NotoSansTC Black',
        data: fs.readFileSync(path.resolve('../../../fonts/NotoSansTC-Black.ttf'))
    }
]

export default async function create({
    metadata,
    title,
    description,
    size = { width: 1200, height: 630 },
    icon,
    props,
    ogImageTitle,
    ogImageIcon,
    ogImageIconWidth
}: {
    metadata?: Metadata
    title?: string | null
    description?: string | null
    size?: { width: number, height: number }
    icon?: JSX.Element,
    props: Props,
    ogImageTitle?: string | null,
    ogImageIcon?: string | null,
    ogImageIconWidth?: string | null
}): Promise<ImageResponse> {
    const $ = await queryDictionary(props.params?.locale)
    title = $(ogImageTitle || title || metadata?.openGraph?.title).replace(' - Master CSS', '') as string
    description = $(description || metadata?.openGraph?.description) as string
    const authorNames = metadata?.authors as Author[] || []
    const category = $(metadata?.category) as string
    if (ogImageIcon) {
        icon = <img src={readImage(ogImageIcon)} width={ogImageIconWidth ? +ogImageIconWidth : undefined} height='100%' style={{ objectFit: 'contain', margin: 'auto' }} />
    }
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
                backgroundImage: `url(${coverBgSrc})`,
                backgroundSize: '100% 100%',
                padding: '70px 95px',
                WebkitFontSmoothing: 'subpixel-antialiased',
                textRendering: 'geometricPrecision',
                ...size
            }}>
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
                        <img src={cssLogotypeSrc} width="340" />
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
                                        <img src={authorImages[author.name]} width="100%" height="100%" style={{ objectFit: 'cover', borderRadius: '50%' }} />
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

