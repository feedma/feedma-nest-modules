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

All three carry the **same base version**. A consumer validating `0.4.0-next.0` is validating the exact artefact that graduates to `0.4.0` — the prerelease is computed with `--conventional-prerelease` and the stable with `--conventional-graduate`, which is what makes them agree.

Prereleases leave **no commit and no tag**. The release history records only what reached `latest`.

### Nothing reaches `latest` unvalidated

**Every change that produces a release is published as a prerelease first and validated by a consumer before it graduates.** No exception by size: a patch breaks a consumer exactly as effectively as a minor, and a change nobody has run is unvalidated regardless of how small its diff looks.

This is deliberately stricter than large frameworks, which ship patches and minors straight to `latest` and reserve prereleases for majors. That works on their download volume: a broken patch is found within hours because thousands of installs exercise it. Here the audience that would notice is a handful of applications, mostly in this organisation — so the fault would surface late, and asking someone to install a `next` costs one message. When detection is weak and validation is cheap, validate.

The flow is `canary` while the work moves, `next` when it is ready to be judged, `latest` once someone says it works.

**A `next` can only be cut once per stable baseline.** Nothing is tagged, so lerna recomputes the same version from the last release tag and a second publish collides with the registry. Iterate on `canary`, which carries the commit sha and is therefore unique per commit.

### Graduating

| Change | Gate | Time fallback |
| --- | --- | --- |
| breaking — `feat:` with a migration | explicit confirmation | none |
| feature — minor | explicit confirmation | 72 hours |
| fix — patch | explicit confirmation | 24 hours |
| hotfix — repairs something already broken in `latest` | confirmation from the affected consumer | none |

The fallback exists so work is not stranded when nobody answers, not as a way around validation. Graduating on the clock is a decision that nobody ran it — take it knowingly.

A hotfix has no fallback for the reason it might seem to deserve one: it is the change made fastest, under the most pressure, and therefore the most likely to break something else. The consumer suffering the fault is also the one who can confirm the repair in short time, so the confirmation arrives without a clock.

Changes that touch nothing under `packages/` publish nothing, so they have neither prerelease nor release. Documentation, workflow and repository configuration are outside this by construction, not by exemption.

Version and publish are separate steps for the stable path. Publishing uses `lerna publish from-package`, which uploads only what the registry is missing, so a failed publish is recovered by re-running the job or dispatching `action: missing`.

**The pipeline only ever adds to the registry.** It publishes versions and sets tags; it never deletes either. The publish credential is append-only by consequence, so a leaked token means an unwanted version — corrected by publishing over it — rather than a removal that breaks resolution for every consumer and leaves nothing behind to inspect.

Retiring a dist-tag, unpublishing a version, or any other destructive registry operation is done by hand, deliberately, by someone with their own credentials. These are one-time acts and do not justify a standing capability. "The pipeline is the only thing holding registry credentials" is an argument for where the credentials live, never for what the pipeline should be allowed to do with them.

**Publish jobs serialise.** A publish takes minutes, and a second merge inside that window advances `main` under the first job's checkout, aborting it with `EBEHIND` before anything ships — merging two pull requests back to back is enough. They share a concurrency group and never cancel in progress: a half-finished publish can leave a version tagged in git but absent from the registry, which then needs manual recovery.

### What produces a release

Two things decide it, in this order.

**Which packages changed**, by diffing files against each package's last release tag. A change outside `packages/` publishes nothing — the run succeeds having found no changed packages, which is the correct outcome and not a failure to investigate.

**The commit type**, which sizes the bump: `feat:` is a minor and `fix:` a patch. Every other type still produces a **patch** when the file it touched lives inside a package, because lerna falls back to patch when the conventional rules recommend nothing. A `chore:` or `ci:` commit under `packages/` releases.

A breaking change while a package is `0.x` ships as a **minor** bump, which semver already permits — and lerna applies that itself: while the major version is `0`, a recommended major is downgraded to a minor. `feat:` and `feat!:` therefore land on the same version, and the `!` marker and a `BREAKING CHANGE:` footer are both safe to use. Say it plainly and put the migration in the commit body and the PR.

This stops holding the moment a package reaches `1.0.0`, where a major is taken at face value.

## Deprecating

The usual policy — deprecate in one major, remove in the next — has nothing to attach to here. These packages are `0.x` and lerna downgrades a recommended major to a minor, so **no major boundary is ever cut**. Waiting for one means waiting forever. The anchor is the consumers instead: few enough to enumerate, and reachable.

