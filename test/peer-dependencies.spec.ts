import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PACKAGES_ROOT = join(__dirname, '..', 'packages');

/**
 * Packages no shipped code imports, so declaring them as peers asserts
 * something untrue. Marking them optional is not enough: an optional peer edge
 * still counts as a reference from a production dependency, so npm cannot mark
 * the package dev-only for a consumer that also declares it itself, and it
 * survives `npm ci --omit=dev`. They must not be peers at all.
 */
const NON_PEERS = [/^@types\//, /^@nestjs\/testing$/];

interface IPackageManifest {
  name: string;
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
    '%s marks every optional peer as an actual peer',
    (_name, manifest) => {
      const orphans = Object.keys(manifest.peerDependenciesMeta ?? {}).filter(
        (peer) => !(peer in (manifest.peerDependencies ?? {})),
      );

      expect(orphans).toEqual([]);
    },
  );
});
