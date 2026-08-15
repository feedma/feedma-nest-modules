# Working rules

Applies to everyone working in this repository, human or agent.

Design and decisions live in [`docs/`](./docs) — see [`docs/README.md`](./docs/README.md) for the RFC / spec / ADR system.

## Packages

Four packages under `packages/`, versioned independently by lerna and published to npm under the `@feedma` scope: `nest-common`, `nest-typeorm`, `nest-graphql`, `nest-testing`.

They are general-purpose libraries. Documents and commit messages describe **usage patterns**, never the applications that happen to consume them.

## Branching strategy

- **Feature branches are cut from `main`.** Never from `develop` — a branch taken from `develop` inherits every other feature still under test there, and drags them along when it merges.
- **A feature opens a draft PR to `main` on day one.** The branch is empty at that point and that is fine: the PR is the feature's permanent review surface, it shows the accumulated diff at any moment, and graduation becomes marking it ready rather than opening something new.
- **Work inside a feature is organised as [stacked PRs](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-stacked-pull-requests), driven with `gh stack`.** A feature branch is the trunk for its own work; each reviewable piece is a branch on top of it, targeting the branch below rather than `main`. That keeps each PR small enough to review honestly without waiting for the whole feature.
- **Only `main` is ever merged *into* a feature branch.** If another feature graduates while yours is alive, merge `main` down to stay current. Never merge `develop` into a feature branch — that is the same contamination as branching from `develop`, arriving through the back door.
- **Exercising a feature in `develop` goes through a throwaway integration branch**, never the feature branch itself. See below.
- **A feature graduates by marking its draft PR ready and merging to `main`.** `main` therefore holds only graduated features, and is always a state worth branching from.
- **`develop` is disposable.** If it gets into a bad state, recreate it from `main` and re-merge whichever features are still in construction. Nothing is lost, because nothing lives only in `develop`.
- **`develop` is refreshed when someone is about to integrate, not when `main` moves.** It is a test bed, not a mirror: `develop` sitting behind `main` with nothing under test is the expected steady state, not drift to correct. Refresh it from `main` at the point you need to exercise something, so the base is current for that run.

### Testing a feature against `develop`

The feature branch has to stay clean enough to merge into `main` at any moment, so it can never absorb `develop`. Integration happens on a separate, disposable branch:

```bash
git checkout feat/thing
git checkout -b integration/thing
git merge origin/develop        # resolve conflicts HERE
git push -u origin integration/thing
gh pr create --base develop     # or push straight to develop
```

- **`integration/*` branches only ever move toward `develop`.** They never merge back into the feature branch and never into `main`. Delete them freely; they hold nothing that matters.
- **Conflicts resolved here are thrown away.** That resolution lives on a branch nobody keeps, so when both features eventually reach `main` someone resolves the same conflict again, possibly differently. Turn on `git rerere` (`git config --global rerere.enabled true`) so git replays your resolution automatically. Better still, treat a conflict found in integration as a signal to fix it at the source, in one of the feature branches, where the fix is permanent.

### Discarding a feature

`main` is untouched by definition — the feature never landed there. Only `develop` needs cleaning, and the way to clean it is to **recreate it, not to revert**:

```bash
git checkout develop
git reset --hard origin/main
# re-merge the integration branches of whatever is still under test
git push --force-with-lease origin develop
```

### When a feature depends on one that has not graduated

Branch it on top of that feature's branch, not on `develop`. Branching from `develop` would pick up every unrelated feature in flight; stacking on the one real dependency picks up only what is actually needed, and the stack unwinds naturally as each piece graduates.

If the dependency is close to graduating, the cheaper move is usually to graduate it first and then cut from `main` as normal.

Plan work with dependencies so it can be released sequentially. "This needs unreleased work, so I will branch from `develop`" is not a solution — it is how unrelated features end up entangled.

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

| Trigger | Channel | dist-tag |
| --- | --- | --- |
| Push to `feat/**`, `fix/**`, `hotfix/**` | canary, `0.0.0-alpha.0.sha-<sha>` | `canary` |
| PR merged into `develop` | beta | `beta` |
| PR merged into `main` | stable | `latest` |

Canary neither commits nor tags, so working-branch builds leave no trace in git.

Version and publish are separate steps. Publishing uses `lerna publish from-package`, which uploads only what the registry is missing, so a failed publish is recovered by re-running the job. `workflow_dispatch` runs that publish alone, for a release that was versioned and tagged but never uploaded.

A breaking change while the packages are `0.x` ships as a **minor** bump, which semver already permits. Use `feat:` without a `BREAKING CHANGE:` footer — that footer recommends a major and would take the packages to `1.0.0` — and put the migration in the commit body and the PR.

## Dependencies

Three guards enforce what the manifests must say. They run in the normal suite:

- **Every package imported by published sources must be declared** as a dependency or peer. `devDependencies` do not count: they are installed here and never for a consumer. A package that resolves only because something else hoists it will break a consumer when that accident stops holding.
- **No dev-only package may be a peer.** `@types/*` and test frameworks are never something a consumer must provide. Marking them optional is not enough — an optional peer edge still counts as a reference from a production dependency, so it survives `npm ci --omit=dev`.
- **Shipped code must not bind eagerly to an optional peer.** `import type`, `export type` and dynamic `import()` are fine; value imports, side-effect imports, `require()` and subpath imports into a package's internals are not.

A dependency between two packages in this repository must be a declared peer in `package.json`, not only a `tsconfig.json` project reference. A project reference satisfies the compiler here and is invisible to npm.

Peer ranges over an internal package must admit prereleases — `>=0.0.12-0 <1`, not `0.x` — because consumers install from the beta channel and `0.x` excludes prereleases.

## Commits

Conventional commits, enforced by commitlint. Lerna derives versions and changelogs from them, so the type is a release decision, not a label.

Write in English. No emoji. No co-author trailers.
