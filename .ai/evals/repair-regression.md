# Reject regressive repair proposals

This follows the [host recheck investigation](repair-recheck.md). The remaining
case was `seed-05-gpt-6-luna-b`: a hover import with six initial failing checks,
14 failures after the first repair and 20 after the second.

## Failure mechanism

The first model turn recognized a layer conflict but inserted `bg-blue-700` as an
unconditional utility. After lint reported conflicting background classes, it
removed the resting `bg-blue-600` utility and placed that resting declaration in
components. The unconditional blue-700 utility still won outside hover. Build and
lint passed while rest/focus/disabled/touch behavior regressed. The second turn
recognized the resting-color error but restored the original Tailwind markup,
reintroducing ten unsupported class names and losing the migration check.

The old host loop correctly reported these failures, but **continued from the
regressed candidate**. Its next-turn feedback was fresh, yet its working files
already contained the bad change. It also summarized new failures by check ID;
a new failing property inside an already failing viewport/state check would not
appear as a new check. The complete raw differences were present, but there was
no adoption gate or retained source to prevent compounding the regression.

## Adoption rule

`repair-regression.mjs` compares the current candidate with the last retained
checkpoint, using the unchanged browser/class evaluator. It distinguishes:

- Property failures by check ID, node index and property name.
- Unresolved classes by class spelling.
- Other failures by check ID.

Reject any new failure, even when the total failure count falls. Reject missing,
added or duplicate check coverage, changed expectations for an existing property,
unverified execution, and proposals that resolve nothing. A partially successful
proposal is adopted only when its measured failure set is a strict subset of the
retained set. A final pass still requires every original functional, styling,
accessibility and browser check. This is a conservative adoption policy, not a
CSS semantic fallback, numeric-distance optimizer or proof about unmeasured states.
Changes to an already failing value are not assigned an improvement score.

## Isolated proposal workflow

Each model attempt receives a fresh copy of the retained workspace. The host
records its input hashes and a unified diff of the three editable files, rebuilds
and runs all checks, then records an explicit adoption/rejection decision. No
candidate edits the retained workspace in place. A rejected candidate's files,
full evidence, diff, answer and failure details remain archived. The next attempt
starts from retained sources and receives the rejection reason and a bounded diff
(up to 16,000 characters, with a truncation marker). The complete diff remains in
the artifact. Accepted partial progress becomes the next retained checkpoint.

The prompt asks for a focused patch, preservation of working classes and passing
states, and treats source.html as a behavior reference rather than replacement
markup. These instructions help propose changes; the host's measured adoption
rule enforces the boundary. Protected-file/source/tool checks remain in place.
The runner emits a distinct `retained.work` and reports every rejected proposal;
it never describes a rejected candidate as the final repaired state. Exhaustion
leaves the retained failures explicit. Infrastructure or coverage uncertainty
stops with `unverified`, even if the retained snapshot is still available.

## Validation protocol

```sh
node --import tsx scripts/ai-authoring/trials/guarded-run.mjs --source /absolute/prior-recheck-run --case seed-05-gpt-6-luna-b --replay-only
node --import tsx scripts/ai-authoring/trials/guarded-run.mjs --source /absolute/prior-recheck-run --case seed-05-gpt-6-luna-b --attempts 2
```

Replay the original checkpoint and both archived bad proposals with current,
frozen artifacts and the unchanged evaluator. Compare both bad proposals to the
original retained checkpoint. Do not alter old verdicts or source archives.
Then give the originating Luna model at most two fresh 120-second attempts from
that same initial checkpoint, with the original skill and CLI. Freeze code,
model arguments and tools before model invocation; record any artifact drift
from the prior run. Verify proposal copies, retained-source integrity, diffs,
coverage decisions, source-bound feedback and usage against raw events.

This is one targeted case with revised guidance and extra repair opportunities,
not an A/B estimate or a general success-rate claim. The retained original is
still a failing implementation; preserving it does not mean the bug was fixed.
No public CLI/MCP API, official skill, compiler behavior or scoring threshold is
changed. The earlier recheck runner remains available without this opt-in policy.
