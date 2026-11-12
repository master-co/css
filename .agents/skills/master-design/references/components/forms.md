# Fields and forms

A field combines a label, input, optional help and validation feedback. Treat them as one relationship so a person can understand what to enter and recover without losing work.

## Use the appropriate input

Prefer a native text, email, number, date or selection control when it meets the task. Use the input type, autocomplete and input mode that support actual data entry. Do not use numeric input for identifiers merely because they contain digits; leading zeros and non-arithmetic values may matter.

Keep a visible label. Placeholder text can demonstrate format but disappears after entry and is not a substitute for a label. Put essential constraints before submission, close to the field they affect. Explain units and expected formats without requiring a person to infer them from a suffix alone.

## Validate helpfully

Distinguish required, disabled, read-only, invalid and busy states. Avoid announcing errors before a person has had a reasonable chance to complete a field. On submission, identify errors near the inputs and provide a summary when several fields need attention.

Associate help and error text programmatically. Preserve entered data and focus the first actionable problem or a useful summary according to the flow. A red boundary alone is insufficient; explain how to correct the value. Clear the error when its condition is resolved without erasing unrelated feedback.

## Handle content growth

Let labels, help and errors wrap. Keep an error from displacing an adjacent control unpredictably. Group related fields with meaningful structure such as fieldset and legend where appropriate. Do not force an entire long form into one card or one fixed-height panel.

## Verify

Complete the form with keyboard, touch and a screen reader. Test autofill, paste, long values, submission by Enter, multiple errors and retry. See [form flows](../patterns/forms.md). Master UI implementations include [Input](https://ui.master.co/components/input) and [Select](https://ui.master.co/components/select); application validation still belongs to the product.
