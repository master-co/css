import Image from 'next/image'
import mountain1 from '~/site/public/images/mountain1.jpg'
import mountain2 from '~/site/public/images/mountain2.jpg'
import mountain3 from '~/site/public/images/mountain3.jpg'
import mountain4 from '~/site/public/images/mountain4.jpg'
import mountain5 from '~/site/public/images/mountain5.jpg'
import mountain6 from '~/site/public/images/mountain6.jpg'
import mountain7 from '~/site/public/images/mountain7.jpg'
import mountain8 from '~/site/public/images/mountain8.jpg'
import mountain9 from '~/site/public/images/mountain9.jpg'
import mountain10 from '~/site/public/images/mountain10.jpg'
import mountain11 from '~/site/public/images/mountain11.jpg'
import mountain12 from '~/site/public/images/mountain12.jpg'

const mountains = [
    mountain2,
    mountain3,
    mountain4,
    mountain5,
    mountain6,
    mountain7,
    mountain8,
    mountain9,
    mountain10,
    mountain11,
    mountain12,
]

export const dynamic = 'force-static'
export const revalidate = false

export default async function Page(props: any) {
    return (
        <>
            <div className="gap:15 p:40 grid-cols:2 grid-cols:3@2xs grid-cols:4@sm grid-cols:5@md">
                <Image
                    className="full r:5 grid-col-span:2 grid-row-span:2 aspect:2/1 object:cover"
                    src={mountain1.src}
                    blurDataURL={mountain1.blurDataURL}
                    placeholder='blur'
                    width="600"
                    height="300"
                    alt="mountain"
                />
                {mountains.map((mountain) => (
                    <Image
                        key={mountain.src}
                        className="r:5 aspect:2/1 h:auto object:cover w:full"
                        src={mountain.src}
                        blurDataURL={mountain.blurDataURL}
                        placeholder='blur'
                        width="300"
                        height="150"
                        alt="mountain"
                    />
                ))}
            </div>
        </>
    )
}