---
id: SPEC-0001
title: Pagination Contract
status: accepted
scope: [common, typeorm, graphql]
created: 2026-08-14
updated: 2026-08-15
authors: [esalazarv]
related:
  rfcs: [RFC-0001]
  specs: []
  adrs: []
---

# Pagination Contract

Closes the gaps in `#109`, and the adapter noted at the end of `#110`.

## Context

`IPagination` in `nest-common` declares seven fields. Three of them —
`totalMatches`, `firstPage` and `lastPage` — have no producer: the meta
`nestjs-typeorm-paginate` returns carries only `itemCount`, `totalItems`,
`itemsPerPage`, `totalPages` and `currentPage`. Every consuming application
therefore computes those three by hand and independently decides what they
mean. Two consumers will disagree and the interface will not stop them.

Separately, `BaseRepository.paginate` returns the paginator's own
`Pagination<Entity>` (`items` / `meta` / `links`) and accepts the paginator's
own `IPaginationOptions`. The library is part of our public surface on both
sides, so it cannot be replaced without breaking consumers.

### Where the seven fields came from

The contract was ported from an earlier boilerplate, whose adapter maps four
fields and nothing else:

```ts
export function typeormPaginationAdapter(meta: IPaginationMeta): Pagination {
  return new Pagination({
    page: meta.currentPage,
    itemsPerPage: meta.itemsPerPage,
    totalItems: meta.totalItems,
    totalPages: meta.totalPages,
  });
}
```

Its `Pagination` entity declares exactly those four. `totalMatches`,
`firstPage` and `lastPage` were added to `IPagination` later, in this
repository, without an implementation and without a definition. That is why no
paginator produces them and why nobody could articulate what `totalMatches`
meant: it never had a meaning.

## Decision

### `totalMatches` is removed

It was indistinguishable from `totalItems`. Under the origin contract
`totalItems` is the paginator's count — rows matching the query with filters
applied — which is the same number `totalMatches` would carry. A field whose
distinction nobody can state does not have one.

Removing it also dissolves a defaulting question that had no good answer.
`totalMatches ?? totalItems` fails in the direction that hides bugs: a filter
returning nothing looks identical to a filter that was never applied.

### `totalItems` is the filtered count

Rows matching the query, with filters applied. This is what the paginator
produces and what the origin contract meant.

The alternative — `totalItems` as the unfiltered collection total — was
considered and rejected. It requires a second `COUNT` per request over the
whole table, it is often meaningless for scoped resources, and no caller has
asked for it.

### `firstPage` / `lastPage` are `number | null`

`null` when the result set is empty. `1` / `0` is internally contradictory:
`lastPage: 0` alongside `firstPage: 1` describes a range that runs backwards.
`null` states the truth — there is nothing to navigate to — and forces clients
to handle the empty case rather than rendering a pager for one nonexistent
page.

### Emptiness is a property of the result set, not of the page

The rule keys off `totalItems`, never `items.length`:

> `null` means "the result set is empty", not "this page is empty".

A caller requesting page 99 of a four-page result gets `items: []` but keeps
`firstPage: 1` and `lastPage: 4`. That is the only information that lets it
recover, and making the nulls depend on `items.length` would remove it exactly
when it is needed.

Out-of-range is detected as `page > totalPages`. The contract carries no flag
for it, deliberately: the fields already present answer the question, and a
redundant flag is one more thing to keep consistent.

### The library is internal on both sides

`nestjs-typeorm-paginate` must not appear in any public signature of any
package. Input becomes `IPaginationParams`, output becomes `IPage<Entity>`,
both owned by `nest-common`. Replacing the paginator then becomes an internal
change to `nest-typeorm`.

### `countQueries: false` is inexpressible rather than forbidden

The paginator accepts `countQueries: false`, which leaves `totalItems`,
`itemCount`, `itemsPerPage` and `totalPages` **undefined**. The contract cannot
be built honestly from that: `firstPage: totalItems > 0 ? 1 : null` would
silently evaluate to `null`, reporting "no pages" when the truth is "not
counted".