**Removal is allowed once no known consumer still uses it.** Check, do not assume. That is a stronger guarantee than any interval — an interval only measures how long nobody was asked.

Deprecation and removal are always **two separate releases**. Never the same one.

### Deprecating an API

Mark it with `@deprecated`, naming the replacement and the version:

```ts
/**
 * @deprecated since 0.4.0 — use `toPagination` instead, which derives the
 * same fields and owns the empty-result defaults.
 */
```

The editor surfaces this before anyone installs anything, which is the earliest a consumer can find out. It costs nothing at runtime and needs no release ceremony of its own.

**Deprecate only what still works.** A deprecation is a promise that the old path keeps functioning while the caller migrates. When the old path cannot keep working — the behaviour it depended on is the thing being fixed — leaving it in place as a silent no-op is worse than removing it, because the caller keeps invoking something that does nothing and nothing says so. Remove it, ship it as breaking, and say plainly what was removed and why in the commit body and the PR.

### Deprecating a published version

`npm deprecate @feedma/<pkg>@<range> "<reason>"` puts a warning on install. This is for **versions**, not APIs: a release that is broken, was published in error, or should not be picked up again. It does not remove anything, so it does not break resolution, and `npm deprecate @feedma/<pkg>@<range> ""` clears it.

Prefer it over unpublishing. A deprecated version stays installable for anyone already pinned to it while warning everyone else.

### Deprecating a package

Deprecate every published version, and publish one final release whose README says what replaces it. The package stays installable — consumers pinned to it are not broken — and every new install warns.

## Dependencies

Three guards enforce what the manifests must say. They run in the normal suite:

- **Every package imported by published sources must be declared** as a dependency or peer. `devDependencies` do not count: they are installed here and never for a consumer. A package that resolves only because something else hoists it will break a consumer when that accident stops holding.
- **No dev-only package may be a peer.** `@types/*` and test frameworks are never something a consumer must provide. Marking them optional is not enough — an optional peer edge still counts as a reference from a production dependency, so it survives `npm ci --omit=dev`.
- **Shipped code must not bind eagerly to an optional peer.** `import type`, `export type` and dynamic `import()` are fine; value imports, side-effect imports, `require()` and subpath imports into a package's internals are not.

**Framework packages move together.** `@nestjs/core`, `@nestjs/common`, `@nestjs/testing` and `@nestjs/platform-*` must install at the same version — bump them in one change, and in every manifest that pins them. A `^` range lets one of them float ahead of the others, and a mismatched pair fails as a dependency that silently arrives `undefined` or a module that hangs on `init`, never as a version error. The peer ranges stay wide; this rule is about what gets installed here.

A dependency between two packages in this repository must be a declared peer in `package.json`, not only a `tsconfig.json` project reference. A project reference satisfies the compiler here and is invisible to npm.

**A sibling package is a peer, never a dependency, and its range is `*`.** The suite enforces that it is a peer, and that whatever range is declared admits the version it ships beside.

A peer rather than a dependency, because a second copy breaks class identity, and class identity is load-bearing: `instanceof` on the shared exception type, and Nest injection tokens. A duplicate breaks exception handling and dependency injection **silently**.

`*` rather than a bounded range for a narrower reason than it first appears. Bounded ranges are fine for consumers — `^0.0.12-0` installs clean against a published prerelease; only a range with no prerelease comparator, like `^0.0.12`, fails. The problem is upstream of that: **lerna does not rewrite sibling peer ranges when it bumps**, so any bounded range goes stale on the next sibling release and the version step aborts. Reproduced directly: bumping `nest-common` to `0.0.14-beta.0` left the peer at `^0.0.13-0` and the release failed.

That is a property of the release tooling, not of the package contract, so the rule is written as "the range must admit what ships beside it" rather than "the range must be `*`". Today only `*` survives a bump unattended. If sibling peer ranges ever get rewritten — by a `version` lifecycle hook, or by different tooling — a bounded range becomes viable and the guard already allows it.

The cost of `*` is that it carries no version signal: nothing warns at install time when incompatible versions are paired, so a mismatch surfaces at load instead. Acceptable while these packages are published in lockstep from one repository.

## Commits

Conventional commits, enforced by commitlint. Lerna derives versions and changelogs from them, so the type is a release decision, not a label.

Write in English. No emoji. No co-author trailers.
