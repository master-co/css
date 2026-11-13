# Focus and input craft

Focus is the current keyboard destination, not a decorative version of hover or selection. Preserve its identity as controls open, update, move and disappear.

## Follow the task

Ordinary page controls follow a meaningful Tab order. Composite widgets may use arrow keys internally when their established pattern requires it. Choose the correct semantics first; a list of links does not become an ARIA menu merely because it is visually compact.

Opening a modal moves focus to a useful element inside, makes background interaction unavailable and restores focus on close. For a long structured dialog, focusing the title or introduction may be more useful than jumping directly to the first input. A nonmodal disclosure usually leaves focus on its trigger until the person moves onward. Consult the relevant [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/).

## Survive change

Keep focus on a stable control during ordinary result updates. After deleting a focused row, move to a logical neighboring action or the collection heading when no rows remain. Do not return focus to a detached trigger. Match state and identity by record, not array position.

Focus placement after validation depends on context: an error summary can explain multiple issues, while a single local correction may suit its field. Avoid moving focus again when background feedback arrives after the person has already continued.

## Preserve complete input

Activate ordinary actions on the platform's completed activation, not on pointer-down alone. A pointer can leave, cancel or turn into scrolling. Do not interpret touch scrolling as a completed press. Native buttons already coordinate keyboard and pointer activation.

During IME composition, Enter can commit text rather than submit a form. Preserve paste, selection and autofill. Dragging interactions need a non-drag alternative where the task requires one; making a target large does not make a drag accessible.

## Draw focus where it survives

A mask, clipping ancestor or overflow boundary can remove an otherwise strong ring. Keep the indicator on an appropriate unmasked part, reserve room or change the clipping arrangement. Focus and selection must remain distinguishable together, including forced colors. A wider decorative shadow is not automatically a focus indicator.

## Verify

Complete the task with Tab, Shift+Tab, activation and the pattern's arrow keys. Open and dismiss overlays, delete the focused item, cancel a pointer action and submit mixed-script input. Inspect focus at scroll boundaries and beneath sticky regions. Record actual browser and assistive-technology behavior; a visible ring alone does not prove a correct focus sequence. See [states](states.md) and [scrolling](scrolling.md).
