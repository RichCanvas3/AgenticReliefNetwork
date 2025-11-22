## ARR Monorepo

This `arr` directory is a **pnpm-based monorepo** for the Agentic Relief Network.

### Structure

- **Root**
  - `package.json`: Monorepo metadata and shared scripts.
  - `pnpm-workspace.yaml`: pnpm workspace configuration.
  - `.gitignore`: Node / pnpm / build artifacts ignored.
  - `LICENSE`: MIT license for this monorepo.
  - `README.md`: This file.
- **Workspaces**
  - `apps/*`: Application projects.
  - `packages/*`: Shared libraries and utilities.

Initial example workspaces:

- `apps/example-app`: Minimal Node-based example app.
- `packages/example-lib`: Minimal shared library used by the example app.

### Getting Started

From the `arr` directory:

```bash
pnpm install
pnpm dev
```

The `dev` script runs `dev` in all workspaces that define it.

### Common Commands

- **Install dependencies in all workspaces**

```bash
pnpm install
```

- **Run dev across workspaces**

```bash
pnpm dev
```

- **Run build across workspaces**

```bash
pnpm build
```

- **Run tests across workspaces**

```bash
pnpm test
```

### Adding New Apps / Packages

- **New app**: create a folder under `apps/your-app-name` with its own `package.json`.
- **New package**: create a folder under `packages/your-package-name` with its own `package.json`.

Ensure each workspace has `"private": true` (for apps) or a proper `name` and `version` (for publishable packages), and that scripts like `dev`, `build`, `lint`, and `test` are defined as needed.


