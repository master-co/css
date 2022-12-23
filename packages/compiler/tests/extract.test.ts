import MasterCSS from '@master/css'
import extract from '../src/options/extract'
const css = new MasterCSS()

test('basic js object', () => {
    expect(extract({
        name: 'test',
        content: `
        const test = {
            'f:24': true
        }
        `
    }, css)).toStrictEqual(['f:24'])
})

test('basic html', () => {
    expect(extract({
        name: 'test',
        content: `<div class="f:16 blur(2px) @shake|1s|infinite>li"></div>`
    }, css)).toStrictEqual(['f:16', 'blur(2px)', '@shake|1s|infinite>li'])
})

test('content', () => {
    expect(extract({
        name: 'test',
        content: `<div class="content:'I\\'m_string' content:'I\\'m_string2'"></div>`
    }, css)).toStrictEqual(['content:\'I\\\'m_string\'', 'content:\'I\\\'m_string2\''])
})

test('url', () => {
    expect(extract({
        name: 'test',
        content: `<div class="bg:url('https://master.co/test_logo.png')"></div>`
    }, css)).toStrictEqual(['bg:url(\'https://master.co/test_logo.png\')'])
})

test('comment', () => {
    expect(extract({
        name: 'test',
        content: `<!-- comment -->
        /* bg:black */
        /*
            f:16
        */
        `
    }, css)).toStrictEqual([])
})

test('=', () => {
    expect(extract({
        name: 'test',
        content: `
        this={components[0]}
        data={data_0}>
        content:'='
        content:"="
        `
    }, css)).toStrictEqual([
        'content:\'=\'',
        'content:"="'
    ])
})

test('media', () => {
    expect(extract({
        name: 'test',
        content: `
        bg:black@xl
        font:24@media(min-width:1024px)
        font:16@<789
        font:16@<=789
        font:16@>=789
        font:16@>789
        @animation_test@>789
        `
    }, css)).toStrictEqual([
        'bg:black@xl',
        'font:24@media(min-width:1024px)',
        'font:16@<789',
        'font:16@<=789',
        'font:16@>=789',
        'font:16@>789',
        '@animation_test@>789'
    ])
})

test('wxh', () => {
    expect(extract({
        name: 'test',
        content: `
        1920x1080
        1024pxx786px
        min:40x80
        min:calc(100vw-60)xcalc(100vh-100px)
        calc(100vw-60)x20rem
        15pxxcalc(100vh-100px)
        calc(100vw-60)xcalc(100vh-100px)
        class="logo 172x172"
        `
    }, css)).toStrictEqual([
        '1920x1080',
        '1024pxx786px',
        'min:40x80',
        'min:calc(100vw-60)xcalc(100vh-100px)',
        'calc(100vw-60)x20rem',
        '15pxxcalc(100vh-100px)',
        'calc(100vw-60)xcalc(100vh-100px)',
        '172x172'
    ])
})

test('group', () => {
    expect(extract({
        name: 'test',
        content: `
        {form}
        {:else}
        {data_0}
        {}
        {/if}
        {bg:black;f:16}_div@dark
        .something{bg:white}
        `
    }, css)).toStrictEqual([
        '{bg:black;f:16}_div@dark',
        '.something{bg:white}'
    ])
})

test('import', () => {
    const css = new MasterCSS()
    expect(extract({
        name: 'test',
        content: `
        import * as fs from 'fs'
        import css from '@master/css'
        require('fs')
        await import('file:///')
        `
    }, css)).toStrictEqual([])
})

test('style tag', () => {
    expect(extract({
        name: 'test',
        content: `<style data-sveltekit>.app.s-7IPF32Wcq3s8.s-7IPF32Wcq3s8{display:flex;flex-direction:column;min-height:100vh}main.s-7IPF32Wcq3s8.s-7IPF32Wcq3s8{flex:1;display:flex;flex-direction:column;padding:1rem;width:100%;max-width:64rem;margin:0 auto;box-sizing:border-box}footer.s-7IPF32Wcq3s8.s-7IPF32Wcq3s8{display:flex;flex-direction:column;justify-content:center;align-items:center;padding:12px}footer.s-7IPF32Wcq3s8 a.s-7IPF32Wcq3s8{font-weight:bold}@media(min-width: 480px){footer.s-7IPF32Wcq3s8.s-7IPF32Wcq3s8{padding:12px 0}}.s-7IPF32Wcq3s8.s-7IPF32Wcq3s8{}
/* fira-mono-cyrillic-ext-400-normal*/
@font-face {
  font-family: 'Fira Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-cyrillic-ext-400-normal.woff2') format('woff2'), url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-all-400-normal.woff') format('woff');
  unicode-range: U+0460-052F,U+1C80-1C88,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F;
}
/* fira-mono-cyrillic-400-normal*/
@font-face {
  font-family: 'Fira Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-cyrillic-400-normal.woff2') format('woff2'), url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-all-400-normal.woff') format('woff');
  unicode-range: U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116;
}
/* fira-mono-greek-ext-400-normal*/
@font-face {
  font-family: 'Fira Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-greek-ext-400-normal.woff2') format('woff2'), url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-all-400-normal.woff') format('woff');
  unicode-range: U+1F00-1FFF;
}
/* fira-mono-greek-400-normal*/
@font-face {
  font-family: 'Fira Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-greek-400-normal.woff2') format('woff2'), url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-all-400-normal.woff') format('woff');
  unicode-range: U+0370-03FF;
}
/* fira-mono-latin-ext-400-normal*/
@font-face {
  font-family: 'Fira Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-latin-ext-400-normal.woff2') format('woff2'), url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-all-400-normal.woff') format('woff');
  unicode-range: U+0100-024F,U+0259,U+1E00-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF;
}
/* fira-mono-latin-400-normal*/
@font-face {
  font-family: 'Fira Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-latin-400-normal.woff2') format('woff2'), url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-all-400-normal.woff') format('woff');
  unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
}
:root {
	--font-body: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
		Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	--font-mono: 'Fira Mono', monospace;
	--color-bg-0: rgb(202, 216, 228);
	--color-bg-1: hsl(209, 36%, 86%);
	--color-bg-2: hsl(224, 44%, 95%);
	--color-theme-1: #ff3e00;
	--color-theme-2: #40b3ff;
	--color-text: rgba(0, 0, 0, 0.7);
	--column-width: 42rem;
	--column-margin-top: 4rem;
	font-family: var(--font-body);
	color: var(--color-text);
}
</style>`
    }, css)).toStrictEqual([])
})


