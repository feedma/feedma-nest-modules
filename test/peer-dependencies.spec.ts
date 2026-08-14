import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PACKAGES_ROOT = join(__dirname, '..', 'packages');

/**
 * Peers npm cannot tell apart from runtime ones, but that shipped code never
 * needs. Since npm 7 auto-installs mandatory peers, and the peers of a
 * production dependency are themselves production, leaving these required
 * puts them in every consumer's `npm ci --omit=dev` tree.
 */
const DEV_ONLY_PEERS = [/^@types\//, /^@nestjs\/testing$/];

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

function isDevOnly(peer: string): boolean {
  return DEV_ONLY_PEERS.some((pattern) => pattern.test(peer));
}

describe('peer dependencies', () => {
  const manifests = readManifests();

  it('finds every package manifest', () => {
    expect(manifests.length).toBeGreaterThan(0);
  });

  it.each(manifests.map((manifest) => [manifest.name, manifest] as const))(
    '%s declares no mandatory dev-only peer',
    (_name, manifest) => {
      const mandatory = Object.keys(manifest.peerDependencies ?? {})
        .filter(isDevOnly)
        .filter((peer) => manifest.peerDependenciesMeta?.[peer]?.optional !== true);

      expect(mandatory).toEqual([]);
    },
  );

  it.each(manifests.map((manifest) => [manifest.name, manifest] as const))(
    '%s declares no @types package as a peer at all',
    (_name, manifest) => {
      // A types-only package has no runtime output, so it is never something a
      // consumer must provide — not even optionally.
      const typePeers = Object.keys(manifest.peerDependencies ?? {}).filter((peer) =>
        peer.startsWith('@types/'),
      );

      expect(typePeers).toEqual([]);
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