This is not hypothetical. The reference implementation downstream already
builds it dishonestly — it does `result.meta.totalItems ?? 0`, so under
`countQueries: false` it would report an empty result set for a populated
table, silently. Nobody passes that option today, which is precisely what makes
it a landmine rather than a bug: it is reachable, and the code that would
mis-handle it already exists.

Rather than validating the option away, the public input type does not have it.
`IPaginationParams` carries `page` and `limit` only, so `countQueries`, `route`
and `routingLabels` cannot be passed at all. No guard to maintain, no
documentation to ignore.

### No custom adapter extension point

Consumers wanting different field names or extra data transform the returned
object:

```ts
const page = await this.repository.paginate(queryBuilder, params);
return { ...page, pagination: { ...page.pagination, appliedFilters } };
```

An extension point would have to name either the paginator's meta type — the
coupling this design removes — or a mirror of it, which is the same accretion
that produced the problem. Adding an optional transformer over the finished
`IPage` later is a non-breaking addition, so starting without one closes
nothing.

The paginator's own `metaTransformer` is not exposed for the same reason.

## The contract

```ts
export interface IPagination {
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  firstPage: number | null;
  lastPage: number | null;
  page: number;
}

export interface IPage<TData> {
  items: TData[];
  pagination: IPagination;
}
```

The `items` / `pagination` envelope is kept deliberately. It leaves room for
sibling keys — Laravel-style response metadata — without disturbing either
existing key. That extension is out of scope here.

### Field derivation

| Field | Source |
| --- | --- |
| `totalItems` | `meta.totalItems` |
| `itemsPerPage` | `meta.itemsPerPage` |
| `totalPages` | `meta.totalPages`, which is `ceil(totalItems / limit)` |
| `page` | `meta.currentPage` |
| `firstPage` | `totalItems > 0 ? 1 : null` |
| `lastPage` | `totalItems > 0 ? totalPages : null` |

`page` reflects what was requested, not what is valid. The paginator does not
clamp it and neither do we: silently clamping hides a caller's error.

`limit` is clamped to at least `1`. Both fields of `IPaginationParams` are
optional and public, so `limit: 0` is reachable, and `ceil(totalItems / 0)` is
`Infinity` — a negative limit is worse. Unlike `page`, there is no honest
result to report for a page size of zero, so the value is corrected rather than
passed through.

### Examples

Page 2 of 47 matching rows, 15 per page:

```json
{
  "items": ["... 15 entities ..."],
  "pagination": {
    "totalItems": 47,
    "itemsPerPage": 15,
    "totalPages": 4,
    "page": 2,
    "firstPage": 1,
    "lastPage": 4
  }
}
```

Empty result set:

```json
{
  "items": [],
  "pagination": {
    "totalItems": 0,
    "itemsPerPage": 15,
    "totalPages": 0,
    "page": 1,
    "firstPage": null,
    "lastPage": null
  }
}
```

Page out of range, same 47 rows:

```json
{
  "items": [],
  "pagination": {
    "totalItems": 47,
    "itemsPerPage": 15,
    "totalPages": 4,
    "page": 99,
    "firstPage": 1,
    "lastPage": 4
  }
}
```

## Components

### `nest-common`

Owns the contract and nothing else. `IPagination` loses `totalMatches` and
keeps six fields. `IPage` and `IPaginationParams` are unchanged. No dependency
on typeorm or any paginator.

### `nest-typeorm`

`BaseRepository.paginate` accepts `IPaginationParams` and returns
`Promise<IPage<Entity>>`. Both overloads change; the branch dispatch on
`target instanceof SelectQueryBuilder` is unchanged.

An exported `toPagination` function, in its own module, translates the
paginator's meta into `IPagination`. It is the only place in the package that
names a `nestjs-typeorm-paginate` type, and it stays absent from the package
index, so replacing the paginator remains an internal change.

