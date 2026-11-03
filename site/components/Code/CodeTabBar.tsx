import clsx from 'clsx'
import { cls } from '../../utils/cls'
import { Icons } from '../icons';
import CopySvg from '~/public/icons/copy.svg'
import CloseSvg from '~/svgs/close.svg'
import { snackbar } from '~/utils/snackbar';
import clearCodeTokens from '~/utils/clearCodeTokens';
import copy from 'copy-to-clipboard';

const CodeTabBar = ({ tabs, onTabChange, currentName, currentCode, className, showControls }: any) => {
    return (
        <div className={clsx('codeTabBar', className)}>
            {showControls && <div className="rrb:5 bb:1|solid|fade-88 br:1|solid|fade-88 b:white/.04@dark w:1/4 {w:10;h:10;inline-block;mx:3;round;v:middle}>svg flex:0 flex align-items:center px:10">
                <svg className="bg:#EC6A5F"></svg>
                <svg className="bg:#F4BF50"></svg>
                <svg className="bg:#61C454"></svg>
            </div>}
            {
                tabs.map(({ name, lang, hideName, hideClose }: any, index: number) => {
                    let ext
                    if (name && !hideName) {
                        ext = name.slice(name.lastIndexOf('.') + 1)
                        switch (true) {
                            case name.includes('react'):
                                ext = 'tsx';
                                break;
                            case name.includes('.component.'):
                            case name.includes('angular'):
                            case name == 'angular.json':
                                ext = 'angular';
                                break;
                            case name.endsWith('blade.php'):
                                ext = 'laravel';
                                break;
                            case name.endsWith('astro'):
                                ext = 'astro';
                                break;
                            case name.includes('vue'):
                            case name.endsWith('vue'):
                                ext = 'vue';
                                break;
                            case name == 'npx':
                                ext = 'npm';
                                break;
                            case name.includes('json'):
                                ext = 'json';
                                break;
                            case name.includes('master'):
                            case name.includes('Master'):
                                ext = 'master';
                            default:
                                break;
                        }
                    } else {
                        ext = lang
                    }

                    const Icon: any = Icons[ext];
                    const active = currentName === name || tabs.length === 1
                    return (
                        <button key={name}
                            className={clsx(cls`px:15 b:fade-88@light b:white/.04@dark b:solid flex align-items:center max-w:200`, {
                                'active rlb:5+div untouchable': active,
                                'rbr:5 br:1': tabs[index + 1]?.name === currentName && tabs.length > 1,
                                'rbl:5': tabs[index - 1]?.name === currentName,
                                'bb:1 f:fade-40:not(:hover)@light f:gray:not(:hover)@dark': currentName !== name && tabs.length > 1,
                                'bl:1': currentName !== name && index > 0
                            })}
                            onClick={
                                onTabChange
                                    ? (event) => onTabChange(event, name)
                                    : undefined
                            }>
                            {Icon && <Icon className={clsx('w:16 h:16 mb:-2',
                                {
                                    'mr:4': !hideName,
                                    'ml:-4': !hideClose
                                })}></Icon>}
                            {!hideName && <span className="lines:1 block white-space:nowrap flex:1">{name}</span>}
                            {!hideClose && active && <CloseSvg width="14" height="14" className="fill:gray ml:5 mr:-8" />}
                        </button>
                    )
                })
            }
            <div className="bb:1|solid|fade-88 bl:1|solid|fade-88 b:white/.04@dark flex:1 flex justify-content:end p:8|15">
                <CopySvg width="14" height="14" viewBox="0 0 24 24"
                    className="mr:-5 f:fade-64:not(:hover)@light f:gray:not(:hover)@dark cursor:pointer"
                    onClick={() => {
                        snackbar('Code copied' + (currentName ? ` <b>${currentName}</b>` : ''))
                        copy(clearCodeTokens(currentCode))
                    }}
                />
            </div>
        </div>
    )
}

export default CodeTabBar
