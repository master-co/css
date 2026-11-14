# Dates, times and ranges

Establish what the value means before choosing a calendar. A birthday is a civil date; a meeting is an instant interpreted in a zone; a duration is elapsed time. Converting all three through the same timestamp can change their meaning.

## Choose entry or selection

| Task | Useful starting point |
| --- | --- |
| Remembered or copied date | Clearly labeled typed fields or a suitable native input; avoid paging through decades |
| Available appointment or booking | Calendar/list selection showing availability, with an efficient entry route where appropriate |
| Exact time | Labeled entry with understandable format and relevant time zone |
| Duration | Quantity with explicit units, not a time-of-day clock |

Keep the project's established date controls when they meet the task. A custom calendar needs full keyboard, focus and naming behavior; its visual polish does not justify replacing a usable native control. Compare [GOV.UK dates](https://design-system.service.gov.uk/patterns/dates/) and [USWDS date picker](https://designsystem.digital.gov/components/date-picker/).

## State the interpretation

Show an example of the accepted format rather than an ambiguous numeric placeholder alone. Distinguish display formatting from stored meaning. Preserve a date-only value as a date when changing locale or zone. For an instant, identify the relevant zone and explain whether changing it preserves the instant or the displayed wall-clock time.

Define range endpoints: inclusive days, checkout day, or exact instants. Explain unavailable dates before commitment. For a zone's repeated or nonexistent local time, request an unambiguous choice instead of silently selecting an offset. Relative dates such as Tomorrow need an exact interpretation when ambiguity affects the task.

## Preserve entry

Keep invalid text available for correction, associate errors with the field/group and retain unrelated input. Do not normalize a partial date on every keystroke. Accept the task's legitimate past/future range rather than imposing an arbitrary “recent” limit. Test paste, keyboard and actual software-keyboard behavior where supported.

## Acceptance scenario

Enter a remembered birthday, select an available booking range, correct an ambiguous numeric date and change a displayed time zone. Verify preserved civil dates, meaningful endpoint labels, invalid-input recovery and no silent change of the intended instant. A local specimen demonstrates interface decisions; real calendar/zone integration needs its own data validation.
