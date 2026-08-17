# Working rules

Applies to everyone working in this repository, human or agent.

Design and decisions live in [`docs/`](./docs) — see [`docs/README.md`](./docs/README.md) for the RFC / spec / ADR system.

## Packages

Four packages under `packages/`, versioned independently by lerna and published to npm under the `@feedma` scope: `nest-common`, `nest-typeorm`, `nest-graphql`, `nest-testing`.

They are general-purpose libraries. Documents and commit messages describe **usage patterns**, never the applications that happen to consume them.

## Branching strategy

- **Feature branches are cut from `main`.** Never from a shared integration branch — a branch taken from one inherits every other feature still under test there, and drags them along when it merges.
- **A feature opens a draft PR to `main` on day one.** The branch is empty at that point and that is fine: the PR is the feature's permanent review surface, it shows the accumulated diff at any moment, and shipping becomes marking it ready rather than opening something new.
- **Work inside a feature is organised as [stacked PRs](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-stacked-pull-requests), driven with `gh stack`.** A feature branch is the trunk for its own work; each reviewable piece is a branch on top of it, targeting the branch below rather than `main`. That keeps each PR small enough to review honestly without waiting for the whole feature.
- **Only `main` is ever merged *into* a feature branch.** If another feature ships while yours is alive, merge `main` down to stay current.
- **A feature ships by marking its draft PR ready and merging to `main`.** `main` therefore holds only shipped work, and is always a state worth branching from.
- **There is no long-lived integration branch.** Trying something before it ships is a prerelease, not a merge — see Release channels below. `main` is the only branch anything is cut from or merged into.

### When a feature depends on one that has not shipped

Branch it on top of that feature's branch. Stacking on the one real dependency picks up only what is actually needed, and the stack unwinds naturally as each piece ships.

If the dependency is close to shipping, the cheaper move is usually to ship it first and then cut from `main` as normal.

Plan work with dependencies so it can be released sequentially. "This needs unreleased work, so I will branch from somewhere else" is not a solution — it is how unrelated features end up entangled.

### Stacked PR mechanics

- **Retarget each child yourself before merging it.** With the base branch still alive, GitHub's automatic retarget does not fire, and merging the child then lands it *into the already-merged branch* rather than the real base.
- **Do not pass `--delete-branch` until the whole stack is in.** Deleting the base is what triggers the automatic retarget, and racing it closes child PRs unmerged.
- **When the trunk moves, merge it down into each branch in order — do not rebase.** A hand rebase rewrites branches other PRs are stacked on, and every child PR loses its base.
- **If a stack gets tangled, collapse it.** The tip branch already contains every commit, so one PR from tip to the real base lands everything. Nothing is lost — the branches all still exist.

### Checking a merge without touching the working tree

```bash
git merge-tree --write-tree <base> <head> >/dev/null 2>&1 && echo clean || echo conflicts
```

Use the exit code. Never grep the output for the word `CONFLICT` — a source file containing `HttpStatus.CONFLICT` produces false positives.

**After any merge into a branch, run the suite even if git reported no conflict.** Git happily auto-merges a file rename while leaving imports pointing at the old path.

## Release channels

Publishing is driven by `.github/workflows/cd.yml`. Versions are never edited by hand — lerna computes them from conventional commits and the release tags.

**The channel is a flag, not a branch.**

| Channel | dist-tag | Version | How |
| --- | --- | --- | --- |
| iteration | `canary` | `0.4.0-canary.0.sha-d90907b` | `workflow_dispatch`, `action: prerelease`, `channel: canary` |
| candidate | `next` | `0.4.0-next.0` | `workflow_dispatch`, `action: prerelease`, `channel: next` |
| stable | `latest` | `0.4.0` | PR merged into `main` |
| recovery | unchanged | unchanged | `workflow_dispatch`, `action: missing` |

**Nothing reaches `latest` without having been published as a prerelease and validated by a consumer.** No exception by size — a patch breaks a consumer exactly as effectively as a minor, and the diff's size says nothing about the assumption it quietly relies on. The reasoning, and why this is stricter than large frameworks, is [ADR-0001](./docs/adrs/0001-release-channels-and-validation.md).

The flow is `canary` while the work moves, `next` when it is ready to be judged, `latest` once someone says it works.

`next` and the stable it graduates to are the **same base version**, so validating `0.4.0-next.0` validates what ships as `0.4.0`.

**A `next` can only be cut once per stable baseline.** Nothing is tagged, so lerna recomputes the same version and the registry rejects the second. Iterate on `canary`, which carries the commit sha and is unique per commit.

### Graduating

| Change | Gate | Time fallback |
| --- | --- | --- |
| breaking — `feat:` with a migration | explicit confirmation | none |
| feature — minor | explicit confirmation | 72 hours |
| fix — patch | explicit confirmation | 24 hours |
| hotfix — repairs something already broken in `latest` | confirmation from the affected consumer | none |

The fallback exists so work is not stranded when nobody answers, not as a way around validation. Graduating on the clock is a decision that nobody ran it — take it knowingly.

Changes that touch nothing under `packages/` publish nothing, so they have neither prerelease nor release. Documentation, workflow and repository configuration are outside this by construction, not by exemption.

