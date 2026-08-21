---
id: ADR-0004
title: Publishing is authorised by the registry, not by a stored token
status: accepted
scope: [common, typeorm, graphql, testing]
created: 2026-08-21
updated: 2026-08-21
authors: [esalazarv]
related:
  rfcs: []
  specs: []
  adrs: [ADR-0001]
---

# Publishing is authorised by the registry, not by a stored token

## Context

[ADR-0001](./0001-release-channels-and-validation.md) decides *what* may reach `latest`: nothing without a prerelease a consumer has run. This decision is about a different question that went unasked — *what may reach the registry at all*, and who decides.

### What the credential is, and who can reach it

The publish credential is an organisation secret. The repository holds none of its own:

```
repository secrets:              total = 0
organisation secrets available:  NPM_TOKEN
```

An organisation secret is available to **every workflow in the repository, on every branch**. That is the whole of the exposure, and it is larger than it looks. A workflow file is read from the commit that triggers it, so anyone who can push a branch can add a workflow that runs on push and reads that secret. No review, no pull request, no merge.

The existing publish workflow makes the same thing available without even that step: all three publish jobs carry `NODE_AUTH_TOKEN`, and `publish_prerelease` runs on `workflow_dispatch` against any ref, because publishing a branch is exactly what a prerelease is for.

The consequence is that **the set of people who can publish arbitrary code to the public registry under this scope is the set of people who can push a branch.** Today those are the same four repository administrators, so nothing is currently wrong. It becomes wrong silently, the first time someone is granted write access without being granted release authority — a contractor, a team, an automation. Nobody makes that decision at that moment; it arrives as a side effect.

### Why no amount of workflow configuration fixes this

The instinct is to gate the workflow: a condition on the branch, a required reviewer, a restriction on who may dispatch. None of it holds, because the guard would live in a file that the person being guarded controls. The secret is reachable from any workflow file on any branch, so a rule written inside one workflow simply does not apply to the next one added beside it.

Any control that works has to sit outside the repository.

### What the earlier decision did and did not settle

Publishing was deliberately kept behind `workflow_dispatch` rather than a pull request label, because running a workflow needs write access while managing labels needs only triage, and the lower bar was not worth the saved command.

That reasoning was about **who may trigger a publish**. It says nothing about **what may be published**, which is the gap here. A trigger check answers "is this person allowed to release"; it never answers "is this artefact the reviewed one". Deciding the second question turns out to unsettle the first, which the Consequences record.

## Decision

Publishing authenticates by OIDC trusted publishing, and no npm token is stored anywhere.

Each package's trusted publisher on npmjs.com is configured with **stage-only** permission. CI can place a version in the staging area; it cannot make it installable. A maintainer reviews the staged version and approves it with 2FA before it is public.

Token-based publishing is disallowed per package, and `NPM_TOKEN` is removed from the organisation. **This step is not optional and not cosmetic.** Adding a trusted publisher does not retire tokens: the registry accepts them "in addition to" OIDC. Leaving the token in place would leave every path described above exactly as open as it is now, with the OIDC configuration serving only as decoration.

This needs no change of tooling. Lerna implements the OIDC exchange itself rather than delegating to the npm CLI, adapted from the CLI's own implementation:

```
node_modules/lerna/dist/libs/core/src/lib/oidc.d.ts
  "Adapted from https://github.com/npm/cli/blob/latest/lib/utils/oidc.js"
```

It detects GitHub Actions, requires `ACTIONS_ID_TOKEN_REQUEST_URL` and its token — which is to say `permissions: id-token: write` — exchanges the identity token for a registry token, and proceeds. The workflow change is to grant that permission and delete `NODE_AUTH_TOKEN`. Because the exchange is lerna's own code, it does not depend on the npm version the runner happens to ship, which matters: the Node 22 line still bundles npm 10, below the version npm's own OIDC support requires.

## Consequences

The authorisation boundary moves from the repository to the registry, where it can be enforced rather than merely configured. Approval is independent of which branch the code came from, who dispatched the workflow, and what the workflow file said — none of which the publisher controls any more.

There is no longer a long-lived credential to leak, rotate, or accidentally print. A compromised branch yields nothing, because the identity token is minted per run, scoped to the run, and worthless outside it.

**Every publish now requires a human with 2FA, including canary.** This is the real cost, and it lands on the channel least able to afford it: canary exists to be cut as often as iteration demands, and each one now waits for an approval. The permission is per package, not per dist-tag, so there is no configuration that gates `latest` while leaving `canary` free — allowing direct publishes to unblock canary would remove the gate everywhere. The mitigating fact is that a canary is already dispatched by hand by someone who is present and watching; approving it is a second action by the same person, not a handoff to someone else.

This approval is **not** the consumer validation of [ADR-0001](./0001-release-channels-and-validation.md), and does not substitute for it. That gate asks whether the code works for somebody who installed it; this one asks whether the artefact is the intended one. The time-based fallbacks apply to the first and never to the second: nothing publishes on a clock.

**The trigger stops being the authorisation boundary.** Publishing was kept behind `workflow_dispatch` rather than a pull request label on an access argument: running a workflow needs write, managing labels needs only triage, and that difference was worth one command. That argument is spent. Someone holding only triage who could start a run still cannot make anything installable — the maintainer's approval decides that, whatever triggered it.

What the dispatch still carries is choice rather than authority: which channel, and which ref. Whether that choice could move to a label is now a question of cost — a cheaper trigger means more staged versions queued for review and more CI spent on runs nobody asked for — and no longer one of access. This ADR does not decide it, and it should not be decided by inertia either: the rule as written rests on a premise this decision removes.

The workflow filename becomes part of the trust configuration. Renaming `cd.yml` breaks publishing, and it breaks at the registry rather than in CI, so the failure will not look like the cause. Rename it only alongside the four package configurations.

Configuration is per package and manual, on npmjs.com, by someone holding the account credentials. Four packages, four configurations, and no way to automate it from here — which is correct: a repository that could grant itself publishing rights would defeat the point.

## Alternatives

**GitHub Environments with required reviewers and deployment branch policies.** Rejected. It keeps a long-lived token and gates the *workflow run* rather than the artefact, so the guarantee depends on the token being unreachable outside the environment — which means removing it from the organisation regardless. Having done that, the environment adds machinery to approximate what the registry enforces directly, and its reviewer approves a run without necessarily reading what it publishes.

**A bypass actor on the branch ruleset.** Rejected, and it addresses a different problem: it concerns pushing the release commit, not publishing. It also fails on its own terms, because a bypass actor bypasses the entire ruleset rather than one rule — the same deploy key that could push a release commit could force-push or delete the default branch.

**Removing the required status checks from the branch ruleset.** Rejected. It weakens the branch for every human in order to unblock a machine, and leaves the publishing question untouched.

**Leaving it as it is.** Rejected, but it deserves stating plainly: the current arrangement is not presently being abused and the people who hold write access are the people who should be releasing. The objection is that this alignment is an accident of the current access list rather than a property of the system, and it stops being true without anyone deciding that it should.
