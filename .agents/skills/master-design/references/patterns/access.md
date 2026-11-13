# Authentication and permissions

Explain what access is needed and preserve the task around interruptions. Authentication establishes identity; permission determines what that identity can do. A locked account, expired session and unavailable feature require different recovery paths.

## Ask in context

Explain why access is needed before requesting it. Ask for the minimum information relevant to the task, and make optional permissions distinct from required access. A declined optional permission should lead to a useful alternative where one exists.

Support password managers, paste and appropriate autocomplete. Do not make remembering or transcribing information the only route when an accessible alternative is required. Follow [WCAG accessible authentication](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) and the platform's current security guidance; this chapter defines interaction expectations, not an authentication protocol.

## Preserve the intended destination

After sign-in, return to the intended permitted task rather than an unrelated home screen. If a session expires during editing, explain the interruption and retain work where the product can do so safely. Do not imply that unsaved work reached the server.

A reauthentication dialog must not reveal confidential data to a different signed-in account. State when a changed identity means the original draft cannot be resumed. Products must define their actual data-handling boundaries.

## Explain capability

| Condition | Useful response |
| --- | --- |
| Not signed in | Explain the needed access and offer sign-in |
| Session expired | Reauthenticate and preserve appropriate task context |
| Signed in without permission | Explain the unavailable operation and a valid request-access route |
| Optional device permission declined | Offer a supported manual alternative |
| Access removed during work | Prevent unsupported actions and explain what can still be recovered |

Hiding or disabling a control is not access enforcement. Interface feedback must agree with the application's actual permission checks. Avoid displaying unavailable actions as ordinary working links.

## Acceptance scenario

Open a permitted deep link while signed out, sign in and return. Expire a session during editing, retry after authentication, then repeat with insufficient permission and with a different identity. Check truthful save status, focus, back navigation and a useful exit. See [editing](editing.md) and [recovery](recovery.md).
