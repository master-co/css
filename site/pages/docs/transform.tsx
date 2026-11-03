/* eslint-disable @next/next/no-img-element */
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import StyleEditor from '~/components/Css/StyleEditor'
import { useState } from 'react'
import Image from 'next/image'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function Transform() {

    const [matrix, setMatrix] = useState({
        translateX: 0,
        translateY: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0
    });

    return (
        <>
            <ClassTable names={[
                ['transform:`function`'],
                ['translate(`x`,`y`)'],
                ['translate3d(`x`,`y`,`z`)'],
                ['translateX(`x`)'],
                ['translateY(`y`)'],
                ['translateZ(`z`)'],
                ['scale(`both`)'],
                ['scale(`x`,`y`)'],
                ['scale3d(`x`,`y`,`z`)'],
                ['scaleX(`x`)'],
                ['scaleY(`y`)'],
                ['scaleZ(`z`)'],
                ['skew(`x`,`y`)'],
                ['skewX(`x`)'],
                ['skewY(`y`)'],
                ['rotate(`angle`)'],
                ['rotate3d(`x`,`y`,`z`,`angle`)'],
                ['rotateX(`value`)'],
                ['rotateY(`value`)'],
                ['rotateZ(`value`)'],
                ['perspective(`value`)'],
                ['matrix(`a`,`b`,`c`,`d`,`x`,`y`)'],
                ['matrix3d(`a1`,`b1`,`c1`,`d1`,`a2`,`b2`,`c2`,`d2`,`a3`,`b3`,`c3`,`d3`,`a4`,`b4`,`c4`,`d4`)'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>transform</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                lets you rotate, scale, skew, or translate an element.
                It modifies the coordinate space of the CSS&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Visual_formatting_model" target="blank">visual formatting model</a>.
            </p>
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="translate">Translate</h3>
            <ImageList
                imageClass="bg:gray-50|url('/images/wallpaper.jpg')|no-repeat|top|left/cover aspect:1/1"
                showClasses={
                    [
                        'translate(0)',
                        'translate(10%)',
                        'translate(10%,10px)',
                        'translateX(10%)',
                        'translateY(10%)',
                        'translateZ(10%)'
                    ]}
            />
            <h3 id="scale">Scale</h3>
            <ImageList
                imageClass="bg:gray-50|url('/images/wallpaper.jpg')|no-repeat|top|left/cover aspect:1/1"
                showClasses={
                    [
                        'scale(1)',
                        'scale(1.2,.8)',
                        'scale(50%,75%)',
                        'scaleX(1.2)',
                        'scaleY(.8)',
                        'scaleZ(.8)',
                    ]}
            />
            <h3 id="skew">Skew</h3>
            <ImageList
                imageClass="bg:gray-50|url('/images/wallpaper.jpg')|no-repeat|top|left/cover aspect:1/1"
                showClasses={
                    [
                        'skew(0)',
                        'skew(10)',
                        'skew(5,10)',
                        'skewX(10)',
                        'skewY(10)',
                        'skewZ(10)',
                    ]}
            />
            <h3 id="rotate">Rotate</h3>
            <ImageList
                imageClass="bg:gray-50|url('/images/wallpaper.jpg')|no-repeat|top|left/cover aspect:1/1"
                showClasses={
                    [
                        'rotate(`value`deg)',
                        'rotate3d(1,1,1,`value`deg)',
                        'rotateX(`value`deg)',
                        'rotateY(`value`deg)',
                        'rotateZ(`value`deg)'
                    ]}
            />
            <h3 id="perspective">Perspective</h3>
            <StyleEditor
                autofocus
                tag="div"
                className="transform:perspective(25rem)"
                names={[
                    'transform:perspective(25rem)',
                    'transform:perspective(50rem)',
                    'transform:perspective(10rem)'
                ]}
                renderHtml={(className: string) => `
                    <div class="
                        transform-style:preserve-3d 
                        **${className}|rotateX(-25deg)|rotateY(-15deg)** ..w:100 h:100 rel {w:full;h:full}>div>img {w:full;h:full;abs}>div m:20 p:0!..">
                        <div class="transform:translateZ(50px)">
                            <img class="opacity:.5 bg:gray-50|url('/images/wallpaper.jpg')|no-repeat|top|left/cover aspect:1/1"/>
                        </div>
                        <div class="transform:rotateY(180deg)|translateZ(50px)">
                            <img/>
                        </div>
                        <div class="transform:rotateY(90deg)|translateZ(50px)">
                            <img/>
                        </div>
                        <div class="transform:rotateY(-90deg)|translateZ(50px)">
                            <img/>
                        </div>
                        <div class="transform:rotateX(90deg)|translateZ(50px)">
                            <img/>
                        </div>
                        <div class="transform:rotateX(-90deg)|translateZ(50px)">
                            <img/>
                        </div>
                    </div>
                `} />
            <h3 id="matrix">Matrix</h3>

            <div className="demo">
                <div className="flex flex:row! justify-content:center flex-wrap:wrap flex-wrap:nowrap@md">
                    <div className="flex flex:col center-content">
                        <div className="flex flex:col center-content">
                            <code className="f:12">matrix({matrix.scaleX},{matrix.skewY},{matrix.skewX},{matrix.scaleY},{matrix.translateX},{matrix.translateY})
                            </code>
                            <code className="f:12 mt:5 opacity:.35">
                                {
                                    matrix.translateX > 0 || matrix.translateY > 0 ? <span className="mx:5">translate({matrix.translateX},{matrix.translateY})</span> : null
                                }
                                {
                                    matrix.scaleX > 0 || matrix.scaleY > 0 ? <span className="mx:5">scale({matrix.scaleX},{matrix.scaleY})</span> : null
                                }
                                {
                                    matrix.skewX > 0 || matrix.skewY > 0 ? <span className="mx:5">skew({matrix.skewX},{matrix.skewY})</span> : null
                                }
                            </code>
                        </div>
                        <div className="w:22% position:relative my:50">
                            <img src="/images/wallpaper.jpg" className="opacity:.3 aspect:1/1" alt="wallpaper" />
                            <img src="/images/wallpaper.jpg" className={`abs matrix(${matrix.scaleX},${matrix.skewY},${matrix.skewX},${matrix.scaleY},${matrix.translateX},${matrix.translateY}) aspect:1/1 inset:0`} alt="wallpaper" />
                        </div>
                    </div>

                    <div className="flex center-content">
                        <div className="grid-cols:1 gap:20 p:10 p:20@md">
                            <div className="my:15">
                                <div> translateX: {matrix.translateX}</div>
                                <input type="range" className="mt:10" min="-50" max="50" onChange={(event) => setMatrix({ ...matrix, translateX: parseInt(event.target.value) })}></input>
                            </div>
                            <div className="my:15">
                                <div> translateY: {matrix.translateY}</div>
                                <input type="range" className="mt:10" min="-50" max="50" onChange={(event) => setMatrix({ ...matrix, translateY: parseInt(event.target.value) })}></input>
                            </div>
                            <div className="my:15">
                                <div> scaleX: {matrix.scaleX}</div>
                                <input type="range" className="mt:10" min="-50" max="50" onChange={(event) => setMatrix({ ...matrix, scaleX: parseInt(event.target.value) })}></input>
                            </div>
                            <div className="my:15">
                                <div> scaleY: {matrix.scaleY}</div>
                                <input type="range" className="mt:10" min="-50" max="50" onChange={(event) => setMatrix({ ...matrix, scaleY: parseInt(event.target.value) })}></input>
                            </div>
                            <div className="my:15">
                                <div> skewX: {matrix.skewX}</div>
                                <input type="range" className="mt:10" min="-50" max="50" onChange={(event) => setMatrix({ ...matrix, skewX: parseInt(event.target.value) })}></input>
                            </div>
                            <div className="my:15">
                                <div> skewX: {matrix.skewY}</div>
                                <input type="range" className="mt:10" min="-50" max="50" onChange={(event) => setMatrix({ ...matrix, skewY: parseInt(event.target.value) })}></input>
                            </div>
                        </div>

                    </div>


                </div>


            </div>
            <StyleFunctions name="transform:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="transform:scale(1):hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="transform:scale(1)@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="transform:scale(1)@print"></StyleMediaQueries>
            <StyleColorSchemes name="transform:scale(1)@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.transform'

Transform.page = {
    layout: CssDoc,
    title: 'Transform',
    description: 'The transform CSS property lets you rotate, scale, skew, or translate an element. It modifies the coordinate space of the CSS visual formatting model.',
    editors: ['Aron', 'Lola'],
    localeNamespace,
    mdn: true,
    canIUse: true
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};
