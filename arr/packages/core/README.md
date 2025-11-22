## `@my-scope/core`

React + TypeScript core UI primitives for the ARR monorepo.

### Installation

Using **pnpm** (recommended in this monorepo):

```bash
pnpm add @my-scope/core
```

Using **npm**:

```bash
npm install @my-scope/core
```

Using **yarn**:

```bash
yarn add @my-scope/core
```

This package has **peer dependencies**:

- `react >=18`
- `react-dom >=18`

Ensure they are installed in your consuming app.

### Usage

Example usage in a React 18 application:

```tsx
import * as React from "react";
import { CoreButton, useToggle } from "@my-scope/core";

export function Example() {
  const [on, toggle] = useToggle(false);

  return (
    <div>
      <CoreButton variant="primary" onClick={toggle}>
        Toggle
      </CoreButton>
      <div>Current value: {on ? "ON" : "OFF"}</div>
    </div>
  );
}
```

### Building the Library

From the monorepo root (`arr`):

```bash
pnpm build
```

This runs `tsup` in this package and emits:

- CommonJS: `dist/index.cjs`
- ESM: `dist/index.esm.js`
- Type declarations: `dist/index.d.ts` (and maps)

You can also build just this package:

```bash
cd packages/core
pnpm build
```

### Testing

This package uses **Vitest** for tests.

From the monorepo root:

```bash
pnpm test
```

Or from inside the package:

```bash
pnpm test
pnpm test:watch
```

### Development

For local iterative builds:

```bash
cd packages/core
pnpm dev
```

This runs `tsup` in watch mode and rebuilds the library on changes.


