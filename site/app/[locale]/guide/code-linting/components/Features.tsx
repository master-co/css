import Features from 'internal/components/Features'
import Feature from 'internal/components/Feature'
import { IconStatusChange, IconSettingsExclamation, IconArrowMerge, IconShieldCheck, IconPencilExclamation, IconFunction } from '@tabler/icons-react'
import Link from 'internal/components/Link'

export default () => (
    <Features className="my:14x grid-cols:3@sm">
        <Feature>
            <IconStatusChange className="app-icon-primary" />
            <div>
                <p className='text:18!'><Link href="#consistent-class-order">Consistent class order</Link></p>
                <p>Enforce a consistent and logical order of classes</p>
            </div>
        </Feature>
        <Feature>
            <IconShieldCheck className="app-icon-primary" />
            <div>
                <p className='text:18!'><Link href="#syntax-error-checks">Syntax error checks</Link></p>
                <p>Detect syntax errors early when writing classes</p>
            </div>
        </Feature>
        <Feature>
            <IconSettingsExclamation className="app-icon-primary" />
            <div>
                <p className='text:18!'><Link href="#disallow-unknown-classes">Disallow unknown classes</Link></p>
                <p>Enforce the use of Master CSS syntax to apply styles</p>
            </div>
        </Feature>
        <Feature>
            <IconPencilExclamation className="app-icon-primary" />
            <div>
                <p className='text:18!'><Link href="#class-collision-detection">Class collision detection</Link></p>
                <p>Avoid applying classes with the same CSS declaration</p>
            </div>
        </Feature>
        <Feature>
            <IconFunction className="app-icon-primary" />
            <div>
                <p className='text:18!'><Link href="#supports-js-utilities">Supports JS utilities</Link></p>
                <p>Check the classes in popular utility arguments</p>
            </div>
        </Feature>
    </Features>
)