---
id: ADR-0003
title: A sibling package is a peer, and its range is *
status: accepted
scope: [common, typeorm, graphql, testing]
created: 2026-08-17
updated: 2026-08-17
authors: [esalazarv]
related:
  rfcs: []
  specs: []
  adrs: []
---

# A sibling package is a peer, and its range is `*`

## Context

These packages depend on each other. Two questions follow: whether that dependency is declared as a `dependency` or a `peerDependency`, and what range it carries.

### Why a peer rather than a dependency

A dependency permits a second copy in the tree. Class identity is load-bearing here in two places: `instanceof` against the shared exception type, and Nest's injection tokens, which are the class objects themselves.

A duplicate breaks exception handling and dependency injection **silently** — no error names the cause, and the symptom is a filter that does not catch or a provider that does not resolve.

### Why `*` rather than a bounded range

Not for the reason it first appears. Bounded ranges are fine for consumers: `^0.0.12-0` installs cleanly against a published prerelease, and only a range with no prerelease comparator, like `^0.0.12`, fails.

The problem is upstream of that. **Lerna does not rewrite sibling peer ranges when it bumps.** Any bounded range goes stale on the next sibling release and the version step aborts.

Reproduced directly: bumping `nest-common` to `0.0.14-beta.0` left the peer at `^0.0.13-0`, and the release failed.

## Decision

A dependency between two packages in this repository is a **peer**, never a dependency, and its range is `*`.

The rule is enforced by a test, written as *the range must admit the version it ships beside* rather than *the range must be `\*`*. That is deliberate: the constraint is a property of the release tooling, not of the package contract. If sibling peer ranges ever get rewritten — by a `version` lifecycle hook, or by different tooling — a bounded range becomes viable and the guard already allows it.

A dependency between two packages here must be declared in `package.json`, not only as a `tsconfig.json` project reference. A project reference satisfies the compiler and is invisible to npm.

## Consequences

Releases proceed unattended. No bump leaves a stale range behind.

`*` carries no version signal, so nothing warns at install time when incompatible versions are paired. A mismatch surfaces at load instead of at install.

That cost is acceptable only while these packages are published in lockstep from one repository. If they ever release independently, the signal starts to matter and this needs revisiting.

## Alternatives

**A bounded range with a prerelease comparator, such as `^0.0.12-0`.** Rejected: correct for consumers, but goes stale on the next sibling bump and aborts the release.

**A dependency instead of a peer.** Rejected: permits a duplicate, and the duplicate breaks `instanceof` and injection without any diagnostic.

**A `version` lifecycle hook that rewrites sibling ranges on bump.** Not rejected, unbuilt. It would make bounded ranges viable and restore the install-time signal. Worth building if independent release cadence ever becomes real.
