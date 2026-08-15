---
id: RFC-0001
title: Cursor Pagination
status: draft
scope: [common, typeorm]
created: 2026-08-14
updated: 2026-08-14
authors: [esalazarv]
related:
  rfcs: []
  specs: [SPEC-0001]
  adrs: []
---

# Cursor Pagination

## Summary

`SPEC-0001` states three cases where the page contract is the wrong tool, and
points at a cursor contract as the answer for the third. This RFC records what a
cursor contract in these packages would look like, which parts generalise and
which do not, and argues that **we should not build it until a real
implementation exists downstream to lift it from**.

It is filed as a `draft` on purpose. Its job right now is to stop the analysis
being re-derived, not to authorise work.

## Motivation

`SPEC-0001` names the boundary but does not design what lies beyond it. Without
this written down, two things happen. Someone hits the boundary, finds no
guidance, and either forces the page contract onto a feed — shipping duplicate
and skipped items — or invents a private cursor contract that diverges from
whatever we eventually publish.

The second failure is the more expensive one, because it is invisible until we
try to standardise.

## Current state

`nest-typeorm` offers one pagination contract: offset pages, via
`BaseRepository.paginate`. `nest-common` owns the types.

No application consuming these packages implements cursor pagination today. The
cases that would need it — a discovery feed, and search over a catalogue written
to by someone other than the reader — are on a roadmap, not built.

One adjacent implementation exists and is **not** a cursor: long-form content
read by range over a dense contiguous index, which works because the index is
dense and would not generalise.

## Proposal

### There are three contracts, not two

| Contract | Addresses by | Correct when |
| --- | --- | --- |
| **Page** | page number and size | The caller browses a listing, and the collection is stable enough that a shifted window is acceptable |
| **Range** | a domain index | The collection has a dense, contiguous index the caller already holds |
| **Cursor** | an opaque keyset | The collection changes underneath the reader, or has no natural index |

The **range** contract is not a candidate for these packages. Its query is one
line, and its correctness depends entirely on a property of the consumer's data
model — a dense contiguous index — that a library can neither provide nor
verify. A shared type would carry no shared behaviour.

The **cursor** contract is the candidate.

### What generalises cleanly

- The response envelope. `{ items, pagination }` already works; only the shape
  of `pagination` differs — `nextCursor`, `previousCursor`, `hasMore`,
  `itemsPerPage` instead of page counts.
- The request parameters: `{ cursor?, limit? }`.
- The cursor codec: encoding a keyset into an opaque, tamper-evident string and
  decoding it back.

### What does not

Four things, all of which can be parameterised, and each of which becomes
public API the moment it is:

1. **The sort key.** A cursor requires a total, stable ordering — typically
   `(column, id)`. Which column depends on the entity and the query.
2. **The comparison predicate.** Keyset paging compares tuples:
   `WHERE (created_at, id) < (:a, :b)`. Postgres and MySQL support row-value
   comparison; not every engine does. TypeORM abstracts the engine, and this
   un-abstracts it.
3. **Nullable sort columns.** If the ordering column admits `NULL`, keyset
   comparison breaks quietly — null ordering differs by engine and the cursor
   skips rows rather than failing.
4. **A conflicting `ORDER BY`** already present on the query builder we receive.

So the consumer-specific parts are parameterisable. The problem is not
feasibility; it is that every parameter is a contract decision frozen on
publish.

### Recommendation: wait for an implementation to lift

Do not design this in the abstract. Wait until a consuming application builds a
feed or a search over a shared collection, watch it work, then lift the contract
from it.

The argument is not YAGNI in general — it is specific and local. **Designing a
contract with no producer is exactly how `totalMatches` happened.** Three fields
were added to `IPagination` because they looked reasonable, with nothing
implementing them. Neither the maintainer, nor the consumer, nor a reviewer
could later state what one of them meant. `SPEC-0001` removes it, and the
evidence that settled the question was the origin implementation, not an
argument.

The page contract is being fixed right now by that opposite method: a working
implementation existed downstream, was used, had its defects found in
production-adjacent conditions, and is being lifted with its decisions
challenged one by one. Cursor pagination is strictly more subtle than page
pagination — four failure modes above, three of them silent. It deserves more
evidence before publishing, not less.

## Alternatives considered

**Publish the cursor types now, implementation later.** Consumers would code
against a shared shape immediately, and a private divergence becomes less
likely. Rejected: a type with no producer is precisely the failure this
repository just spent a release cycle undoing. The shape would be guesswork —
in particular whether `previousCursor` is worth carrying, which depends on
whether any real client pages backwards.

**Implement it fully now, against a synthetic case.** Rejected: the four
un-generalised parts would be decided against an example we invented, and the
silent failure modes — null ordering, engine-specific tuple comparison — are
exactly the ones a synthetic test does not surface. Frozen on publish, wrong,
and expensive to change.

**Declare cursors out of scope permanently and let each consumer implement
their own.** Tenable, and the honest fallback if a second real case never
appears. Rejected as a default because the codec and envelope genuinely do
generalise, and divergent cursor encodings across services are hard to
reconcile later. Worth revisiting if the feed ships and stays the only case.

## Trade-offs

Waiting means the first consumer to need cursors writes it themselves, and pays
for it twice — once in their own repository, once in migrating to whatever we
publish. That is a real cost and this RFC accepts it deliberately: it buys a
contract shaped by a working implementation rather than by a guess.

It also means that if two consumers reach for cursors at nearly the same time,
we may get two divergent implementations to reconcile instead of one to lift.
The mitigation is this document existing: the second one should find it and
coordinate.

## Open questions

- Does any real client need to page **backwards**? It determines whether
  `previousCursor` exists at all. No evidence either way today.
- Should the cursor be signed, or merely opaque? A signed cursor prevents
  clients from forging positions into data they should not reach; it also makes
  cursors non-portable across deployments if the key rotates.
- Do we want the envelope to be shared across contracts? Making `IPage` generic
  over its pagination shape — `IPage<TData, TPagination = IPagination>` — is a
  cheap, non-breaking way to keep that door open without declaring any cursor
  semantics. Worth doing only if it costs nothing when `SPEC-0001` is
  implemented; not worth doing as speculative preparation.
- Does the range contract deserve a shared type after all, once a second
  consumer has a dense-index resource? One case is not a pattern.
