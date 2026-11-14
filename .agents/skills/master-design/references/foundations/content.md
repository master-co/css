# Content design

Words are part of the interaction. They identify objects, set expectations, explain constraints and help people recover. Write the information needed for the decision where that decision occurs.

## Name the outcome

Prefer labels that identify the result: Save draft, Send invitation or Download report. Use the same term for the same object across navigation, headings and feedback. Do not alternate between workspace, project and folder unless those are different concepts.

A short label is useful only when it remains specific. Repeated Edit actions need enough context to identify their object. Keep visible wording in the accessible name so speech-input users can refer to what they see.

## Put information at the decision

| Moment | Needed information | Example |
| --- | --- | --- |
| Before input | Requirement, unit or unusual constraint | Upload a PDF, up to 10 MB |
| Before consequence | Affected object and scope | Archive 3 selected projects |
| During waiting | What is happening and available control | Uploading report.pdf; Cancel |
| After failure | What remains and a useful next action | Your draft is kept. Reconnect and try saving again |
| After completion | What completed and what follows | Invitation sent to Maya; View members |

Do not place essential instructions only in placeholders, tooltips or a distant help page. Progressive disclosure can defer expert explanation, but must not hide cost, permissions or consequences.

## Explain uncertainty honestly

Distinguish a confirmed failure from an unknown result. A timeout does not prove that a payment or save failed. Describe what is known and provide a way to check status before repeating consequential work. Keep technical diagnostic details available to support without making them the primary user instruction.

Avoid blaming the person for a system problem. State which value needs correction and how, rather than only saying Invalid input. A service outage should not display a field-level error.

## Write for variation

Use complete translatable messages instead of concatenating fragments whose order may change. Plurals, dates, names and number formats depend on locale. Do not hard-code a line break to make one English label fit. Content may need a short and a long form, but both must preserve meaning.

## Verify

Read controls without surrounding decoration, then walk the complete task. Check consistent names, specific consequences and actionable errors. Try long translations and a screen reader; visible and announced messages should describe the same result without repeated interruption. See [localization](localization.md), [feedback](../components/feedback.md) and [help](../patterns/help.md).

## Support recognition and predictable choices

Keep required formats and prerequisites visible while entering information. Show relevant prior choices instead of requiring recall; use familiar terms and explain necessary specialist vocabulary beside the decision. A returning person should recognize what remains and what already succeeded.

Focus alone must not unexpectedly change context. Changing an input must not unexpectedly navigate, submit or open a new window unless the person was advised beforehand. Updating an adjacent preview is different from relocating the task. Avoid hiding consequential options behind unexplained shorthand. Test a changed form branch and a return after interruption. These practices also draw on the supplemental [COGA guidance](https://www.w3.org/TR/coga-usable/), not additional WCAG AA criteria.
