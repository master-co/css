/* eslint-disable @next/next/no-html-link-for-pages */

import Image from 'next/image';
import { fruits } from '~/data/fruits';

export default function StyleAllSiblingsBehindExample() {
    return (
        <div className="overflow-x:auto p:40">
            <div className='width:64>*:nth(2)**~**div flex w:max gap:20 align-items:end'>
                {fruits.map((animal) =>
                    <div className="flex:0|0|156" key={animal.name}>
                        <Image src={animal.url} width={96} height={96} alt={animal.name} />
                    </div>
                )}
            </div>
        </div>
    )
}