import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const PACKAGES_ROOT = join(__dirname, '..', 'packages');

interface IPackageManifest {
  name: string;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
}

interface IPackageUnderTest {
  name: string;
  optionalPeers: string[];
  sources: string[];
}

function collectPublishedSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectPublishedSources(entryPath);
    }

    // Spec files are excluded from every package's build, so they never ship.
    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.spec.ts')) {
      return [];
    }

    return [entryPath];
  });
}

function readPackages(): IPackageUnderTest[] {
  return readdirSync(PACKAGES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const packageRoot = join(PACKAGES_ROOT, entry.name);
      const manifest = JSON.parse(
        readFileSync(join(packageRoot, 'package.json'), 'utf8'),
      ) as IPackageManifest;

      return {
        name: manifest.name,
        optionalPeers: Object.entries(manifest.peerDependenciesMeta ?? {})
          .filter(([, meta]) => meta.optional === true)
          .map(([peer]) => peer),
        sources: collectPublishedSources(join(packageRoot, 'src')),
      };
    });
}

/**
 * An optional peer may be absent at runtime, so shipped code must never bind to
 * it eagerly. Only three forms are safe, and each is allowed here:
 *
 *   import type { X } from 'pkg'    erased by the compiler
 *   export type { X } from 'pkg'    erased by the compiler
 *   await import('pkg')             evaluated only when actually reached
 *
 * Anything else is reported, including a plain `import { X } from 'pkg'` used
 * solely in type position. That one happens to be erased today, but only
 * because of the current compiler settings — requiring the explicit `type`
 * keyword makes the intent survive a tsconfig change.
 *
 * Subpath imports count as importing the package, so a deep import into a
 * package's internals is caught too.
 */
function findValueImports(source: string, packageName: string): boolean {
  const target = packageName.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
  const specifier = `['"]${target}(?:/[^'"]*)?['"]`;

  const typeOnlyClause = /^\s*(?:import|export)\s+type\b/;
  const patterns = [
    // `import ... from 'pkg'` and `export ... from 'pkg'`.
    new RegExp(`\\bfrom\\s+${specifier}`),
    // Side-effect import. The trailing whitespace requirement keeps the
    // dynamic `import('pkg')` form from matching.
    new RegExp(`\\bimport\\s+${specifier}`),
    new RegExp(`\\brequire\\s*\\(\\s*${specifier}`),
  ];

  return source
    .split('\n')
    .filter((line) => !typeOnlyClause.test(line))
    .some((line) => patterns.some((pattern) => pattern.test(line)));
}

describe('optional peer imports', () => {
  const packages = readPackages();

  it('finds every package', () => {
    expect(packages.length).toBeGreaterThan(0);
  });

  it.each(packages.map((pkg) => [pkg.name, pkg] as const))(
    '%s never binds eagerly to an optional peer',
    (_name, pkg) => {
      const offenders = pkg.optionalPeers.flatMap((peer) =>
        pkg.sources
          .filter((file) => findValueImports(readFileSync(file, 'utf8'), peer))
          .map((file) => `${peer} in ${file}`),
      );

      expect(offenders).toEqual([]);
    },
  );
});
