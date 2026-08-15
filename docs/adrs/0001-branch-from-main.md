---
id: ADR-0001
title: Working branches are cut from main
status: accepted
scope: [repo]
created: 2026-08-14
updated: 2026-08-14
authors: [esalazarv]
related:
  rfcs: []
  specs: []
  adrs: []
---

# Working branches are cut from main

## Context

The release pipeline is git-flow shaped: working branches merge into `develop`,
which publishes prereleases on the `beta` dist-tag; `develop` merges into
`main`, which graduates and publishes on `latest`.

**This is not a change in practice.** The repository already worked this way —
`ci/update-cd`, for example, was cut from `0944237`, `main`'s tip at the time.
What was missing was the decision being written down, which is why it was
re-derived twice in one week while fixing unrelated defects, and why branches
created by a newcomer to the repository were cut from `develop` by default.
Recording it is the point of this document.

The question surfaced because `develop` was repeatedly stale. `lerna version`
commits the graduated versions onto `main` during `publish_stable`, and nothing
carried them back, so every prerelease was computed from an out-of-date base and
sorted **below** the stable it came from. That is a separate defect, fixed by
automating the back-merge. It matters here only because it made the branch point
look like the cause when it was not: the practice was already correct, and the
pipeline was what needed fixing.

Two arguments for the existing practice were examined and found sound:

- Conflicts between concurrent features are independent of the branch point.
  Branching from `develop` does not avoid them, it only surfaces them earlier.
- Unreleased work on `develop` should not block a working branch. Prereleases
  are explicitly unstable and are published on a separate channel precisely so
  that they are not treated as committed.

One argument raised **against** it was wrong and is recorded here so it is not
repeated: that two branches cut from `main` would conflict with each other over
the release commit. They do not. It is the same commit with the same hash, so
once the first branch lands, git treats it as a common ancestor and the second
sees no conflict.

## Decision

Working branches are cut from **`main`**.

They open pull requests against `develop`, which remains the integration branch
and the source of prereleases. Only the branch point is being stated; nothing
about the merge flow changes.

Hotfixes were already required to come from `main`, so the normal case is
consistent with them rather than an exception.

## Consequences

A working branch starts from released code, so what it contains is exactly what
consumers have. Nothing unreleased is inherited, which means a broken or
abandoned change on `develop` cannot contaminate unrelated work.

Integration feedback moves later. A branch does not carry other people's
in-flight work, so interactions between two unreleased changes are discovered
when the second one merges rather than while it is being written. This is
accepted deliberately: the beta channel exists to expose that instability, and
treating it as blocking would defeat the point of publishing it separately.

**Work that builds on unreleased work must still branch from `develop`.** If the
code or document being changed does not exist on `main` yet, `main` is not a
possible starting point. This is not hypothetical: the pull request that added
this ADR had to come from `develop`, because `docs/` had been merged to
`develop` and not yet graduated. The rule is "branch from `main` when you can",
not "never branch from `develop`".

The first working branch to merge after a graduation carries the release commit
into `develop` as a side effect, so its diff includes version bumps and
changelog entries it did not author. This is cosmetic and happens once per
release. It does not replace the automated back-merge: the back-merge runs
immediately and does not depend on someone happening to open a pull request.

## Alternatives

**Branch from `develop`.** The git-flow default. Rejected on the reasoning
above: its main benefit is early integration feedback, and that benefit is worth
less here than a predictable base, given prereleases are explicitly unstable.
Its cost is that every branch inherits unreleased work whether or not it wants
it.

**Branch from `main` and merge back to `main`, dropping `develop`.** A simpler
trunk-based model. Not considered in depth: it would remove the beta channel,
which consumers currently use to validate ahead of a stable release, and that
channel has already caught real defects before they reached `latest`.
