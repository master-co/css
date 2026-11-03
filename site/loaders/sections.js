const fs = require('fs');

const componentInfoMap = {};
const componentRegexp = /import ([A-Za-z]*)(?: |,(?:.*?))from \'~\/([^.]*?)\'/gm;
const tagNameRegexp = /<([A-Za-z0-9]+)/g;
const h2Regexp = /<h2 id=\"(.*?)\"(?:.*?)>(.*?)<\/h2>/ms;
const h3Regexp = /<h3 id=\"(.*?)\"(?:.*?)>(.*?)<\/h3>/ms;

const getSections = (source, flat) => {
	componentRegexp.lastIndex = 0;
	let results;
	while (results = componentRegexp.exec(source)) {
		let [_, name, path] = results;
		if (!(name in componentInfoMap)) {
			path = './' + path;

			componentInfoMap[name] = { 
				path: (fs.existsSync(path + '.tsx')
					? path
					: path + '/index') + '.tsx'
			};
		}
	}
	
	tagNameRegexp.lastIndex = 0;
	const sections = [];
	let section;
	while (results = tagNameRegexp.exec(source)) {
		const tagName = results[1];
		if (tagName === 'h2') {
			h2Regexp.lastIndex = 0;
			const h2Results = h2Regexp.exec(source.substring(results.index));
			if (h2Results && h2Results.index === 0) {
				sections.push(section = {
					id: h2Results[1],
					name: h2Results[2],
					children: []
				});
			}
		} else if (tagName === 'h3') {
			h3Regexp.lastIndex = 0;
			const h3Results = h3Regexp.exec(source.substring(results.index));
			if (h3Results && h3Results.index === 0) {
				(flat ? sections : section.children).push({
					id: h3Results[1],
					name: h3Results[2]
				});
			}
		} else if (tagName in componentInfoMap) {
			const componentInfo = componentInfoMap[tagName];
			if (!('sections' in componentInfo)) {
				const originLastIndex = tagNameRegexp.lastIndex;
				componentInfo.sections = getSections(fs.readFileSync(componentInfo.path, 'utf-8'), true);
				tagNameRegexp.lastIndex = originLastIndex;
			}

			for (const eachSection of componentInfo.sections) {
				if ('children' in eachSection) {
					sections.push(section = {
						id: eachSection.id,
						name: eachSection.name,
						children: []
					});
				} else {
					(flat ? sections : section.children).push({
						id: eachSection.id,
						name: eachSection.name
					});
				}
			}
		}
	}

	return sections;
};

module.exports = function pageContentLoader(source, map) {
	this.cacheable();

	let newSource = source.replace(/\{\/\*(?:.*?)\*\/\}/gms, '');

	this.callback(
		null, 
		newSource.replace(/\.page = {/m, origin => origin + 'sections:' + JSON.stringify(getSections(newSource, false)) + ','),
		map);
}