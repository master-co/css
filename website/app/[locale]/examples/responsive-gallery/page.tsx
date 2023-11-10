import Image from 'next/image'
import mountain1 from '/public/images/mountain1.jpg'
import mountain2 from '/public/images/mountain2.jpg'
import mountain3 from '/public/images/mountain3.jpg'
import mountain4 from '/public/images/mountain4.jpg'
import mountain5 from '/public/images/mountain5.jpg'
import mountain6 from '/public/images/mountain6.jpg'
import mountain7 from '/public/images/mountain7.jpg'
import mountain8 from '/public/images/mountain8.jpg'
import mountain9 from '/public/images/mountain9.jpg'
import mountain10 from '/public/images/mountain10.jpg'
import mountain11 from '/public/images/mountain11.jpg'
import mountain12 from '/public/images/mountain12.jpg'

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

export default async function Page(props: any) {
    return (
        <>
            <div className="gap:15 grid-cols:2 grid-cols:3@2xs grid-cols:4@sm grid-cols:5@md p:40">
                <Image
                    className="object:cover full aspect:2/1 grid-col-span:2 grid-row-span:2 r:5"
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
                        className="aspect:2/1 h:auto object:cover r:5 w:full"
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