This package gains a declared dependency on `@feedma/nest-common`. It must be a
peer entry in `package.json`, not only a `tsconfig.json` project reference — a
project reference satisfies the compiler here and is invisible to npm, which is
the defect `#122` fixed elsewhere.

Both fields of `IPaginationParams` are optional. The existing
`defaultPaginationOptions` (`{ page: 1, limit: 15 }`) continues to fill the
gaps, and the existing `TODO` about making it configurable from outside is
neither resolved nor worsened here.

Only the **paginator** is hidden. TypeORM's own types stay in the signature —
`SelectQueryBuilder<Entity>` in the first overload, `FindOptionsWhere<Entity>`
and `FindManyOptions<Entity>` in the second. TypeORM is a legitimate required
peer of this package and a caller building a query builder already depends on
it. The goal is replacing the paginator without breaking consumers, not
abstracting the ORM.

### `nest-graphql`

`Pagination` drops `totalMatches` and widens `firstPage` / `lastPage` to
`number | null`, fixing defect 1 of `#109`. The current declarations are
`number`, which `implements IPagination` cannot catch: narrowing an
implementation to `number` is assignable to `number | null`, so the check only
runs in the harmless direction. The bite is backwards from the contract — a
caller assigning the `null` the interface permits gets a type error against the
class.

This bite requires `strictNullChecks` to be enabled at the call site. This
repository's root `tsconfig.json` sets `strict: true` and then overrides
`strictNullChecks: false`, so `null` is assignable to a plain `number` here:
the repository's own typecheck does not enforce it, and does not exercise this
protection. It applies to a consumer compiling with `strictNullChecks` on,
which is the default `strict: true` gives elsewhere.

`PaginatedResult<T>` is unchanged.

## When not to use this contract

A page contract is for a **listing the caller browses**. A range or cursor
contract is for a **sequence the caller addresses**, or for a **collection that
changes underneath the reader**. Three smells indicate this contract is being
forced.

**1. The client computes `floor(position / limit)` to construct a request.**
It is translating a coordinate it already holds into a page number it does not
want. Pages are a lossy encoding of that coordinate: "give me 20 items starting
at index 4,193, because that is where the user was" is not a browsing question.

**2. The word "page" already means something else in that domain.** Publishing
a second, unrelated meaning of "page" in the same payload is a naming collision
in the one place it does damage.

**3. The collection changes while a client is paging through it.** Offset
pagination addresses a position in a result set, so a concurrent insert above
the window shifts an item down and it is served twice; a delete skips one. No
amount of correct page arithmetic prevents this, because the offset addresses a
result set that no longer exists. If the list is written to by anyone other than
the reader, or by the reader in a way that reorders it, a cursor is the correct
contract.

Smells 1 and 2 are the addressing argument; smell 3 is independent of it. A
team can answer "my client browses sequentially, pages fit" correctly and still
ship duplicates, because stability is a separate question that has to be asked
on its own.

The first two are drawn from a real rejection downstream: a reader application
declined this contract for long-form content served as a densely indexed
sequence, where the client computes its own visual pagination against the
viewport, and where reads are windows around a saved position rather than
sequential browsing. It also avoided a `COUNT` on the highest-frequency
operation in that application, since a range read can carry a precomputed total.

The third smell comes from the cases that same shape hits next: a discovery feed
and search over a catalogue written to by someone other than the reader, where
offset pagination is a correctness bug rather than a matter of taste.

Recording this is the point. Without a stated boundary, the first team with a
sequence will reach for the only pagination contract the organisation offers.

What lies beyond the boundary is analysed in `RFC-0001`, which argues that a
cursor contract should be lifted from a working implementation rather than
designed in the abstract — for the same reason `totalMatches` had to be removed
from this one.

## Consequences

`BaseRepository.paginate` changes both its parameter and return types.
Consumers on `@feedma/nest-typeorm@0.0.3` read `result.items` and
`result.meta`; they will read `result.items` and `result.pagination`, and pass
`{ page, limit }` rather than the paginator's options object.