### Publishing mechanics

Prereleases leave **no commit and no tag**. The release history records only what reached `latest`.

Version and publish are separate steps for the stable path. Publishing uses `lerna publish from-package`, which uploads only what the registry is missing, so a failed publish is recovered by re-running the job or dispatching `action: missing`.

**The pipeline only ever adds to the registry.** It publishes versions and sets tags; it never deletes either, so a leaked token means an unwanted version — corrected by publishing over it — rather than a removal that breaks resolution for every consumer and leaves nothing to inspect.

Retiring a dist-tag, unpublishing a version, or any other destructive registry operation is done by hand by someone with their own credentials. These are one-time acts and do not justify a standing capability. "The pipeline is the only thing holding registry credentials" is an argument for where the credentials live, never for what it may do with them.

**Publish jobs serialise.** A publish takes minutes, and a second merge inside that window advances `main` under the first job's checkout, aborting it with `EBEHIND` — merging two pull requests back to back is enough. They share a concurrency group and never cancel in progress, because a half-finished publish can leave a version tagged in git but absent from the registry.

### What produces a release

Two things decide it, in this order.

**Which packages changed**, by diffing files against each package's last release tag. A change outside `packages/` publishes nothing — the run succeeds having found no changed packages, which is correct and not a failure to investigate.

**The commit type**, which sizes the bump: `feat:` is a minor and `fix:` a patch. Every other type still produces a **patch** when the file it touched lives inside a package, because lerna falls back to patch when the conventional rules recommend nothing. A `chore:` or `ci:` commit under `packages/` releases.

A breaking change while a package is `0.x` ships as a **minor**, and lerna applies that itself: while the major version is `0`, a recommended major is downgraded. `feat:` and `feat!:` land on the same version, so the `!` marker and a `BREAKING CHANGE:` footer are both safe. Say it plainly and put the migration in the commit body and the PR. This stops holding at `1.0.0`.

## Deprecating

Full reasoning in [ADR-0002](./docs/adrs/0002-deprecating-below-1-0-0.md), including why the standard gives no guidance below `1.0.0`.

1. Mark with `@deprecated` in JSDoc, naming the replacement and the version, in a release where **the old path still works**.
2. Let at least one minor cycle pass.
3. Remove in a later **minor** — never in a patch.

Deprecation and removal are always two separate releases. A consumer crossing the boundary must find the warning in a version that still works.

**Removal ships in a minor because that is the boundary a caret will not cross.** While a package is `0.x`, `^0.3.2` means `>=0.3.2 <0.4.0`, so a removal reaches nobody automatically and every consumer opts in deliberately. A patch is the one bump a caret does deliver unasked. This protection moves to the major at `1.0.0`.

Consumers cannot be enumerated — these are public packages. Asking the ones in this organisation is worth the minute it costs, but it is a courtesy, not the gate.

**Deprecate only what still works.** When the old path cannot keep working, leaving it as a silent no-op is worse than removing it: the caller keeps invoking something that does nothing and nothing says so. Remove it, ship it as breaking, and say what went and why.

`npm deprecate` is for **versions**, not APIs — a release that is broken or published in error. Prefer it over unpublishing.

## Dependencies

Three guards enforce what the manifests must say. They run in the normal suite:

- **Every package imported by published sources must be declared** as a dependency or peer. `devDependencies` do not count: they are installed here and never for a consumer. A package that resolves only because something else hoists it will break a consumer when that accident stops holding.
- **No dev-only package may be a peer.** `@types/*` and test frameworks are never something a consumer must provide. Marking them optional is not enough — an optional peer edge still counts as a reference from a production dependency, so it survives `npm ci --omit=dev`.
- **Shipped code must not bind eagerly to an optional peer.** `import type`, `export type` and dynamic `import()` are fine; value imports, side-effect imports, `require()` and subpath imports into a package's internals are not.

**Framework packages move together.** `@nestjs/core`, `@nestjs/common`, `@nestjs/testing` and `@nestjs/platform-*` must install at the same version — bump them in one change, and in every manifest that pins them. A `^` range lets one of them float ahead of the others, and a mismatched pair fails as a dependency that silently arrives `undefined` or a module that hangs on `init`, never as a version error. The peer ranges stay wide; this rule is about what gets installed here.

A dependency between two packages in this repository must be a declared peer in `package.json`, not only a `tsconfig.json` project reference. A project reference satisfies the compiler here and is invisible to npm.

**A sibling package is a peer, never a dependency, and its range is `*`.** A peer because a second copy breaks class identity, and class identity is load-bearing — `instanceof` on the shared exception type, and Nest injection tokens. A duplicate breaks exception handling and dependency injection **silently**.

`*` because lerna does not rewrite sibling peer ranges when it bumps, so any bounded range goes stale on the next sibling release and the version step aborts. The guard is written as "the range must admit what ships beside it", so a bounded range becomes viable if that ever changes. Reasoning and the reproduction in [ADR-0003](./docs/adrs/0003-sibling-peer-ranges.md).

## Commits

Conventional commits, enforced by commitlint. Lerna derives versions and changelogs from them, so the type is a release decision, not a label.

Write in English. No emoji. No co-author trailers.
