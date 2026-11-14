# Motion

Motion should explain a change, respond to input or preserve orientation. If the change remains confusing without animation, fix the structure or state feedback first.

## Respond directly

Keep typing, pointer movement and repeated control input immediate. Use transitions to show relationships such as an opening region or an item's completion, with the identity and focus of that item preserved.

Choose timing for distance, frequency and purpose. A routine row highlight should not trail the pointer. A first entrance may use more expression than a repeated update. Reuse a small timing vocabulary; avoid unrelated durations across neighboring controls.

## Handle interruption

A person can reverse an action before its transition finishes. Test open-close-open, rapid selection and theme changes. Retarget from the current state where possible, and cancel stale completion handlers so a finished animation cannot close a newly reopened surface.

Reserve space for changing labels and icons. Motion must not cause a layout jump that moves the next target. Avoid animating everything through a broad transition rule.

## Respect preferences

With reduced motion, remove unnecessary travel, scale, blur and repeated movement while keeping state understandable. Test the resulting resting state as well as the animation rule; disabling a transition can still leave a sudden transform. No important action should depend on waiting for an animation.

## Choose what changes

Use movement to connect positions, opacity to change visibility, and immediate state feedback when speed matters more than a transition. A height animation may move surrounding controls; a transform changes paint without reserving layout space. Neither is universally better. Choose against the task and inspect the effect on the next target.

A state transition must not become a timer that decides whether work succeeded. Completion comes from the operation's result. If an animation is cancelled or reduced motion makes it instantaneous, the state machine must still reach the correct result.

## Compare interrupted paths

Keep distance, duration and easing the same when comparing reversal mechanisms. Reverse before arrival and observe whether the object continues from its current position or jumps to a fixed endpoint. Test rapid real input as well as a controlled intermediate reversal. A screenshot of endpoints cannot establish continuity.

## Review

Check initial render, interruption, keyboard, touch, disabled input and asynchronous updates. Record actual behavior rather than judging only an exported video. See [motion craft](../motion.md) for reversal and state-identity mechanisms.

## Separate preference, time and ongoing content

Reduced motion controls animation preference; it does not extend a timed task.

Avoid flashing. WCAG 2.3.1 permits no more than three flashes in any one-second period or flashing below its general/red thresholds; a subjective preview is not a threshold analysis. Use static explanations rather than hazardous demonstrations. Automatically playing audio lasting more than three seconds needs pause/stop or volume control independent of overall system volume. See [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [media](media.md).

For a content-imposed time limit, provide the applicable off, adjustment or extension option before expiry. The extension path warns with at least 20 seconds to respond and permits at least ten extensions; exceptions include real-time events, essential timing and limits longer than 20 hours. Read [2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) for exact conditions. Preserve entered work when a session must end; do not pretend a visual countdown controls a server's authorization.
