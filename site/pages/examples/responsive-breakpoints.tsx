import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Image from 'next/image';

export default function ResponsiveBreakpoints(props: any) {
    const mountains = [
        'mountain2',
        'mountain3',
        'mountain4',
        'mountain5',
        'mountain6',
        'mountain7',
        'mountain8',
        'mountain9',
        'mountain10',
        'mountain11',
        'mountain12'
    ]
    return (
        <>
            <h2>Mountain Photos</h2>
            <div className="grid-cols:2 grid-cols:3**@xs** grid-cols:4**@sm** grid-cols:5**@md** gap:15 gap:20**@sm** mt:20">
                <div className="flex grid-col-span:2 grid-row-span:2">
                    <Image className="r:5" src={`/images/mountain1.jpeg`} width="600" height="300" alt="mountain" quality={50} priority={true} />
                </div>
                {mountains.map((mountain) =>
                    <div className="flex" key={mountain}>
                        <Image className="r:5" src={`/images/${mountain}.jpeg`} width="300" height="150" alt="mountain" quality={50} priority={true} />
                    </div>
                )}
            </div>
        </>
    )
}

ResponsiveBreakpoints.page = {
    noBackground: true,
    bodyClassName: 'overflow:hidden p:20 p:30@xs p:50@sm',
    htmlClassName: 'overflow:hidden'
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale))
        },
    };
}
