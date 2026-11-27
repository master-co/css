# Data visualization

Choose a representation for the question, not for visual variety. Establish the unit, population, time range and uncertainty before drawing marks. A chart should make a relationship easier to inspect than the raw values alone.

## Match the question

| Question | Useful representation | Important condition |
| --- | --- | --- |
| Which category is larger? | Aligned bars or a sorted table | A common baseline and consistent units |
| How does a value change? | A line over an ordered axis | Missing intervals must not imply observed data |
| What are the exact values? | A table | Headers, units and useful number alignment |
| How are values distributed? | Histogram or distribution plot | Bin choices and sample size affect interpretation |
| How do two measurements relate? | Scatter plot | Association alone does not explain causation |

Use a text summary when the only question is one fact. Do not add a chart merely to make a dashboard look complete. See [data display](../components/data-display.md).

## Keep comparisons honest

Bar length encodes magnitude, so a truncated baseline can exaggerate differences. A line chart may use a narrower range to reveal variation, but label the range clearly and consider the reader's question. Keep comparable panels on a shared scale or make scale differences unmistakable.

Area and volume are harder to compare precisely than aligned positions. Avoid decorative perspective that distorts the encoded value. Highlight an important series without making the others unreadable.

## Show limits in the data

Distinguish zero, missing, withheld and not applicable. A value below a detection or reporting limit is none of these: keep the comparator, the limit and the unit together, such as < 0.5 mg/L, and do not plot it as zero or drop it from a total without saying so. Show intervals or other appropriate uncertainty indicators when the data requires them, and explain what they mean. A precise decimal does not make an estimate precise.

Keep aggregation and denominator visible: 20 completed out of 25 is different from 20 out of 200. Label the period and source. When the data stops at a cutoff that differs from when the view was generated or refreshed, show both; a page refreshed this morning may describe yesterday. When filters change the population, update the title, count and summary together.

## Say what a change means

A change between two percentages has two readings. Moving from 40% to 45% is 5 percentage points and also a 12.5% relative increase; name which one a delta reports, and give both when readers may compare them. Name the comparison as well: against the previous period, the same period last year or a target.

Direction and desirability are separate facts. A falling error rate is an improvement; a rising cost may not be. State the direction and, when it matters, whether the change is good, rather than letting an arrow or a red/green color carry the judgment. Keep the color for desirability consistent across a view, and pair it with words.

## Make values available

Use direct labels, line patterns or symbols alongside color. Provide a concise textual conclusion and a table or other accessible route to important values. A hover tooltip cannot be the only place to inspect data; support keyboard and touch access when inspection is interactive.

## Verify

Recompute displayed totals from the same records as the chart. Test all-zero data, missing points, negative values, a value below its detection limit, a decrease that is an improvement, long labels and a narrow viewport. Check that changing a filter updates every dependent representation. Read the chart without color and without tooltips; the main conclusion should remain available. Apply the [WCAG use-of-color guidance](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) without treating it as proof of statistical correctness.

## Keep encoding tied to meaning

Use distinct categorical colors for named groups, an ordered lightness progression for magnitude, and diverging encoding only around a meaningful midpoint such as zero change. A midpoint is not decoration. Keep a category's identity stable when filtering or sorting; assign colors by stable identity rather than current array position. Do not impose a new palette on the project.

Label series and units directly where practical; keep a readable legend and source/time context where needed. Color alone cannot carry the distinction: use labels, shapes or patterns as appropriate. Test one category, reordered series, missing values and both themes. A data table provides values but may still need a text summary of the chart's conclusion. See [USWDS visualization guidance](https://designsystem.digital.gov/components/data-visualizations/) and [Carbon palettes](https://www.carbondesignsystem.com/building-blocks/data-visualization/color-palettes).
