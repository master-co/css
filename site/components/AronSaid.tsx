import Image from 'next/image';

export default function AronSaid({ children }: any) {
    return (
        <p>
            {children} ——
            <span className="mx:5 inline-flex v:middle" >
                <Image className="round" src="/images/users/aron.jpg" width="24" height="24" alt="Aron" />
            </span>
            <a href="https://twitter.com/aron886tw" target="blank">Aron</a>
        </p>
    )
}