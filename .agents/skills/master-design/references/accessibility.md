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

Honor reduced motion and retain a static state cue. Avoid automatically expiring messages that contain the only way to recover an action.

## Verify a real task

Check keyboard entry, submission, error correction, success and exit; test focus after content changes. Run automated checks for detectable issues, then inspect reading order, labels and announcements with a screen reader. Record the actual browser, assistive technology and conditions. Browser emulation is not a physical-device or screen-reader test.

The normative source is [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Use [APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) to select expected widget behavior, and read [APG's support limitations](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/) before treating an example as production-ready.

## Check beyond the resting screenshot

Use the feature routes below to find the relevant authentication, gesture, timing and text-growth conditions. Keep criterion applicability explicit; a preferred target size is not a universal conformance rule.

## Review an assembled flow

Choose a [reading](studies/reading.md), [service](studies/service.md) or [workspace](studies/workspace.md) journey that matches the task. Record which reading order, labels, focus transitions and announcements were actually inspected, and which require a supported assistive-technology environment.

## Route checks by the actual feature

| Trigger | Required decision or route |
| --- | --- |
| Repeated navigation/content blocks | Provide a practical bypass such as a visible-on-focus skip link to main content; test its focus destination (2.4.1) |
| Pages within a set | Offer more than one locating mechanism, except steps/results of a process; navigation plus search or an appropriate index can work (2.4.5) |
| Instructions about position, sound, shape or color | Also identify the control/action by meaningful wording (1.3.3) |
| Orientation | Do not restrict portrait/landscape unless a specific orientation is essential (1.3.4) |
| Personal information and authentication | Use recognized input purposes; permit password managers/paste and a path satisfying 3.3.8's cognitive-test conditions and exceptions; see [access](patterns/access.md) |
| Images, audio or video | Choose alternatives by content and purpose, not file extension; see [images](images.md#match-the-alternative-to-the-role) and [media](foundations/media.md) |
| Hover/focus popup | Check dismissal, pointer reach and persistence; see [overlays](components/overlays.md#keep-hover-content-reachable) |
| Shortcuts, gestures, dragging or device motion | Test the distinct input alternatives in [focus](focus.md#offer-complete-alternatives) |
| Time limits, flashing or audio | Apply the separate conditions in [motion](foundations/motion.md#separate-preference-time-and-ongoing-content) |
| Focus/input changes | Avoid unexpected context changes; see [content](foundations/content.md#support-recognition-and-predictable-choices) |
| Prior answers or consequential submissions | Preserve/reselect information and provide appropriate correction, review or reversal; see [forms](patterns/forms.md#preserve-work-through-changing-branches) |

For accessible authentication (3.3.8), a cognitive function test needs a qualifying alternative, assistance mechanism or applicable object-recognition/personal-content exception. Do not require memorization or transcription while blocking paste and password managers. Check the full criterion for the specific flow; a password field's presence alone neither proves nor disproves compliance.

## Test content growth

For text-spacing overrides (1.4.12), test line height at least 1.5 times font size, following-paragraph spacing at least twice font size, letter spacing at least .12 times font size and word spacing at least .16 times font size, without losing content or functionality. Apply the criterion's language/script exceptions; these are user override tests, not required default typography.

Test 200% text resizing separately from zoom/reflow. A 320 CSS-pixel viewport exercises one reflow condition; changing the root font size is not proof of browser zoom behavior. Inspect closed/open popups, errors and controls after growth. Automated checks and this routing table do not establish whole-product conformance.
