import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SOURCE_ROOT = join(__dirname);

function collectPublishedSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectPublishedSources(entryPath);
    }

    // Spec files are excluded from the build (see tsconfig.json), so they never ship.
    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.spec.ts')) {
      return [];
    }

    return [entryPath];
  });
}

/**
 * Matches static bindings only. A dynamic `await import('@nestjs/graphql')` has no
 * `from` clause and no whitespace before the parenthesis, so it is not reported.
 */
function findStaticImports(source: string, packageName: string): boolean {
  const quoted = `['"]${packageName.replace('/', '\\/')}['"]`;
  const patterns = [
    new RegExp(`from\\s+${quoted}`),
    new RegExp(`import\\s+${quoted}`),
    new RegExp(`require\\s*\\(\\s*${quoted}`),
  ];

  return patterns.some((pattern) => pattern.test(source));
}

describe('optional peer dependencies', () => {
  // `@nestjs/graphql` is declared optional in package.json, so it may be absent in
  // REST-only consumers. Any static binding would break them at require time.
  it('does not statically import @nestjs/graphql from published sources', () => {
    const offenders = collectPublishedSources(SOURCE_ROOT).filter((file) =>
      findStaticImports(readFileSync(file, 'utf8'), '@nestjs/graphql'),
    );

    expect(offenders).toEqual([]);
  });
});
