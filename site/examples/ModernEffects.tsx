import Image from 'next/image';

export default function ModernEffectsExample() {
    return (
        <div className="grid-cols:3 gap:10 align-items:center {object:cover;width:full}_img">
            <div className="rotate(-8) aspect:2/3"><Image src="/images/modern-effect1.jpeg" width="200" height="300" alt="modern effects 1" quality={1} /></div>
            <div className="translateY(-30) translateY(-140)@sm blur(5) aspect:2/3"><Image src="/images/modern-effect2.jpeg" width="200" height="300" alt="modern effects 2" quality={1} /></div>
            <div className="transform:scale(.8)rotate(8) aspect:2/3"><Image src="/images/modern-effect3.jpeg" width="200" height="300" alt="modern effects 3" quality={1} /></div>
            <div className="sepia(1) translate(-40,20) mask-image:linear-gradient(black,transparent) aspect:2/3"><Image src="/images/modern-effect4.jpeg" width="200" height="300" alt="modern effects 4" quality={1} /></div>
            <div className="blend:lighten grayscale(1) grid-col:2/2|span grid-row:2/2|span mt:-50 mask-image:linear-gradient(black,transparent)"><Image src="/images/modern-effect5.jpeg" width="400" height="600" alt="modern effects 5" quality={50} /></div>
        </div>
    )
}