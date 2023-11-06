'use client'

import Demo from 'websites/components/Demo'
import Code from 'websites/components/Code'
import SyntaxTable from '~/components/SyntaxTable'
import syntaxes from '../syntaxes'
import line from 'to-line'

export default () =>
    <SyntaxTable value={syntaxes} default="col-span:all">
                    {(className: string) =>
                        <>
                            <Demo>
                                <div className="gap:30 cols:3 w:full w:full_:where(div)">
                                    <div className="box mb:30">1</div>
                                    <div className="box mb:30">2</div>
                                    <div className="box mb:30">3</div>
                                    <div className={line(className, 'box', className.includes('all') ? 'mb:30' : 'mb:30')}>4</div>
                                    <div className="box mb:30">5</div>
                                    <div className="box mb:30">6</div>
                                    <div className="box mb:30">7</div>
                                </div>
                            </Demo>
                            <Code lang="html">{`
                                <div class="cols:3">
                                    <div>1</div>
                                    <div>2</div>
                                    <div>3</div>
                                    <div class="**${className}**">4</div>
                                    <div>5</div>
                                    <div>6</div>
                                    <div>7</div>
                                </div>
                            `}</Code>
                        </>
                    }
                </SyntaxTable>