import Meta from '~/components/Meta'
import Header from '~/layouts/Header'
import HeroSection from '~/sections/css/Hero'
import ModernEffectsSection from '~/sections/css/ModernEffects'
import OutOfTheBoxSection from '~/sections/css/OutOfTheBox'
import SelectorsSection from '~/sections/css/Selectors'
import BreakpointsSection from '~/sections/css/Breakpoints'
import clsx from 'clsx'
import ExperienceSection from '~/sections/css/Experience'
import SyntaxSection from '~/sections/css/syntax'
import CustomizationSection from '~/sections/css/Customization'
import FlexibilitySection from '~/sections/css/Flexibility'
import PerformanceSection from '~/sections/css/Performance'
import Head from 'next/head'
import SetupSection from '~/sections/css/Setup'
import FooterSection from '~/sections/css/Footer'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import IDESection from '~/sections/css/IDE'
import { isBrowser } from '~/utils/isBrowser'
import ALink from '~/components/ALink'

export default function Css(props: any) {
    const { t } = useTranslation('home.css')
    // force dark
    if (isBrowser) {
        localStorage.setItem('theme', 'dark')
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
    }
    return (
        <div className="
            lh:1.75rem_:where(p,q) 
            font:gray-66_:where(p,q) 
            my:1em_:where(p,q) 
            font:gray-88_:where(p,q,b,h1,h2,h3,h4,h5,h6,code)
            font:90%_:where(p>code) 
            font:medium_:where(b)
            bg:gray-16!_:where(pre,.codeTabBar)
            will-change:contents_pre
            @flashOutline|.5s_.mark
        ">
            <Meta t={t}
                subdomain="css"
                cover="css.jpg"
                title={'Master CSS - ' + t('A Virtual CSS language with enhanced syntax.')}
                description={t('Efficiently build your UI and design system with HTML only.')} />
            <Header series='UI' name='CSS'>
                <div className="flex ml:-10 ml:20@sm">
                    {
                        ['design', 'experience', 'syntax', 'customization', 'flexibility', 'performance', 'IDE', 'setup']
                            .map((name) => (
                                <a href={'#' + name} key={name} className={clsx('headerNav capitalize inline-flex mx:8', { 'active': name === props.name })}>
                                    {t(name)}
                                    {name === props.name && <span className="ml:3">{props.version}</span>}
                                </a>
                            ))
                    }
                </div>
                <ALink href="/docs/why-master-css" className="headerNav ml:auto mr:8">
                    {t('Why')} <span className="hide@md font:gray-40@dark">→</span>
                </ALink>
                <ALink href="/docs/setup" className="headerNav mx:10">
                    {t('Docs')} <span className="hide@md font:gray-40@dark">→</span>
                </ALink>
            </Header>
            <HeroSection />
            <OutOfTheBoxSection />
            <ModernEffectsSection />
            {/* <GiveItLifeSection /> */}
            <SelectorsSection />
            <BreakpointsSection />
            {/* TODO: colors */}
            {/* TODO: color schemes */}
            {/* experience */}
            <ExperienceSection />
            {/* syntax */}
            <SyntaxSection />
            {/* customization */}
            <CustomizationSection />
            {/* flexibility */}
            <FlexibilitySection />
            {/* concepts */}
            <PerformanceSection />
            <IDESection />
            <SetupSection />
            {/* No design idea? Copied from our components. */}
            <FooterSection />
        </div>
    )
}

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['home.css'])),
        },
    };
}

