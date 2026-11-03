import Image from 'next/image';
import { animals } from '~/data/animals';

/* eslint-disable @next/next/no-html-link-for-pages */
export default function ScrollbarExample() {
    return (
        <>
            <div className="
                {w:6;h:6;rounded}**::scrollbar**
                bg:fade-86**::scrollbar-thumb**
                bg:fade-76**::scrollbar-thumb**:hover
                bg:fade-66**::scrollbar-thumb**:active
                bg:gray-30**::scrollbar-thumb**@dark
                bg:gray-40**::scrollbar-thumb**:hover@dark
                bg:gray-50**::scrollbar-thumb**:active@dark
                bg:transparent**::scrollbar-corner**
                rounded**::scrollbar-thumb**
                overflow-x:auto p:40
            ">
                <div className='flex w:max'>
                    {animals.map((animal) =>
                        <div className="flex:0|0|156" key={animal.name}>
                            <Image src={animal.url} width={156} height={156} alt={animal.name} />
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}