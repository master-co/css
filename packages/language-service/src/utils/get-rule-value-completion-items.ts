

// if (x.key.includes(key)) {
//     // constant.ts custom values
//     masterCssValues = masterCssValues.concat(
//         x.values.filter(cssValue =>
//             !masterCssValues.find(existedValue => (typeof existedValue === 'string' ? existedValue : existedValue.label) === (typeof cssValue === 'string' ? cssValue : cssValue.label))
//         )
//     )

//     masterCssValues = masterCssValues.concat(
//         originalCssValues
//             .filter((cssValue, index) => cssValue.description || (!cssValue.description && originalCssValues.indexOf(cssValue) === index))
//             .map((cssValue) => ({
//                 label: cssValue.name.replace(/,\s/g, ',').replace(/\s/g, '|').replace(/["']/g, ''),
//                 kind: 10,
//                 documentation: cssValue?.description ?? ''
//             } as CompletionItem))
//             .filter((cssValue: { label: any }) =>
//                 !masterCssValues.find(existedValue => (typeof existedValue === 'string' ? existedValue : existedValue.label) === (typeof cssValue === 'string' ? cssValue : cssValue.label))
//             )
//     )

//     if (css.config?.variables?.[fullKey]) {
//         const masterCustomVariables = Object.keys(css.config?.variables[fullKey])
//         masterCssValues = masterCssValues.concat(
//             masterCustomVariables
//                 .filter(customValue =>
//                     !masterCssValues.find(existedValue => (typeof existedValue === 'string' ? existedValue : existedValue.label) === customValue)
//                 )
//         )
//     }

//     if (x.colored) {
//         isColorful = true
//         const needPushList = masterCssType.find(y => y.type === 'color')?.values.filter(z => !masterCssValues.find(a => (typeof a === 'string' ? a : a.label) === (typeof z === 'string' ? z : z.label)))
//         if (needPushList) {
//             masterCssValues = masterCssValues.concat(needPushList as any)
//         }
//     }
// }