test('@', () => {
    expect(extract({
        name: 'test',
        content: `
        // @ts-ignore
        @font-face
        {
            font-family: 'Fira Mono';
            font-style: normal;
            font-display: swap;
            font-weight: 400;
            src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-cyrillic-ext-400-normal.woff2');
            unicode-range: U+0460-052F,U+1C80-1C88,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F;
        }
        `
    }, css)).toStrictEqual([])
})

test('home path', () => {
    expect(extract({
        name: 'test',
        content: `
        ~/assets/master.svg
        ~/master.svg
        ~padding|300ms|ease-in
        ~delay:0ms
        ~duration:.5ms
        ~easing:steps(6,end)
        `
    }, css)).toStrictEqual([
        '~padding|300ms|ease-in',
        '~delay:0ms',
        '~duration:.5ms',
        '~easing:steps(6,end)'
    ])
})

test('AristideBH', () => {
    expect(extract({
        name: 'test.svelte',
        content: `
<script lang="ts">
	import type { PageData } from "./$houdini";
	import { onMount } from "svelte";
	import coulisse from "$lib/js/coulisse";
	import InViewBlock from "$cpt/utils/InViewBlock.svelte";
	import MagicWrapper from "$cpt/items/MagicWrapper.svelte";
	export let data: PageData;
	let poulie: HTMLElement[] = [];
	onMount(() => coulisse(poulie));
	$: ({ SiteInfos } = data);
</script>

<div class="grid-row:1/2 flex flex:col flex gabX:full cards">
	{#if !$SiteInfos.isFetching}
		{#each $SiteInfos?.data?.themeGeneralSettings?.siteOptions?.pinnedProjects as project}
			<InViewBlock>
				<a href={project.uri}>
					<img
						class="w:100% flex aspect:16/9 obj:cover"
						src=""
						alt={project.featuredImage.node.altText}
						srcset={project.featuredImage.node.srcSet}
					/>
				</a>
			</InViewBlock>
		{/each}
	{/if}
</div>

<div class="featured grid-row:1/2 gabX:col" bind:this={poulie[0]}>
	{#if !$SiteInfos.isFetching}
		<div class="bg:var(--code-background-color) p:20 sticky top:0 z:10 ">
			{@html $SiteInfos.data.themeGeneralSettings.siteOptions.textIntroNoise}
		</div>

		{#each $SiteInfos.data.themeGeneralSettings.siteOptions.pinnedProjects as project}
			<InViewBlock>
				<MagicWrapper config={{ img: false }} {project} />
			</InViewBlock>
		{/each}
		<div
			class="{'{p:1.5em;flex-basis:full;fg:white;text-decoration:none}>a'} t:center ai:center jc:center f:12 flex flex:row "
		>
			<a href="/projets" class="fg:white  text-decoration:none:hover">
				Retrouvez <br />
				nos autres <br />
				<span class="udlPerm">projets</span>
			</a>
			<a class="bg:var(--primary) fg:white text-decoration:none:hover" href="/savoir-faire">
				En savoir<br />
				un peu plus sur<br />
				<span class="udlPerm ">nos savoir-faire</span>
			</a>
		</div>
	{/if}
</div>

<style>
	.cards {
		grid-column: 1/-1;
	}
	.featured {
		background-color: var(--code-background-color);
		z-index: 4;
		margin-bottom: calc(-1 * var(--footerHeight));
		position: sticky;
		height: calc(100vh - var(--headerHeight));
		top: var(--headerHeight);
		overflow: auto;
	}
</style>
        `
    }, css)).toStrictEqual([
        'grid-row:1/2',
        'flex',
        'flex:col',
        'gabX:full',
        'w:100%',
        'aspect:16/9',
        'obj:cover',
        'gabX:col',
        'bg:var(--code-background-color)',
        'p:20',
        'sticky',
        'top:0',
        'z:10',
        '{p:1.5em;flex-basis:full;fg:white;text-decoration:none}>a',
        't:center',
        'ai:center',
        'jc:center',
        'f:12',
        'flex:row',
        'fg:white',
        'text-decoration:none:hover',
        'bg:var(--primary)'
    ])
})