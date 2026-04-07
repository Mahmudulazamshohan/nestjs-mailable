# Repository Guidelines

## Project Structure & Module Organization
Core library code is in `src/`. Key areas:
- `src/services`, `src/mail.module.ts`, `src/index.ts`: public module and service entry points.
- `src/transports`, `src/engines`, `src/factories`: delivery + template runtime layers.
- `src/classes`, `src/builders`, `src/interfaces`, `src/types`: API contracts and builders.
- `src/testing`: reusable test/mocking utilities.
- `src/__tests__`: Jest test suite (`*.spec.ts`).
- `docs/`: Docusaurus documentation site.
- `examples/`: runnable integration examples.

## Build, Test, and Development Commands
Use Node `>=18` and Yarn 1.x (project default).
- `yarn install`: install dependencies.
- `yarn dev`: TypeScript watch build.
- `yarn build`: compile to `dist/`.
- `yarn test`: run Jest tests.
- `yarn test:coverage`: generate coverage report in `coverage/`.
- `yarn lint` / `yarn lint:fix`: lint or auto-fix `src/**/*.ts`.
- `yarn typecheck`: run `tsc --noEmit`.
- `yarn docs:start` / `yarn docs:build`: run/build docs site.

## Coding Style & Naming Conventions
TypeScript-first codebase with ESLint + Prettier.
- Formatting: 2-space indentation, semicolons, single quotes, trailing commas where valid.
- File naming: kebab-case (`mail-config.service.ts`).
- Classes/interfaces: PascalCase. Functions/variables: camelCase. Constants: UPPER_SNAKE_CASE.
- Keep modules focused and prefer explicit types over `any`.

## Testing Guidelines
Framework: Jest (`ts-jest`), tests under `src/__tests__/`.
- Name tests `*.spec.ts` (matches project Jest config).
- Add tests for new behavior and bug fixes (success + failure paths).
- Prefer mocks for external providers (SMTP/SES/Mailgun/Mailjet APIs).
- Run before PR: `yarn test && yarn lint && yarn typecheck && yarn build`.

## Commit & Pull Request Guidelines
Commit style is enforced by Commitlint (`@commitlint/config-conventional`).
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.
- Keep commit scope concise and messages imperative.
- PRs should include: clear description, related issue (`Closes #...`), test evidence, and docs updates when applicable.
- Follow `.github/pull_request_template.md` checklist before requesting review.
