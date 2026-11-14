# Media and alternatives

Choose alternatives for the information conveyed, not just the media format. Meaningful speech, sound and visual events have different needs. A transcript does not automatically replace captions or audio description.

## Choose the alternative

| Content | A/AA starting requirement under WCAG 2.2 |
| --- | --- |
| Prerecorded audio-only | Equivalent time-based-media alternative, unless clearly labeled as an alternative for text (1.2.1) |
| Prerecorded video-only | Equivalent alternative or an audio track presenting equivalent information, with the text-alternative exception (1.2.1) |
| Prerecorded synchronized media with audio | Captions, subject to the text-alternative exception (1.2.2); audio description or media alternative at A (1.2.3), and audio description at AA (1.2.5) |
| Live synchronized media with audio | Captions (1.2.4); do not assume a later transcript meets the live requirement |

Description conveys important visual information not already available in the main audio. Captions include meaningful non-speech sound and speaker identity where needed. A transcript supports scanning and reference, but does not synchronize words with the video. Read the specific content applicability in [WAI media guidance](https://www.w3.org/WAI/media/av/) and [WCAG](https://www.w3.org/TR/WCAG22/).

## Keep playback operable

Prefer a supported native or established accessible player. Name Play/Pause, captions, volume and seeking controls; expose current value/state, keyboard access and visible focus. Avoid unexpected playback. Automatic audio beyond three seconds needs a pause/stop control or independent volume control. Keep transcript and alternatives reachable even if the player fails.

Do not cover captions with controls or crop out essential visual information. Test the actual media and player with keyboard and supported assistive technology; a diagram of controls cannot prove player behavior.

## Sequences and ongoing content

A carousel needs a meaningful current-item label, reachable previous/next controls and stable focus. Prefer manual advance when automatic movement is unnecessary. Do not repeatedly announce unsolicited slide changes.

Apply [time-limit, audio and flashing conditions](motion.md#separate-preference-time-and-ongoing-content) independently from reduced motion. See the [WAI carousel tutorial](https://www.w3.org/WAI/tutorials/carousels/). A manual image sequence is a valid counterexample to requiring an automatic rotation timer.

## Verify

Inspect meaningful audio without sight, visual information without sound, caption synchronization, controls at enlarged text and a failed media load. Record actual player/browser/AT results. A static illustration can teach the choice of alternative but cannot establish caption quality or audio-description completeness.
