/* eslint-disable @next/next/no-img-element */
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ViewportOrientation(props: any) {
    return (
        <img className="aspect:2/1**@landscape** aspect:1/1**@portrait** max-w:600 mx:auto object:cover" width="100%" alt="mountain" src="/images/mountain.jpg" />
    )
}

ViewportOrientation.page = {
    noBackground: true
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale))
        },
    };
}
