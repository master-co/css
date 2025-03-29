import Features from 'internal/components/Features'
import Feature from '~/internal/components/Feature'
import { IconEyeHeart, IconFocusAuto, IconWand, IconZoomCode } from '@tabler/icons-react'
import Link from 'internal/components/Link'

export default () => (
    <Features className="grid-cols:3@sm my:14x">
        <Feature>
            <IconEyeHeart className="app-icon-primary" />
            <div>
                <p className='text:18!'><b className="font:semibold">Syntax highlighting</b></p>
                <p>Improve the readability and recognition of classes</p>
            </div>
        </Feature>
        <Feature>
            <IconZoomCode className="app-icon-primary" />
            <div>
                <p className='text:18!'><b className="font:semibold">Syntax inspection</b></p>
                <p>Preview generated CSS and references on hover or list</p>
            </div>
        </Feature>
        <Feature>
            <IconFocusAuto className="app-icon-primary" />
            <div>
                <p className='text:18!'><b className="font:semibold">Code completion</b></p>
                <p>Hints and auto-completion of available syntax</p>
            </div>
        </Feature>
        <Feature>
            <IconWand className="app-icon-primary" />
            <div>
                <p className='text:18!'><b className="font:semibold">Color preview</b></p>
                <p>Calculate and render syntax colors within a document</p>
            </div>
        </Feature>
    </Features>
)