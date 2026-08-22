# ADRs

Architecture Decision Records — single decisions, frozen once accepted.

See [`../README.md`](../README.md) for the full doc system reference.

Start from [`_template.md`](./_template.md).

| ID | Title | Status | Scope |
|----|-------|--------|-------|
| [ADR-0001](./0001-release-channels-and-validation.md) | Nothing reaches latest without a validated prerelease | accepted | repo |
| [ADR-0002](./0002-deprecating-below-1-0-0.md) | Deprecating below 1.0.0 | accepted | repo |
| [ADR-0003](./0003-sibling-peer-ranges.md) | A sibling package is a peer, and its range is `*` | accepted | common, typeorm, graphql, testing |
| [ADR-0004](./0004-publishing-authorised-by-the-registry.md) | Publishing is authorised by the registry, not by a stored token | accepted | common, typeorm, graphql, testing |
| [ADR-0005](./0005-the-pipeline-never-writes-to-main.md) | The pipeline never writes to main, so the version travels in the pull request | proposed | common, typeorm, graphql, testing |
