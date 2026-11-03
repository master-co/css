import MasterSvg from '~/svgs/Master';

export default function MasterSaid({ children }: any) {
    return (
        <p>
            {children} ——
            <span className="mx:5 inline-flex v:middle" >
                <MasterSvg  width="26" height="26" alt="Master"></MasterSvg>
            </span>
            <a href="https://twitter.com/mastercorg" target="blank" className="">Master</a>
        </p>
    )
}