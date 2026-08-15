import { readFileSync, readdirSync } from 'fs';
import { builtinModules } from 'module';
import { join } from 'path';

const PACKAGES_ROOT = join(__dirname, '..', 'packages');
const BUILTINS = new Set(builtinModules);

interface IPackageManifest {
  name: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface IPackageUnderTest {
  name: string;
  declared: Set<string>;
  imported: Set<string>;
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

/**
 * Reduces an import specifier to the package that must be installed for it to
 * resolve. Subpath imports collapse to their package, so `@nestjs/graphql/dist/x`
 * counts as depending on `@nestjs/graphql`.
 */
function toPackageName(specifier: string): string {
  const segments = specifier.split('/');

  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
}

function collectImports(source: string): string[] {
  // Bare specifiers only: anything starting with `.` is a relative path.
  const pattern = /(?:from\s+|import\s+|require\s*\(\s*)['"]([^'".][^'"]*)['"]/g;

  return [...source.matchAll(pattern)]
    .map((match) => toPackageName(match[1]))
    .filter((name) => !BUILTINS.has(name));
}

function readPackages(): IPackageUnderTest[] {
  return readdirSync(PACKAGES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const packageRoot = join(PACKAGES_ROOT, entry.name);
      const manifest = JSON.parse(
        readFileSync(join(packageRoot, 'package.json'), 'utf8'),
      ) as IPackageManifest;

      const imported = new Set(
        collectPublishedSources(join(packageRoot, 'src')).flatMap((file) =>
          collectImports(readFileSync(file, 'utf8')),
        ),
      );
      imported.delete(manifest.name);

      return {
        name: manifest.name,
        declared: new Set([
          ...Object.keys(manifest.dependencies ?? {}),
          ...Object.keys(manifest.peerDependencies ?? {}),
        ]),
        imported,
      };
    });
}

/**
 * A package that shipped code imports but the manifest never mentions resolves
 * only by accident — because some other dependency happens to hoist it into the
 * consumer's tree. When that accident stops holding, the failure lands on the
 * consumer: a missing type at best, a crash on require at worst.
 *
 * devDependencies deliberately do not count. They are installed here and never
 * for a consumer.
 */
describe('declared imports', () => {
  const packages = readPackages();

  it('finds every package', () => {
    expect(packages.length).toBeGreaterThan(0);
  });

  it.each(packages.map((pkg) => [pkg.name, pkg] as const))(
    '%s declares every package its shipped code imports',
    (_name, pkg) => {
      const undeclared = [...pkg.imported].filter((name) => !pkg.declared.has(name)).sort();

      expect(undeclared).toEqual([]);
    },
  );
});
