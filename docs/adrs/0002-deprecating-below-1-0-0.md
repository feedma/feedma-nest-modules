---
id: ADR-0002
title: Deprecating below 1.0.0
status: accepted
scope: [repo]
created: 2026-08-17
updated: 2026-08-17
authors: [esalazarv]
related:
  rfcs: []
  specs: []
  adrs: [ADR-0001]
---

# Deprecating below 1.0.0

## Context

There was no deprecation policy at all, and the obvious one does not transfer.

### The standard declines to give one

Semver's FAQ prescribes: document the change, ship a **minor** carrying the deprecation, let at least one minor cycle pass, and remove in a **major**.

That is written for `1.0.0` and above. Of major version zero, clause 4 says only:

> Major version zero (0.y.z) is for initial development. Anything MAY change at any time. The public API SHOULD NOT be considered stable.

So there is no convention for deprecating below `1.0.0` because the specification deliberately withholds one.

Projects that live there take it at its word. Measured from the registry: `esbuild` is at `0.28.2` after 482 published versions, `drizzle-orm` at `0.45.2` after 562. Neither has deprecated anything. They break in minors and document it.

### Waiting for a major is not an option

These packages are `0.x`, and lerna downgrades a recommended major to a minor while the major version is zero — `feat:` and `feat!:` land on the same version. No major boundary is ever cut, so a policy anchored to one waits forever.

### Consumers cannot be enumerated

An earlier draft of this decision gated removal on *no known consumer still using it*. That presents as a guarantee something which only covers the consumers we happen to know.

These are public packages on npm, pulled between five hundred and a thousand times a week each. The applications in this organisation are a floor, never the whole set.

### What actually protects an unknown consumer

The range they declared. A caret admits changes that do not touch the left-most non-zero component:

| declared | means | admits `0.3.9` | admits `0.4.0` |
| --- | --- | --- | --- |
| `^0.3.2` | `>=0.3.2 <0.4.0` | yes | **no** |
| `^1.3.2` | `>=1.3.2 <2.0.0` | — | yes (`1.4.0`) |

While the major is zero the left-most non-zero component is the minor, so a minor bump is a boundary a caret will not cross. That covers consumers we have never heard of exactly as well as the ones we have.

## Decision

Follow semver's recipe with the roles shifted one place, because that is where `0.x` puts them: **the minor does the major's job.** A caret range already assumes that shift, so it is what a consumer's own tooling expects.

1. Mark with `@deprecated` in JSDoc, naming the replacement and the version, in a release where **the old path still works**.
2. Let at least one minor cycle pass.
3. Remove in a later **minor** — never in a patch, which is the one bump a caret delivers without anyone deciding to take it.

Deprecation and removal are always two separate releases. A consumer crossing the boundary must be able to find the warning in a version that still works.

Asking known consumers stays worth the minute it costs, as a courtesy rather than the gate.

### When the old path cannot keep working

A deprecation is a promise that the old path still functions while the caller migrates. When the behaviour it depended on is the thing being fixed, that promise cannot be made. Leaving it in place as a silent no-op is worse than removing it: the caller keeps invoking something that does nothing, and nothing says so.

Remove it, ship it as breaking, and state plainly what went and why.

### Versions and packages, as distinct from APIs

`npm deprecate @feedma/<pkg>@<range> "<reason>"` warns on install. It is for **versions** — a release that is broken or published in error — not for APIs. It removes nothing, so it breaks no resolution, and an empty string clears it. Prefer it over unpublishing: a deprecated version stays installable for anyone already pinned while warning everyone else.

Deprecating a whole package means deprecating every published version and publishing a final release whose README names the replacement.

## Consequences

Removal is possible on a predictable schedule rather than blocked on a major that will never come.

The guarantee rests on a mechanism rather than on knowledge, so it does not degrade as the consumer base grows past what anyone can track.

Every removal costs a minor bump, so minors advance faster than they otherwise would. Below `1.0.0` that is what minors are for.

**This decision expires at `1.0.0`.** With a non-zero major the left-most non-zero component is the major, so `^1.3.2` admits `1.4.0` and a minor is delivered automatically. The barrier still exists — it is the major — and removal belongs there instead. Revisit before the first package arrives.

## Alternatives

**Take clause 4 at its word and break freely, as `esbuild` does.** Rejected: it works because their changelog has an audience that reads it. Ours does not, yet.

**Gate removal on no known consumer using it.** Rejected: unverifiable for a public package, and it reads as a guarantee while covering only who we asked.

**Wait for `1.0.0` and use the standard recipe unmodified.** Rejected: it defers every removal indefinitely, and declaring `1.0.0` to unblock deprecation would be the version number following the policy rather than the maturity.
