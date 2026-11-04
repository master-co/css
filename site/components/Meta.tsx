import Head from 'next/head'

const Meta = ({ title, suffix, description, cover, type, t }: MetaProps) => {
    const host = 'https://v1.css.master.co'
    title = t(title) + (suffix ? ` - ${suffix}` : '')
    cover = host + `/images/covers/${cover || 'main.jpg'}`
    return (
        <Head>
            {/* title */}
            <title>{title}</title>
            <meta property="og:title" content={title} />
            <meta name="twitter:title" content={title} />
            {/* description */}
            {description && <meta name="description" content={t(description)} />}
            {description && <meta property="og:description" content={t(description)} />}
            {description && <meta name="twitter:description" content={t(description)} />}
            {/* image */}
            <meta property="og:image" content={cover} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:image" content={cover} />
            <meta name="twitter:site" content="@mastercorg" />
            <meta name="twitter:creator" content="@mastercorg" />
            <meta property="og:type" content={type || 'article'} />
            <meta property="og:image:type" content="image/jpg" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <link rel="icon" type="image/png" href={'/images/favicon.png'} />
            <meta key="viewport" content="initial-scale=1, width=device-width, maximum-scale=1, user-scalable=no, shrink-to-fit=no, viewport-fit=cover"></meta>
        </Head>
    )
}

export interface MetaProps {
    title: string
    suffix?: string | boolean
    cover?: string
    description?: string
    type?: string
    t: any
    subdomain?: string
}

export default Meta
