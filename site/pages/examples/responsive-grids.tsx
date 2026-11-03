import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ResponsiveGrids(props: any) {
    return (
        <div className="grid-cols:2 grid-cols:4**@xs** grid-cols:5**@sm** grid-cols:8**@md** grid-cols:12**@lg** grid-cols:16**@xl** gap:10 p:50">
            <div className="grid-col-span:2@xs box">1</div>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item) =>
                <div className="box" key={item}>{item}</div>)
            }
        </div>
    )
}

ResponsiveGrids.page = {
    noBackground: true
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale))
        },
    };
}
