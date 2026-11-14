# AI-assisted interfaces

Explain what the assistance can do and what remains the person's decision. Use this guidance only for an AI feature; ordinary editing and search do not need an artificial assistant layer.

## Establish capability and context

Identify generated suggestions and relevant limitations in useful language. Explain what selected text or other context the feature uses, especially when the choice changes disclosure or scope. Offer the ordinary workflow when assistance is optional. Do not invent confidence percentages, citations, provenance or a causal explanation that the system cannot support. See [Apple generative AI](https://developer.apple.com/design/human-interface-guidelines/generative-ai) and [Microsoft HAX](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/).

## Separate suggestion from commitment

Preserve the original and show a suggestion separately until the person explicitly accepts it. Accepting a suggestion, saving the edited document and publishing it are different outcomes. Make reject, edit and supported undo understandable. For consequential actions, show scope and consequences before execution rather than relying on a conversational acknowledgement.

A feedback control can report a problem or preference without claiming that it corrected the model. Provide useful local correction even when feedback has no immediate effect.

## Survive generation and interruption

Distinguish preparing, generating, partial, stopped, failed and complete states. A stop can retain partial content without marking it complete. Retry creates a new request identity; an older result must not overwrite newer edits or a newer suggestion. Preserve work on errors and explain whether a draft was applied.

Announce meaningful milestones instead of every streamed token. Do not fake a percentage when remaining work is unknown. Keep Stop and normal editing reachable; reduced motion does not replace these controls.

## Acceptance scenario

Start a suggestion, stop partway, retry and edit the original while the request is pending. Resolve the older request and verify that it cannot replace the newer work. Reject and accept separately, then undo where supported. Check keyboard, focus and concise announcements. A deterministic local simulation can verify the state contract; it cannot establish model quality, groundedness or actual service performance.
