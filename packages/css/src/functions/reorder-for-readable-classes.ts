import { Layer, CoreLayer } from '../layer'
import type { Config } from '../config'
import { MasterCSS } from '../core'

/**
 * Sorts classes in a consistent order
 * @param classes
 * @param config
 * @returns consistent classes
 */
export default function reorderForReadableClasses(classes: string[], config?: Config) {
    if (!classes.length) return
    const css = new MasterCSS(config)
    for (const eachClass of classes) {
        css.insert(eachClass)
    }
    return css.rules
        .sort((a, b) => {
            if (a.config.layer === CoreLayer.Semantic && b.config.layer !== CoreLayer.Semantic) {
                // 如果 a 是 CoreLayer.Semantic 而 b 不是，则 a 应该排在 b 前面
                return -1
            } else if (a.config.layer !== CoreLayer.Semantic && b.config.layer === CoreLayer.Semantic) {
                // 如果 b 是 CoreLayer.Semantic 而 a 不是，则 b 应该排在 a 前面
                return 1
            } else if (a.config.id !== b.config.id) {
                return a.config.id.localeCompare(b.config.id)
            } else {
                // 檢查 vendorSuffixSelectors 是否存在
                const aHasVendorSuffix = a.vendorSuffixSelectors?.['']?.[0]
                const bHasVendorSuffix = b.vendorSuffixSelectors?.['']?.[0]

                // 檢查 media.token 是否存在
                const aHasMediaToken = a.media?.token
                const bHasMediaToken = b.media?.token

                if (a.priority === -1 && b.priority === -1) {
                    // 如果 a 和 b 都有 vendorSuffixSelectors 或 media.token，則按照以下規則排序
                    if (aHasVendorSuffix && bHasVendorSuffix) {
                        return aHasVendorSuffix.localeCompare(bHasVendorSuffix)
                    }

                    // 如果 a 和 b 都有 media.token 且不包含內建已處理過排序的，則按照以下規則排序
                    if (aHasMediaToken && bHasMediaToken && !Object.keys(a.media.features || {}).length && !Object.keys(b.media.features || {}).length) {
                        return aHasMediaToken.localeCompare(bHasMediaToken)
                    }

                    if (aHasVendorSuffix && !bHasVendorSuffix) {
                        return 1
                    } else if (!aHasVendorSuffix && bHasVendorSuffix) {
                        return -1
                    }

                    if (aHasMediaToken && !bHasMediaToken) {
                        return 1
                    } else if (!aHasMediaToken && bHasMediaToken) {
                        return -1
                    }
                }

                // 再按照 rule.order 本身來升序排列
                return a.order - b.order
            }
        })
        .map(eachRule => eachRule.className)
}