import { IconBrandGithub } from '@tabler/icons-react'
import Link from 'websites/components/Link'

export default () => (
    <Link href="https://github.com/master-co/css" className="flex b:1|frame bg:yellow content:none::after fg:text-primary gap:8x my:8x outline-offset:2 outline:2|yellow:focus p:8x p:12x@xs r:3x">
        <div className="flex:1">
            <div className="fg:inherit font:20 font:32@xs font:heavy ls:-.4">Star us on GitHub ↗</div>
            <div className="text:14 text:16@xs font:medium ls:-.2 max-w:80%@xs mt:2x">We&apos;d greatly appreciate it if you could encourage and star our repository.</div>
        </div>
        <IconBrandGithub className='square h:auto w:15%' strokeWidth={1.5} />
    </Link>
)