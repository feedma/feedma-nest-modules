import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { satisfies } from 'semver';

const PACKAGES_ROOT = join(__dirname, '..', 'packages');

/**
 * Packages no shipped code imports, so declaring them as peers asserts
 * something untrue. Marking them optional is not enough: an optional peer edge
 * still counts as a reference from a production dependency, so npm cannot mark
 * the package dev-only for a consumer that also declares it itself, and it
 * survives `npm ci --omit=dev`. They must not be peers at all.
 */
const NON_PEERS = [/^@types\//, /^@nestjs\/testing$/];

const INTERNAL_SCOPE = '@feedma/';

interface IPackageManifest {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
}

function readManifests(): IPackageManifest[] {
  return readdirSync(PACKAGES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(PACKAGES_ROOT, entry.name, 'package.json'))
    .map((path) => JSON.parse(readFileSync(path, 'utf8')) as IPackageManifest);
}

function isNonPeer(peer: string): boolean {
  return NON_PEERS.some((pattern) => pattern.test(peer));
}

describe('peer dependencies', () => {
  const manifests = readManifests();
  const siblingVersions = new Map(manifests.map((manifest) => [manifest.name, manifest.version]));

  it('finds every package manifest', () => {
    expect(manifests.length).toBeGreaterThan(0);
  });

  it.each(manifests.map((manifest) => [manifest.name, manifest] as const))(
    '%s declares no package that shipped code never needs',
    (_name, manifest) => {
      const declared = Object.keys(manifest.peerDependencies ?? {}).filter(isNonPeer);

      expect(declared).toEqual([]);
    },
  );

  it.each(manifests.map((manifest) => [manifest.name, manifest] as const))(
    '%s references a sibling package as a peer, never a dependency',
    (_name, manifest) => {
      // A second copy of a sibling breaks class identity, and class identity is
      // load-bearing here: `instanceof` checks on the shared exception type, and
      // Nest injection tokens. A peer resolves to one copy; a dependency can be
      // duplicated when the consumer's own range diverges.
      const asDependency = Object.keys(manifest.dependencies ?? {}).filter((name) =>
        name.startsWith(INTERNAL_SCOPE),
      );

      expect(asDependency).toEqual([]);
    },
  );

  it.each(manifests.map((manifest) => [manifest.name, manifest] as const))(
    '%s declares a sibling peer range that admits the version it ships beside',
    (_name, manifest) => {
      // The invariant, not the workaround. `*` satisfies it today because lerna
      // does not rewrite sibling peer ranges when it bumps: a bounded range goes
      // stale on the next sibling release and the version step aborts. But a
      // bounded range that does admit the current version is equally valid, so
      // the rule does not have to be revisited if that ever changes — and unlike
      // `*` it would also catch a major skew.
      //
      // `*` is exempted because npm accepts it for prereleases while
      // semver.satisfies does not. Measured against npm; the spec disagrees.
      //
      // This catches a range that has already gone stale, not one that is about
      // to: the check runs against the version in the tree, and the bump that
      // invalidates a bounded range happens after it. Only `*` survives a bump
      // unattended.
      const stale = Object.entries(manifest.peerDependencies ?? {})
        .filter(([name]) => name.startsWith(INTERNAL_SCOPE))
        .filter(([name, range]) => {
          const shipped = siblingVersions.get(name);

          return shipped !== undefined && range !== '*' && !satisfies(shipped, range);
        })
        .map(([name, range]) => `${name}@${range} does not admit ${siblingVersions.get(name)}`);

      expect(stale).toEqual([]);
    },
  );

  it.each(manifests.map((manifest) => [manifest.name, manifest] as const))(
    '%s marks every optional peer as an actual peer',
    (_name, manifest) => {
      const orphans = Object.keys(manifest.peerDependenciesMeta ?? {}).filter(
        (peer) => !(peer in (manifest.peerDependencies ?? {})),
      );

      expect(orphans).toEqual([]);
    },
  );
});
