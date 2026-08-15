---
id: SPEC-NNNN
title: Document title
status: draft
scope: [common]
created: YYYY-MM-DD
updated: YYYY-MM-DD
authors: [esalazarv]
related:
  rfcs: []
  specs: []
  adrs: []
---

# Document title

## Context

What forces make this necessary? Prior decisions, constraints, the defect being closed. Link the issues this closes.

## Decision

Each decision under its own heading, with the reasoning that settled it. State the rejected reading too — a decision without its alternative reads as an assumption.

## The contract

The published interface, as code. Types, field derivations, worked examples including the edge cases.

These packages are consumed by other repositories, so anything in this section is a contract with those consumers. Be exact.

## Components

What changes in each package, and what deliberately does not.

Note any new dependency edge between packages: it must be a declared peer in `package.json`, not only a `tsconfig.json` project reference. A project reference satisfies the compiler here and is invisible to npm.

## When not to use this

If the thing being specified is a general-purpose contract, say what it is *not* for. Without a stated boundary, the first team with an adjacent problem will reach for it anyway.

## Consequences

What breaks, and what consumers must do about it. If a published interface changes, say which version they are coming from and what the migration is.

## Alternatives

What was considered and rejected, with the reason for each rejection.

## Out of scope

What this deliberately does not do, so the next reader does not assume it was forgotten.

## Testing

What must be tested, including the edge cases the contract section named. Name the traps a test could pass through without catching.
