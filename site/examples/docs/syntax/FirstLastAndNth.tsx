/* eslint-disable @next/next/no-img-element */

import Image from 'next/image';
import { furnitures } from '~/data/furnitures';

/* eslint-disable @next/next/no-html-link-for-pages */
export default function FirstLastAndNthExample() {
    return (
        <ul className="list-style:none ..p:20|0 m:0 bg:white bg:gray-22@dark w:full max-w:340@sm shadow:demo..">
            {furnitures.map((furniture, index) =>
                <li className="bb:0**:last** bg:fade-94**:even** bb:1|solid|fade-88 ..bg:gray-24:even@dark b:gray-28!@dark px:25 flex align-items:center my:0 gap:12.." key={index}>
                    <Image className="round object:cover" src={furniture.url} layout="fixed" width="56" height="56" alt="avatar" quality={'0'} />
                    <div className="flex flex:col flex:1 py:10">
                        <div className="flex align-items:center">
                            <div className="text:14 capitalize ..font:gray-88@dark..">{furniture.name}</div>
                            <div className="text:14 ml:auto">${furniture.price}</div>
                        </div>
                        <div className="text:14 m:0 font:fade font:gray-60@dark">{furniture.intro}</div>
                    </div>
                </li>
            )}
        </ul>
    )
}