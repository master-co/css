import CSSExtractor from '../../src'

test('AristideBH', async () => {
    const extractor = new CSSExtractor({ cwd: __dirname, include: ['**/test.svelte'] }).init()
    await extractor.insert('test.svelte',
        `
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
        `)
    expect(
        Object.keys(extractor.css.ruleBy)
    ).toEqual([
        'grid-row:1/2',
        'flex',
        'flex:col',
        'w:100%',
        'aspect:16/9',
        'obj:cover',
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