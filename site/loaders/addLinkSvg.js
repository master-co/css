const tagMap = {
	'h2': new RegExp('<h2([^>]*) id="(.*?)"([^>]*)>(.*?)</h2>', 'gms'),
	'h3': new RegExp('<h3([^>]*) id="(.*?)"([^>]*)>(.*?)</h3>', 'gms')
};

module.exports = function addLinkSvgLoader(source, map) {
	this.cacheable();

	let newSource = source;

	let replaced = false;
	for (const tag in tagMap) {
		const regexp = tagMap[tag];

		newSource = newSource.replace(
			regexp,
			(_, r1, r2, r3, r4) => {
				replaced = true;
	
				return `
					<${tag}${r1} id="${r2}"${r3}>
						<AddLinkSvg className="fill:gray-60@dark fill:fade-50 abs inset:0 ml:-36 my:auto contain:strict invisible"/>
						<a href="#${r2}">${r4}</a>
					</${tag}>`;
			});
	}

	if (replaced) {
		newSource = 'import AddLinkSvg from \'~/public/icons/add-link.svg\';\n' + newSource;
	}

	this.callback(null, newSource, map);
}