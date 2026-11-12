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

## Review

Check initial render, interruption, keyboard, touch, disabled input and asynchronous updates. Record actual behavior rather than judging only an exported video. See [motion craft](../motion.md) for reversal and state-identity mechanisms.
