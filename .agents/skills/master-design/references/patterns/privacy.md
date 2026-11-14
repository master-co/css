# Privacy, consent and sharing

Explain what information is needed, who can access it and which action changes that access. Keep optional choices genuinely optional. This is interface guidance; actual authorization and jurisdiction-specific obligations require their own implementation.

## Ask in context

Explain the purpose of requested information near the decision. Avoid collecting data simply because a field is easy to add. Distinguish required information from optional preferences and do not visually bury a refusal. An unrelated permission request should not interrupt a task that can proceed without it. See [Apple privacy guidance](https://developer.apple.com/design/human-interface-guidelines/privacy).

## Name the audience

Distinguish private, named-recipient, organization and public/link audiences using the actual service model. Show the object, recipients, role and consequences before applying a change. A broad label such as Share must not conceal publication to everyone.

Keep draft settings separate from confirmed access. Apply success updates the confirmed audience; cancellation and failure leave it unchanged unless the service reports a partial outcome. Copying a link is a separate operation: clipboard success neither changes access nor proves that a recipient can open it. Explain restricted links before people distribute them.

## Support correction

Show current access, pending invitations and a route to remove/revoke access where supported. Revocation may not recall prior downloads or messages; describe the actual effect. When sharing fails or the result is unknown, preserve the intended recipients and check the confirmed state before repeating a consequential operation.

## Acceptance scenario

Change a private item's draft audience, cancel, then apply with a simulated failure. Confirm the prior audience remains. Retry successfully, copy its link and revoke access. Distinguish each outcome in visible status. Use fictional people in examples; a local interaction proves state handling, not real server authorization or legal compliance.
