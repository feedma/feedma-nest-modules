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

| How | Channel | dist-tag |
| --- | --- | --- |
| PR merged into `main` | stable | `latest` |
| `workflow_dispatch` on any branch, `action: prerelease` | prerelease | whatever `channel` you pass — `next`, `beta`, `rc`, `test` |
| `workflow_dispatch`, `action: missing` | recovery | unchanged |

Prereleases leave **no commit and no tag**. They are throwaway artefacts for someone to install and try; the release history should record only what reached `latest`.

Not every change needs one. Route by risk: a published-contract change, a removed or renamed API, or anything a consumer should exercise in their own application earns a prerelease. CI changes, documentation, a widened peer range and a fix with a test covering it go straight to `main`.

Version and publish are separate steps for the stable path. Publishing uses `lerna publish from-package`, which uploads only what the registry is missing, so a failed publish is recovered by re-running the job or dispatching `action: missing`.

A breaking change while the packages are `0.x` ships as a **minor** bump, which semver already permits. Use `feat:` without a `BREAKING CHANGE:` footer and without the `!` marker — either one recommends a major and would take the packages to `1.0.0` — and put the migration in the commit body and the PR.

## Dependencies

Three guards enforce what the manifests must say. They run in the normal suite:

- **Every package imported by published sources must be declared** as a dependency or peer. `devDependencies` do not count: they are installed here and never for a consumer. A package that resolves only because something else hoists it will break a consumer when that accident stops holding.
- **No dev-only package may be a peer.** `@types/*` and test frameworks are never something a consumer must provide. Marking them optional is not enough — an optional peer edge still counts as a reference from a production dependency, so it survives `npm ci --omit=dev`.
- **Shipped code must not bind eagerly to an optional peer.** `import type`, `export type` and dynamic `import()` are fine; value imports, side-effect imports, `require()` and subpath imports into a package's internals are not.

A dependency between two packages in this repository must be a declared peer in `package.json`, not only a `tsconfig.json` project reference. A project reference satisfies the compiler here and is invisible to npm.

**A sibling package is a peer, never a dependency, and its range is `*`.** The suite enforces that it is a peer, and that whatever range is declared admits the version it ships beside.

A peer rather than a dependency, because a second copy breaks class identity, and class identity is load-bearing: `instanceof` on the shared exception type, and Nest injection tokens. A duplicate breaks exception handling and dependency injection **silently**.

`*` rather than a bounded range for a narrower reason than it first appears. Bounded ranges are fine for consumers — `^0.0.12-0` installs clean against a published prerelease; only a range with no prerelease comparator, like `^0.0.12`, fails. The problem is upstream of that: **lerna does not rewrite sibling peer ranges when it bumps**, so any bounded range goes stale on the next sibling release and the version step aborts. Reproduced directly: bumping `nest-common` to `0.0.14-beta.0` left the peer at `^0.0.13-0` and the release failed.

That is a property of the release tooling, not of the package contract, so the rule is written as "the range must admit what ships beside it" rather than "the range must be `*`". Today only `*` survives a bump unattended. If sibling peer ranges ever get rewritten — by a `version` lifecycle hook, or by different tooling — a bounded range becomes viable and the guard already allows it.

The cost of `*` is that it carries no version signal: nothing warns at install time when incompatible versions are paired, so a mismatch surfaces at load instead. Acceptable while these packages are published in lockstep from one repository.

## Commits

Conventional commits, enforced by commitlint. Lerna derives versions and changelogs from them, so the type is a release decision, not a label.

Write in English. No emoji. No co-author trailers.
