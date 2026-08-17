---
id: ADR-0001
title: Nothing reaches latest without a validated prerelease
status: accepted
scope: [repo]
created: 2026-08-17
updated: 2026-08-17
authors: [esalazarv]
related:
  rfcs: []
  specs: []
  adrs: [ADR-0002]
---

# Nothing reaches latest without a validated prerelease

## Context

The working rules routed prereleases by risk: a published-contract change or a removed API earned one, while a fix with a test covering it went straight to `main`. Under that rule a change reached `latest` without any consumer having run it.

The judgement it asks for is not one anyone can make reliably. Deciding a change is small enough to skip validation is a prediction about a codebase you are not looking at — the consumer's. A patch breaks an application exactly as effectively as a minor, and the diff's size says nothing about whether the assumption it quietly relies on holds somewhere else.

### What comparable projects do

`@nestjs/core`, measured from the registry: 454 published versions, 58 of them prereleases. Those cluster on majors — 17 alphas for `12.0.0`, plus a `9.3.0-beta.3` and a `6.0.0-rc.1`. Meanwhile `11.1.18` through `11.1.29`, then `11.2.0` and `11.2.1`, all went straight to `latest`.

So the established practice in a large framework is the opposite of what this decision adopts: prerelease the majors, ship everything else direct.

That practice is sound *for them*. A broken patch is found within hours because thousands of installs exercise it immediately, and the cost of a prerelease cycle across that many dependents is real. Neither holds here. The audience that would notice is a handful of applications, mostly in this organisation, so a fault surfaces late — and asking one of them to install a `next` costs a single message.

The rule follows the asymmetry rather than the convention: when detection is weak and validation is cheap, validate.

## Decision

**Every change that produces a release is published as a prerelease first and validated by a consumer before it graduates.** No exception by size.

Three channels:

| Channel | dist-tag | Version |
| --- | --- | --- |
| iteration | `canary` | `0.4.0-canary.0.sha-d90907b` |
| candidate | `next` | `0.4.0-next.0` |
| stable | `latest` | `0.4.0` |

Graduation gates, by change type:

| Change | Gate | Time fallback |
| --- | --- | --- |
| breaking | explicit confirmation | none |
| feature | explicit confirmation | 72 hours |
| fix | explicit confirmation | 24 hours |
| hotfix | confirmation from the affected consumer | none |

A hotfix has no fallback for the reason it might seem to deserve one: it is the change made fastest, under the most pressure, and therefore the most likely to break something else. The consumer suffering the fault is also the one who can confirm the repair in short time, so the confirmation arrives without a clock.

The time fallback exists so work is not stranded when nobody answers. It is not a way around validation — graduating on the clock is a decision that nobody ran it.

### The candidate must be the artefact that ships

`publish:prerelease` ran `lerna publish prerelease`, a fixed patch bump that ignores the commit type. Measured against the same commit, the three modes disagree:

| mode | version |
| --- | --- |
| `prerelease` (what ran) | `0.3.3-next.0` |
| `--conventional-prerelease` | `0.4.0-next.0` |
| `--conventional-graduate` (stable) | `0.4.0` |

A `feat` would have been validated as `0.3.3-next.0` and shipped as `0.4.0`. Validating an artefact that is not the one released defeats the whole decision, so `next` is computed with `--conventional-prerelease`, which agrees with the `--conventional-graduate` the stable path already used.

### Why two prerelease channels rather than one

Prereleases leave no commit and no tag, so lerna recomputes the version from the last release tag every time. A second `next` on the same branch produces the same version and the registry rejects it — one `next` per stable baseline.

Iteration therefore needs a different mechanism. `--canary` appends the commit sha, making every build unique. Its bump is fixed rather than conventional, so a canary version does not match what will ship — acceptable, because an iteration build exists to run the code, not to judge the release.

## Consequences

Every release now waits on a person. That is the cost, and it is the point: the wait is the validation.

The prerelease is the same artefact as the release, so validating it means something. Previously it would not have been.

A change that touches nothing under `packages/` publishes nothing at all, so documentation, workflow and repository configuration fall outside this by construction rather than by exemption.

Release throughput drops. With few consumers and packages still in `0.x`, the trade favours correctness — this should be revisited if the number of changes per week grows enough that the gate becomes the bottleneck rather than the safeguard.

## Alternatives

**Route by risk, as before.** Rejected: it asks for a prediction about code you cannot see, and it had already failed once.

**Follow the large-framework convention — prerelease majors only.** Rejected: it depends on download volume this repository does not have. The convention encodes their detection speed, not a general truth.

**Automate the gate on the consumer's CI.** Not rejected, deferred. It is a stronger gate than a person confirming, but it needs that integration to exist first. Worth revisiting once there is more than one consumer routinely validating.
