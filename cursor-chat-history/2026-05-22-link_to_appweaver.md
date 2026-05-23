# Local Node.js module reference
_Exported on 5/22/2026 at 20:25:36 EDT from Cursor (3.5.17)_

---

**User**

how can i use the build from my local nodejs module at `/Users/kaisershahid/work/projects/appweaver/dist` within this project? i want to reference it as `@acmedinotech/appweaver` (to stay consistent with its npm package)

---

**Cursor**

I'll check how this project manages dependencies and whether there's already a pattern for linking local packages.


You can’t point npm/yarn directly at `.../appweaver/dist` and get a proper package install — the dependency target must be a folder with a `package.json`. Your appweaver package already lives one level up and its `exports`/`main`/`types` all point into `dist`, so you link the **package root**, not `dist` itself.

## Recommended: `file:` dependency (playground)

Since your Next.js app lives at `src/playground/`, add this to `src/playground/package.json`:

```json
{
  "dependencies": {
    "@acmedinotech/appweaver": "file:../../../../appweaver"
  }
}
```

That resolves to `/Users/kaisershahid/work/projects/appweaver`, which npm/yarn will treat as `@acmedinotech/appweaver` and resolve to the built files in `dist/` via its `exports` map.

Then install from the playground directory:

```bash
cd src/playground
yarn install
```

After that you can import normally:

```tsx
import { /* ... */ } from '@acmedinotech/appweaver';
```

Rebuild appweaver when you change it (`npm run build` in the appweaver repo). With a `file:` link, yarn symlinks the package, so updated `dist/` output is picked up — you may need to restart `next dev` if the bundler caches aggressively.

---

## Alternative: `npm link` / `yarn link`

Useful if you’re iterating on appweaver across multiple repos:

```bash
# In appweaver
cd /Users/kaisershahid/work/projects/appweaver
yarn link   # or: npm link

# In the playground
cd /Users/kaisershahid/work/projects/ezdatagrid/react/src/playground
yarn link @acmedinotech/appweaver   # or: npm link @acmedinotech/appweaver
```

Same import name: `@acmedinotech/appweaver`.

---

## If you need it in the **library root** too

Add the same dependency to the root `package.json` (for Jest, Vite, etc.):

```json
"@acmedinotech/appweaver": "file:../../../appweaver"
```

Or use an absolute path if you prefer:

```json
"@acmedinotech/appweaver": "file:/Users/kaisershahid/work/projects/appweaver"
```

---

## What **not** to do

| Approach | Problem |
|---|---|
| Point `file:` at `.../dist` | No `package.json` there — install fails |
| Only `tsconfig` `paths` alias | TypeScript may resolve it, but Next/Vite won’t bundle it unless you also wire up the bundler |
| Import from a relative path to `dist/` | Works, but breaks the `@acmedinotech/appweaver` naming you want |

---

## Optional Next.js tweak

Appweaver ships pre-built ESM/CJS from `dist`, so you usually don’t need extra config. If Next complains about the linked package, add to `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  transpilePackages: ['@acmedinotech/appweaver'],
};
```

---

**Summary:** Add `"@acmedinotech/appweaver": "file:../../../../appweaver"` to `src/playground/package.json`, run `yarn install`, rebuild appweaver when needed, and import as `@acmedinotech/appweaver`. The `dist` folder is used automatically via appweaver’s own `package.json` exports.

