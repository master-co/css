import Image from 'next/image'

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
    'mountain12',
]

export default async function Page(props: any) {
    return (
        <>
            <div className="grid-cols:2 grid-cols:3@2xs grid-cols:4@sm grid-cols:5@md gap:15 p:40">
                <Image
                    className="grid-col-span:2 grid-row-span:2 r:5 aspect:2/1 full object:fit"
                    src={`/images/mountain1.jpeg`}
                    width="600"
                    height="300"
                    alt="mountain"
                    quality={50}
                    priority={true}
                />
                {mountains.map((mountain) => (
                    <Image
                        key={mountain}
                        className="r:5 aspect:2/1 w:full h:auto"
                        src={`/images/${mountain}.jpeg`}
                        width="300"
                        height="150"
                        alt="mountain"
                        quality={50}
                        priority={true}
                    />
                ))}
            </div>
        </>
    )
}