# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.3.1](https://github.com/feedma/feedma-nest-modules/compare/%40feedma%2Fnest-common%400.3.0...%40feedma%2Fnest-common%400.3.1) (2026-08-17)

**Note:** Version bump only for package @feedma/nest-common

# [0.3.0](https://github.com/feedma/feedma-nest-modules/compare/%40feedma%2Fnest-common%400.2.0...%40feedma%2Fnest-common%400.3.0) (2026-08-16)

### Features

- **common:** drop the uuid peer for the built-in randomUUID ([4743118](https://github.com/feedma/feedma-nest-modules/commit/4743118fdc86b9facdb1c54e7555b1f11b61fa5a)), closes [#134](https://github.com/feedma/feedma-nest-modules/issues/134) [#135](https://github.com/feedma/feedma-nest-modules/issues/135)

### BREAKING CHANGES

- **common:** removing a peer only relaxes what they must install.
  Anyone needing v1, v5 or v7 still adds uuid themselves, they simply are
  not forced to. An earlier draft of this message carried the conventional
  `!` marker, which would have recommended a major and taken these 0.x
  packages to 1.0.0 for a change that requires less of consumers, not more.

  This also settles the range question left open in #135. Widening the peer
  to admit uuid 14 fails, and did so silently at first: with the range
  widened but 11 still in the tree the suite passed, because it never
  resolved 14. Once 14 was actually installed, three suites failed — it
  ships ESM and Jest's module registry cannot parse it. Removing the
  dependency answers the question instead of negotiating it.

  The declared-imports guard needed a fix to accept this: `builtinModules`
  lists bare names, so `node:crypto` was reported as undeclared while
  `crypto` would not have been. Confirmed it still catches a genuinely
  undeclared package after the change.

# [0.2.0](https://github.com/feedma/feedma-nest-modules/compare/%40feedma%2Fnest-common%400.1.1...%40feedma%2Fnest-common%400.2.0) (2026-08-16)

### Features

- support nestjs-cls 6 alongside 5 ([9b0a541](https://github.com/feedma/feedma-nest-modules/commit/9b0a541207fa1b29db1d79ef0adf00c5bc9d4163))

## [0.1.1](https://github.com/feedma/feedma-nest-modules/compare/%40feedma%2Fnest-common%400.1.0...%40feedma%2Fnest-common%400.1.1) (2026-08-16)

**Note:** Version bump only for package @feedma/nest-common

# [0.1.0](https://github.com/feedma/feedma-nest-modules/compare/%40feedma%2Fnest-common%400.0.13...%40feedma%2Fnest-common%400.1.0) (2026-08-15)

### Features

- **common:** drop totalMatches from IPagination ([bc7ebce](https://github.com/feedma/feedma-nest-modules/commit/bc7ebcedda4294bda55b5a6f251e702a13b7b4aa))

## [0.0.13](https://github.com/feedma/feedma-nest-modules/compare/%40feedma%2Fnest-common%400.0.13-beta.0...%40feedma%2Fnest-common%400.0.13) (2026-08-15)

**Note:** Version bump only for package @feedma/nest-common

## [0.0.13-beta.0](https://github.com/feedma/feedma-nest-modules/compare/%40feedma%2Fnest-common%400.0.12-beta.3...%40feedma%2Fnest-common%400.0.13-beta.0) (2026-08-15)

## 0.0.12 (2026-08-14)

**Note:** Version bump only for package @feedma/nest-common

## [0.0.12-beta.3](https://github.com/feedma/feedma-nest-modules/compare/%40feedma%2Fnest-common%400.0.12-beta.2...%40feedma%2Fnest-common%400.0.12-beta.3) (2026-08-15)

### Bug Fixes

- declare every package the shipped code imports ([0c283ad](https://github.com/feedma/feedma-nest-modules/commit/0c283ad5ed742b9c4e430e28d1a1ef108da8ee51))

## [0.0.12](https://github.com/feedma/feedma-nest-modules/compare/%40feedma%2Fnest-common%400.0.12-beta.2...%40feedma%2Fnest-common%400.0.12) (2026-08-14)

**Note:** Version bump only for package @feedma/nest-common

## [0.0.12-beta.2](https://github.com/feedma/feedma-nest-modules/compare/%40feedma%2Fnest-common%400.0.12-beta.1...%40feedma%2Fnest-common%400.0.12-beta.2) (2026-08-14)

### Bug Fixes

- drop @nestjs/testing as a peer and declare @nestjs/graphql in testing ([96f7b59](https://github.com/feedma/feedma-nest-modules/commit/96f7b59568dcd365a81ff460ca4ebcb9cd8f5b28)), closes [#107](https://github.com/feedma/feedma-nest-modules/issues/107)

## [0.0.12-beta.1](https://github.com/feedma/feedma-nest-modules/compare/%40feedma%2Fnest-common%400.0.12-beta.0...%40feedma%2Fnest-common%400.0.12-beta.1) (2026-08-14)

### Bug Fixes

- stop requiring test-only and types-only peers ([08ad419](https://github.com/feedma/feedma-nest-modules/commit/08ad419960924469240239e2f033167bff1e451c)), closes [#111](https://github.com/feedma/feedma-nest-modules/issues/111)

## [0.0.12-beta.0](https://github.com/feedma/feedma-nest-modules/compare/%40feedma%2Fnest-common%400.0.11...%40feedma%2Fnest-common%400.0.12-beta.0) (2026-08-14)

**Note:** Version bump only for package @feedma/nest-common

## [0.0.11](https://github.com/feedma/feedma-nest-modules/compare/%40feedma%2Fnest-common%400.0.11-alpha.5...%40feedma%2Fnest-common%400.0.11) (2026-08-14)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.11-alpha.5 (2026-08-14)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.11-alpha.4 (2025-12-06)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.11-alpha.3 (2025-12-06)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.11-alpha.2 (2025-12-06)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.11-alpha.1 (2025-12-06)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.11-alpha.0 (2025-12-06)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.10 (2025-04-01)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.10-alpha.4 (2025-04-01)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.10-alpha.3 (2025-04-01)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.10-alpha.2 (2025-04-01)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.10-alpha.1 (2025-04-01)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.10-alpha.0 (2024-09-28)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.9 (2024-09-27)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.9-alpha.0 (2024-09-27)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.8 (2024-05-05)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.8-alpha.2 (2024-05-05)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.8-alpha.1 (2024-05-05)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.8-alpha.0 (2024-05-05)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.7 (2024-05-04)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.7-alpha.2 (2024-05-04)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.7-alpha.1 (2024-05-04)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.7-alpha.0 (2024-05-04)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.6 (2024-05-04)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.6-alpha.0 (2024-05-04)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.5 (2024-05-04)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.5-alpha.0 (2024-05-04)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.4 (2024-05-04)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.4-alpha.0 (2024-05-04)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.3 (2024-04-23)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.3-alpha.0 (2024-04-23)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.2 (2024-04-21)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.2-alpha.2 (2024-04-21)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.2-alpha.1 (2024-04-21)

**Note:** Version bump only for package @feedma/nest-common

## 0.0.2-alpha.0 (2024-04-21)

**Note:** Version bump only for package @feedma/nest-common
