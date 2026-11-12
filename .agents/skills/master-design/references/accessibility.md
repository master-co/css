# Accessibility

Use WCAG 2.2 Level AA as the baseline for web work, alongside native HTML and the relevant WAI-ARIA interaction pattern. A component can support accessibility without proving that every page using it conforms. Verify the assembled task, content and supported browser/assistive-technology combinations.

## Semantics and names

Start with the native element whose purpose matches the task. A link has a destination; a button triggers an action; an input retains its native value and form behavior. Give every control a meaningful accessible name. Visible labels should agree with that name, including repeated row actions with enough context to identify their target.

Associate help and validation text with fields. Use headings and landmarks to express the reading structure. Keep decorative icons out of the accessibility tree; give informative images useful alternatives. Do not add a role without implementing its required keyboard and state behavior.

## Keyboard and focus

Complete the task using only the keyboard. Keep tab order consistent with reading order. Use arrow keys within composite widgets only when their pattern calls for it; do not turn an ordinary list into a menu just to obtain arrow navigation.

Focus must be visible, distinguishable from selection and not entirely hidden by sticky content. Opening a modal moves focus inside, keeps background content inert and returns focus to the invoking control when it closes, or to a logical successor if the control no longer exists. Avoid focus changes for routine asynchronous updates.

## Contrast and state

Normal text needs at least 4.5:1 contrast; large text needs 3:1 under WCAG's definition of large text. Necessary control boundaries, state indicators and meaningful graphical objects need 3:1 against adjacent colors where the criterion applies. Inactive controls have contrast exceptions, but should still be understandable in context.

Check real composited surfaces in both themes. Translucency, gradients and photographs can change the effective background. Use text, shape or position alongside color for success, warning, error and selection. Test forced colors; a shadow-only boundary or masked focus indicator can disappear.

## Targets, resizing and reflow

WCAG 2.2 AA target size is at least 24 by 24 CSS pixels, subject to its spacing and other exceptions. Treat that as a minimum test, not the preferred size for all contexts. Aim for comfortably separated touch targets around 44 CSS pixels where practical. Keep enlarged clickable bounds from overlapping neighboring controls.

Check 200% text resizing without loss of content or functionality. At a width equivalent to 320 CSS pixels, content should reflow without two-dimensional scrolling except for content that requires a two-dimensional layout, such as a data table. Also test zoom, text-spacing overrides, long labels and landscape orientations. A fixed-height control must accommodate its longest supported label.

## Feedback and motion

Keep errors near the relevant input and give an actionable explanation. Announce meaningful asynchronous status without repeatedly interrupting reading. Do not announce each animation frame or each keystroke as a new alert. Loading, empty and failed are distinct states.

Honor reduced motion, retain a static state cue and allow control over nonessential ongoing movement. Avoid automatically expiring messages that contain the only way to recover an action.

## Verify a real task

Check keyboard entry, submission, error correction, success and exit; test focus after content changes. Run automated checks for detectable issues, then inspect reading order, labels and announcements with a screen reader. Record the actual browser, assistive technology and conditions. Browser emulation is not a physical-device or screen-reader test.

The normative source is [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Use [APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) to select expected widget behavior, and read [APG's support limitations](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/) before treating an example as production-ready.
