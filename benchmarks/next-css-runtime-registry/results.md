# Next.js CSSRuntimeRegistry benchmark

- Generated: 2026-06-22T20:16:49.798Z
- Browser: chromium 149.0.7827.55
- Rounds: 15 measured, 3 warmup
- Recommendation: **direct** - Dynamic delayed runtime readiness in 6/6 comparisons without consistent FCP/LCP gains.

## Correctness

| Variant | Smoke | Late class | Errors |
|---|---:|---:|---|
| Direct import | pass | pass |  |
| Dynamic ssr false | pass | pass |  |

## Build Output

| Variant | Route | Build | HTML | style#master-css | Hydration manifest | Hydration rules | Initial JS | Initial JS gzip | Initial JS brotli |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Direct import | / | 6800.17 ms | 8,685 B | 1,550 B | 5,436 B | 26 | 7 / 715,776 B | 209,921 B | 181,336 B |
| Direct import | /stress | 6800.17 ms | 341,488 B | 26,317 B | 187,024 B | 1013 | 7 / 715,776 B | 209,921 B | 181,336 B |
| Direct import | /late | 6800.17 ms | 7,473 B | 396 B | 1,756 B | 9 | 8 / 716,289 B | 210,291 B | 181,649 B |
| Dynamic ssr false | / | 7062.61 ms | 8,760 B | 1,550 B | 5,436 B | 26 | 7 / 630,370 B | 186,585 B | 160,926 B |
| Dynamic ssr false | /stress | 7062.61 ms | 341,563 B | 26,317 B | 187,024 B | 1013 | 7 / 630,370 B | 186,585 B | 160,926 B |
| Dynamic ssr false | /late | 7062.61 ms | 7,548 B | 396 B | 1,756 B | 9 | 8 / 630,883 B | 186,956 B | 161,239 B |

## First Load Medians

| Variant | Route | Profile | TTFB | FCP | LCP | DCL | Load | Runtime created | Runtime hydrated | Runtime observed | Long tasks | JS transfer | Total transfer |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Direct import | / | desktop-cold | 1.00 ms | 20.00 ms | 20.00 ms | 13.40 ms | 39.50 ms | 48.20 ms | 55.80 ms | 55.90 ms | 0.00 ms | 172,094 B | 193,653 B |
| Direct import | / | throttled-mobile | 1.00 ms | 364.00 ms | 364.00 ms | 360.50 ms | 1270.50 ms | 1520.30 ms | 1691.30 ms | 1691.60 ms | 82.00 ms | 172,094 B | 193,653 B |
| Direct import | /stress | desktop-cold | 3.50 ms | 24.00 ms | 24.00 ms | 21.00 ms | 48.10 ms | 58.80 ms | 69.90 ms | 70.00 ms | 0.00 ms | 172,094 B | 235,902 B |
| Direct import | /stress | throttled-mobile | 3.00 ms | 372.00 ms | 372.00 ms | 371.80 ms | 1276.10 ms | 1525.30 ms | 1779.20 ms | 1780.10 ms | 88.00 ms | 172,094 B | 235,902 B |
| Direct import | /late | desktop-cold | 1.10 ms | 16.00 ms | 16.00 ms | 6.20 ms | 38.20 ms | 47.00 ms | 54.70 ms | 56.00 ms | 0.00 ms | 172,907 B | 193,279 B |
| Direct import | /late | throttled-mobile | 0.90 ms | 360.00 ms | 360.00 ms | 356.00 ms | 1277.50 ms | 1527.00 ms | 1696.90 ms | 1704.10 ms | 82.00 ms | 172,907 B | 193,279 B |
| Dynamic ssr false | / | desktop-cold | 1.00 ms | 20.00 ms | 20.00 ms | 6.10 ms | 35.50 ms | 317.50 ms | 322.40 ms | 322.40 ms | 0.00 ms | 173,758 B | 195,371 B |
| Dynamic ssr false | / | throttled-mobile | 0.90 ms | 364.00 ms | 364.00 ms | 360.30 ms | 1145.90 ms | 1744.20 ms | 1912.90 ms | 1913.00 ms | 58.00 ms | 173,758 B | 195,371 B |
| Dynamic ssr false | /stress | desktop-cold | 3.40 ms | 24.00 ms | 24.00 ms | 20.00 ms | 44.30 ms | 315.90 ms | 326.20 ms | 326.40 ms | 0.00 ms | 173,758 B | 237,630 B |
| Dynamic ssr false | /stress | throttled-mobile | 3.10 ms | 368.00 ms | 368.00 ms | 371.30 ms | 1150.40 ms | 1759.10 ms | 2015.70 ms | 2016.10 ms | 64.00 ms | 173,758 B | 237,630 B |
| Dynamic ssr false | /late | desktop-cold | 1.00 ms | 20.00 ms | 20.00 ms | 6.20 ms | 36.30 ms | 317.30 ms | 322.00 ms | 325.20 ms | 0.00 ms | 174,571 B | 195,002 B |
| Dynamic ssr false | /late | throttled-mobile | 0.90 ms | 360.00 ms | 360.00 ms | 355.80 ms | 1152.60 ms | 1746.40 ms | 1919.60 ms | 1927.10 ms | 59.00 ms | 174,571 B | 195,002 B |

## Dynamic vs Direct Delta

Negative deltas mean `dynamic-ssr-false` is faster or smaller. Positive deltas favor direct import.

| Route | Profile | FCP | LCP | Load | Runtime observed | Long tasks | JS transfer |
|---|---|---:|---:|---:|---:|---:|---:|
| / | desktop-cold | +0.00 ms (+0.0%) | +0.00 ms (+0.0%) | -4.00 ms (-10.1%) | +266.50 ms (+476.7%) | +0.00 ms (+0.0%) | +1,664 B (+1.0%) |
| / | throttled-mobile | +0.00 ms (+0.0%) | +0.00 ms (+0.0%) | -124.60 ms (-9.8%) | +221.40 ms (+13.1%) | -24.00 ms (-29.3%) | +1,664 B (+1.0%) |
| /stress | desktop-cold | +0.00 ms (+0.0%) | +0.00 ms (+0.0%) | -3.80 ms (-7.9%) | +256.40 ms (+366.3%) | +0.00 ms (+0.0%) | +1,664 B (+1.0%) |
| /stress | throttled-mobile | -4.00 ms (-1.1%) | -4.00 ms (-1.1%) | -125.70 ms (-9.9%) | +236.00 ms (+13.3%) | -24.00 ms (-27.3%) | +1,664 B (+1.0%) |
| /late | desktop-cold | +4.00 ms (+25.0%) | +4.00 ms (+25.0%) | -1.90 ms (-5.0%) | +269.20 ms (+480.7%) | +0.00 ms (+0.0%) | +1,664 B (+1.0%) |
| /late | throttled-mobile | +0.00 ms (+0.0%) | +0.00 ms (+0.0%) | -124.90 ms (-9.8%) | +223.00 ms (+13.1%) | -23.00 ms (-28.0%) | +1,664 B (+1.0%) |

