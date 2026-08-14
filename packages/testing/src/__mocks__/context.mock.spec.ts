import { argumentHostMock, gqlExecutionContextMock } from './context.mock';

/**
 * `@nestjs/graphql` is an optional peer, so `GraphQLExecutionContext` is only
 * resolvable where a consumer installs it. When it is not — or when the mock
 * goes back to importing it through a path that does not resolve — the type
 * silently degrades to `any` instead of failing: `skipLibCheck` is on here, as
 * it is in every Nest scaffold, and it suppresses errors originating in .d.ts
 * files. The mock keeps compiling with no type safety at all.
 *
 * These assertions are the only shape that detects that. An `IsAny<T>`
 * conditional-type probe does not: it reports nothing against a type that is
 * genuinely `any`. Assigning to an incompatible type does, because only `any`
 * accepts everything.
 *
 * The checks run under `npm run typecheck`, not under jest — ts-jest is
 * configured with `isolatedModules`, so it transpiles without type checking.
 */
describe('context mocks', () => {
  it('types the graphql execution context, rather than degrading to any', () => {
    // @ts-expect-error a GraphQLExecutionContext is not assignable to a number.
    // If this directive is ever reported as unused, the type has become `any`.
    const mustNotAcceptANumber: number = gqlExecutionContextMock;

    expect(mustNotAcceptANumber).toBeDefined();
  });

  it('types the arguments host, rather than degrading to any', () => {
    // Control: this one resolves through @nestjs/common, a mandatory peer, so
    // it holds even where the graphql assertion above legitimately cannot.
    // @ts-expect-error an ArgumentsHost is not assignable to a number.
    const mustNotAcceptANumber: number = argumentHostMock;

    expect(mustNotAcceptANumber).toBeDefined();
  });
});
