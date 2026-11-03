/* eslint-disable @next/next/no-img-element */

import Image from 'next/image';
import { users } from '~/data/users';

/* eslint-disable @next/next/no-html-link-for-pages */
export default function StatesAndSelectorsExample() {
    return (
        <div className="bg:gray-22.active active p:8|20_li p:10|0 r:10 w:full max-w:340@sm">
            <input className="bg:gray-18:focus font:gray-40::placeholder outline:0 font:14 w:calc(100%-1.25rem) mx:10 p:12 lh:1 r:5" placeholder="Search for chats and messages" type="search" />
            <ul className="@shake|1s|infinite>li:first list-style:none mt:10">
                {users.map((user, index) =>
                    <li className="bg:gray-28:hover bg:gray-32:active flex gap:12 cursor:pointer" key={index}>
                        <div className="rel">
                            <Image src={user.url} width="40" height="40" className="round object:cover" alt="avatar" />
                            {index < 2 && <svg className="abs right:1 bottom:1 bg:green-70 outline:2|solid|white outline:gray-22@dark round w:7 h:7" />}
                        </div>
                        <div>
                            <div className="flex align-items:center">
                                <div className="text:14 font:medium font:gray-88@dark capitalize">{user.name}</div>
                                <div className="font:12 font:fade-54 font:gray-44@dark ml:8">{user.time}</div>
                            </div>
                            <p className="text:13 m:0">{user.message}</p>
                        </div>
                    </li>
                )}
            </ul>
        </div>
    )
}