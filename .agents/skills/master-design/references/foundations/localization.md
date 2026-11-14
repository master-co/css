# Localization

An interface must adapt to the language, writing direction and formats of its audience without changing the task. Translation is one part; layout, input, sorting, dates and examples also carry assumptions.

## Let language shape the space

Use real strings in representative scripts, including long labels and mixed-script names. Do not assume every translation is a fixed percentage wider. Let controls grow or wrap where their interaction permits; keep essential wording rather than truncating away the distinction between options.

Choose fonts that support the intended regional glyphs, and set the correct document language. A fallback font may change line height and visible weight. See [typography](typography.md) and [typographic craft](../typography.md).

## Respect direction

Use logical start/end relationships for margins, padding and alignment. In a right-to-left interface, navigation progression may reverse while a chart's time axis or a playback symbol follows its own convention. Mirror meaning deliberately instead of flipping every asset.

Isolate user-provided text with appropriate bidirectional markup when names, identifiers and punctuation may mix directions. Test a Latin filename inside an Arabic sentence. Reading order, focus order and the action's meaning must agree after the composition changes.

## Format for interpretation

| Data | Decision to make |
| --- | --- |
| Date and time | Locale format, time zone and whether relative time needs an exact alternative |
| Money | Currency as well as amount; decimal and grouping separators |
| Number | Precision, units and treatment of missing values |
| Name or address | Fields justified by the task rather than one country's structure |
| Sorted content | Locale-aware collation where people expect linguistic order |

Store and transfer values independently of display formatting. A readable date is not automatically a valid machine input. Do not treat a numeric-looking identifier as an arithmetic value or discard leading zeros.

## Preserve input

Avoid treating Enter during an unfinished IME composition as submission or accepting a suggestion. Paste, autofill and alternative input are normal paths. Do not reject valid names merely because they do not fit an English alphabet or first-name/last-name assumption.

## Verify

Complete a form and search in a mixed-script locale, repeat in RTL, and inspect a long translated label at narrow width. Check punctuation, cursor behavior, selection, sorting, dates, copied values and focus order. Use the [W3C internationalization guidance](https://www.w3.org/International/techniques/authoring-html) for platform details; language-specific typography remains contextual.

For temporal entry, distinguish [dates, instants, durations and ranges](../patterns/date-time.md); formatting alone does not decide which control or time zone is appropriate.
