'use client'

import Demo from 'websites-shared/components/Demo'
import Code from 'websites-shared/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import line from 'to-line'

export default () =>
    <SyntaxTable value={syntaxes} default="box:slice">
                    {(className: string) =>
                        <>
                            <Demo>
                                <div className="w:150">
                                    <span className={line(className, 'r:10 p:10 bg:indigo fg:white t:20')}>This text breaks across multiple lines.</span>
                                </div>
                            </Demo>
                            <Code lang="html">{`
                                <span class="**${className}**">This text breaks across multiple lines.</span>
                            `}</Code>
                        </>
                    }
                </SyntaxTable>