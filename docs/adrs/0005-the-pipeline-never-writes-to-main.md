---
id: ADR-0005
title: The pipeline never writes to main, so the version travels in the pull request
status: proposed
scope: [common, typeorm, graphql, testing]
created: 2026-08-22
updated: 2026-08-22
authors: [esalazarv]
related:
  rfcs: []
  specs: []
  adrs: [ADR-0001, ADR-0004]
---

# The pipeline never writes to `main`, so the version travels in the pull request

## Context

[ADR-0004](./0004-publishing-authorised-by-the-registry.md) settled who may publish. This settles a different half that surfaced alongside it: the release job cannot land its own commit.

`lerna version` bumps the manifests, writes the changelogs, and pushes the result to `main` before `lerna publish` uploads anything. That push is refused:

```
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: - 2 of 2 required status checks are expected.
```

A release commit is created inside the job and has no check runs, so it can never satisfy that rule. There is no wording of the rule that a freshly minted commit passes.

### It had been broken for four days without a symptom

The ruleset was created on 2026-08-17. The last successful release commit landed about twenty minutes earlier. Every merge in between touched only documentation and configuration, where `lerna version` finds nothing to bump and therefore never pushes — so the pipeline reported success each time. The breakage surfaced on the first merge that changed a package, four days later, and only because that merge happened at all.

**A failure that only appears when the system is used is not caught by the system being green.**

### Why no bypass is the answer

GitHub Actions cannot be granted a bypass here: the API refuses it with *"Actor GitHub Actions integration must be part of the ruleset source or owner organization"*, and it does not appear in the bypass list. Of the actors that do, only a deploy key could carry the push, and a bypass actor bypasses the **entire** ruleset rather than the one rule — the same key that could push a release commit could force-push or delete the branch.

Removing the required checks was the other obvious move. It weakens the branch for every human in order to unblock a machine, which is the wrong trade in the wrong direction.

### The one thing CI can still do

The ruleset targets branches — its condition is `~DEFAULT_BRANCH`. Tag pushes are not covered, and this is not a reading of the configuration but an observation of it: in the failed run, the four tags landed while `main` was rejected in the same `git push --follow-tags`.

So CI can still record what it published. What it cannot do is move the branch.

## Decision

**The pipeline never writes to `main`.** The version bump and changelog travel in the pull request, and merging publishes what the manifests already say.

Versioning becomes a dispatch against your own branch, alongside the prerelease channels:

```bash
gh workflow run cd.yml --ref <your-branch> -f action=version
```

It runs `lerna version --conventional-commits --no-git-tag-version --no-push --allow-branch "**"`, which writes the manifests, changelogs and lockfile without committing, tagging, pushing or creating releases — measured, not assumed:

```
Changes:
 - @feedma/nest-typeorm: 0.1.3 => 0.1.4
lerna info execute Skipping git tag/commit
lerna info execute Skipping git push
lerna info execute Skipping releases
```

The job commits that as `chore(release): publish` and pushes it to **the feature branch**, which the ruleset does not cover. The pull request then shows the exact version it will ship, and reviewing the release becomes reviewing the diff.

Merging runs `lerna publish from-package` and nothing else. It uploads whatever the manifests declare and the registry lacks, needing no commit and no push. Afterwards the job creates the tags for what it published and pushes those — the one write CI retains.

`lerna version` refuses to run on a detached HEAD with `ENOGIT`, which is what `actions/checkout` leaves behind when given a `ref`. The version job must check out a real branch.

### The failure this introduces, and the guard for it

A pull request that changes a package without carrying a bump merges cleanly and publishes **nothing**: `from-package` finds every manifest version already in the registry and exits successfully. The fix ships to `main` and reaches no consumer, with a green pipeline reporting it.

That is the same shape as the failure this ADR exists to correct, so it does not get to be discovered the same way. A check runs on every pull request: if any file under `packages/<name>/` differs from the base and `<name>`'s version does not, the check fails and names the package. The rule the pipeline relies on is enforced where it can be seen, not left to memory.

## Consequences

`EBEHIND` disappears. A publish job that neither checks out `main` for writing nor pushes to it cannot be overtaken by a second merge, so the concurrency group becomes an optimisation rather than a correctness requirement.

The branch ruleset can stay exactly as strict as it is, and the `pull_request` rule composes with it — every path to `main` is a reviewed pull request by construction, including the release commit, which previously arrived unreviewed by definition.

**Releasing costs one more deliberate action**: dispatch the version, then merge. The action that was implicit is now visible, which is most of the point — the version stops being something the pipeline decides after the fact and becomes something a reviewer sees before agreeing to it.

**Two pull requests touching the same package will conflict** on `package.json` and `CHANGELOG.md`. That friction is real and it is not entirely unwelcome: two package changes racing to `main` were already a problem, and this makes them collide loudly rather than silently serialising behind a publish lock.

A dispatched version can be stale. If `main` moves after you bump, the computed version may no longer be the next one, and the merge publishes a version that skips or repeats. Merging `main` down before dispatching is the existing rule for keeping a branch current, and it covers this.

## Alternatives

**A release pull request opened by the pipeline**, as `changesets` and `release-please` do: merges accumulate, and a bot maintains a pull request carrying the bump, which publishes when merged. It removes the forgotten-bump failure entirely — the bot always proposes — and avoids the conflict, since the bump is computed after the merges land.

Rejected for how it fits the rules already here. It splits the graduation ceremony in two: the feature merges without publishing, and a second merge publishes it later, so "merging the pull request is what produces `latest`" stops being true. It also breaks the tie between a validated prerelease and the merge that ships it — a consumer validates `0.1.4-next.0` against a pull request whose merge no longer publishes anything by itself. Worth revisiting if the conflict friction turns out to dominate.

**A deploy key in the ruleset bypass list.** Rejected. It is a standing write credential that bypasses every rule in the set, introduced to save a design change — and this ADR is that design change.

**Removing the required status checks.** Rejected. It removes CI enforcement for every human on the repository so that one job can push, and leaves the release commit arriving unreviewed.

**Keeping `lerna version` in CI and disabling the ruleset for each release.** Rejected as a standing practice. It works, and it is the right one-time move to unblock a release already waiting, but a rule switched off on a schedule is not a rule.