Removing `totalMatches` from `IPagination` is separately breaking for anyone
populating it, and removes a field from the GraphQL schema.

Two usage patterns were measured across the applications consuming these
packages, rather than assumed.

**Result mapped locally before it leaves the service.** One call site, plus a
hand-written adapter that this contract replaces, plus its tests. Cheap: the
mapping was already isolated, and deleting it is most of the migration.

**Result returned straight through as the service return type.** Three call
sites. The input needs no change — they already pass exactly `{ page, limit }` —
and none passes `route`, so `links` is always `{}` and its removal costs
nothing. All three carry `as Pagination<Entity>`, the `#110` workaround, which
the new return type makes unnecessary.

This second pattern is where the real cost lands, and it is not internal:
returning the paginated object directly means the **HTTP response shape**
changes from `{ items, meta, links }` to `{ items, pagination }`. That is a
public API change for whatever calls those services, not a refactor.

Neither is exposed on our schedule. Both pin caret ranges over `0.0.x`
prereleases — `^0.0.11-alpha.4`, `^0.0.2-alpha.4` — which semver treats as
locked to that patch line: `^0.0.11-alpha.4` does not even reach `0.0.12`. They
receive nothing until someone edits the range deliberately, which is also why
neither has picked up the recent fixes.

### Version

This releases as `0.1.0`, not `1.0.0`.

A `BREAKING CHANGE:` footer would make conventional-commits recommend a major
bump and take all four packages to `1.0.0`. In `0.x` semver already permits
anything to change, so a minor bump is the idiomatic way to signal a break
before `1.0`. Declaring the API stable now would be premature: `IPagination`
changed shape twice in a single release cycle, `#123` will likely change
`useContextRequest`'s signature, and `RFC-0001` anticipates a cursor contract
that may move the envelope again. Shipping `1.0.0` and needing `2.0.0` shortly
after communicates worse than staying in `0.x`.

The mechanical cost: the commit must be `feat:` **without** the
`BREAKING CHANGE:` footer, since that footer is what triggers the major. The
migration note goes in the commit body and the pull request, so the changelog
carries it as prose rather than under the standard breaking-change heading.

## Alternatives

**Define `totalMatches` instead of removing it.** Rejected: no definition
survived contact with the paginator. Treating `totalItems` as the unfiltered
total to make room for it costs a second `COUNT` per request and inverts the
mapping the origin used.

**`firstPage` / `lastPage` as `1` / `0` on empty.** Rejected: describes a range
running backwards, and lets a client render a pager for a page that does not
exist.

**Export the adapter, or accept a custom one.** Rejected: either form has to
name the paginator's types in a public signature, which is the coupling being
removed. Consumers reshape the returned object instead.

**Validate `countQueries: false` and reject it.** Rejected in favour of an input
type that cannot express it. A guard has to be maintained and can be bypassed by
the next option the library adds; a narrower type cannot.

## Out of scope

- Response metadata as a third envelope key.
- A cursor or range contract. The boundary section says when one is needed,
  including the instability case that is its strongest justification; it does
  not design one.
- Replacing `nestjs-typeorm-paginate`. This design makes that possible later
  without touching consumers; it does not do it.

## Testing

- Field derivation per the table above, including the two nullable fields.
- The three examples as cases: normal page, empty result set, page out of
  range. The third is the regression guard for emptiness keying off
  `totalItems` rather than `items.length`.
- `limit: 0` and a negative limit, asserting the clamp rather than `Infinity`
  or a negative page count.
- Overload dispatch, unchanged in behaviour but easy to break: query builder
  mocks must be built with `Object.create(SelectQueryBuilder.prototype)`, since
  a plain object fails `instanceof` and silently takes the find-options branch,
  paginating the whole table while the test still passes.
- A compile-time assertion that `paginate` returns `IPage<Entity>` and not
  `IPage<unknown>`, in the style of the existing `Pagination<Entity>`
  assertion.
- The existing dependency guards cover the new `nest-typeorm` to `nest-common`
  edge automatically.
