# Docs

Source of truth for design and decisions in `feedma-nest-modules`. Both humans and AI agents read and write here.

Mirrors the doc system used in the `ebook-reader-workspace`, so a reader moving between the two repositories finds the same shapes.

## What lives where

| Path | Purpose |
|------|---------|
| [`rfcs/`](./rfcs) | **RFCs** — proposals: the *what* and *why* |
| [`specs/`](./specs) | **Specs** — implementation designs: the *how* |
| [`adrs/`](./adrs) | **ADRs** — single architecture decisions, frozen once accepted |
| [`archive/`](./archive) | Archived RFCs/specs/ADRs (no longer active) |

Directories are created when the first document of that type is written.

## Document types

| Type | Use when | Length |
|------|----------|--------|
| **RFC** | Proposing a non-trivial change. Open question, needs discussion before committing to *how*. | Whatever the topic needs |
| **Spec** | Detailing implementation of an accepted RFC, or a self-contained piece of work that needs an interface contract. | Whatever the topic needs |
| **ADR** | Recording a single architecture decision. Short, frozen once accepted. | 1–2 pages |

A spec usually links back to an RFC. An ADR can stand alone or be referenced from a spec.

These packages are consumed by other repositories, so a spec that changes a published interface is a contract with those consumers, not only with this codebase. State what breaks and what consumers must do.

## Lifecycle

```
draft -> proposed -> accepted -> implemented -> archived
                         |
                         +-> rejected   -> archived
                         +-> superseded -> archived
```

| Status | Meaning |
|--------|---------|
| `draft` | Author still writing. Not for review. |
| `proposed` | Open for review. The PR is the discussion. |
| `accepted` | Agreed. RFC: build it. Spec: this is the contract. ADR: this is the decision. |
| `implemented` | The work has shipped (RFC/Spec only; ADRs skip this). |
| `archived` | No longer active. Lives under `archive/<type>/`. |

Status transitions are manual: a PR updates the `status` field in frontmatter.

## Frontmatter (required on every doc)

```yaml
---
id: SPEC-0001                  # RFC-NNNN | SPEC-NNNN | ADR-NNNN
title: Document title
status: draft                  # draft | proposed | accepted | implemented | archived
scope: [typeorm]               # any of: common, typeorm, graphql, testing, repo
created: 2026-08-14
updated: 2026-08-14
authors: [esalazarv]
related:
  rfcs: []
  specs: []
  adrs: []
---
```

`scope` names the packages a document affects. Use `repo` for repository-wide concerns such as tooling or the release pipeline.

## Naming

`NNNN-kebab-case-slug.md`, numbered per type, starting at `0001`. Numbers are never reused, including for archived documents.

## Not tracked

`docs/superpowers/` holds working artifacts from agent tooling. It is gitignored: those are scratch notes, not decisions. Anything worth keeping is written up here instead.
