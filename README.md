# Wedding Address Book — Coding Challenge

A small Vue 3 + Vite app (written with the **Options API**) that collects guest addresses and additional-guest details for a wedding invitation. Your job is to take it from a half-finished demo to a working, well-organized, full-stack TypeScript app.

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:8080/`. There is no backend in the repo — the form makes requests to `/api/*` (see `src/service.js`). You will add the backend in **Step 2**.

## What's in the Box

- `index.html` — Entry HTML; mounts the app into `#root`.
- `src/index.js` — Bootstraps Vue and mounts `<AddressBook />`.
- `src/AddressBook.vue` — The entire form as a single Options-API component: data fetching, loading state, access-denied screen, address fields, additional-guests list, submission state, and confirmation screen — template, `<script>`, and `<style>` all in one file.
- `src/service.js` — Thin `fetch` wrapper that talks to `/api/form`, `/api/view`, `/api/submit`, and `/api/link`.
- `vite.config.js` — Vite + Vue config. It already proxies `/api` to a backend on port `8081` (override with the `API_PROXY_PORT` env var). You will use this in Step 2.

There is no backend, no router, no state management library, and no TypeScript yet. Add what you need; do not over-engineer.

---

## The Challenge

This is a **live exercise** — we'll work through it together. Think out loud as you go: explain what you're looking at, what you're trying, and what tradeoffs you're weighing. We care about your reasoning at least as much as the final code.

Work through the four steps below in order. We may not finish all four, and that is fine — depth of discussion matters more than coverage. After each step, the app should still build and run.

### Step 1 — Get past the "Access Denied" screen *without changing code*

When you load the app you will see an **Access Denied** screen asking for a phone number. Your first task is to load the actual address form **without editing any source files**. Read `AddressBook.vue` carefully and figure out what the component is looking for in order to render the form view instead of the error view.

**Done when:** you can load the form view in the browser purely without changing any code.

### Step 2 — Build the backend

Now that the project runs, connect a real backend. The frontend already calls four endpoints via `src/service.js`. Stand up a backend that implements them so the form can actually load data, track views, save submissions, and re-send the form link.

Inferred contract (read `service.js` and `AddressBook.vue` to confirm):

| Method | Path          | Request                                                                                          | Purpose                                                                                                            |
| ------ | ------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/form`   | query: `viewId`                                                                                  | Return the guest's saved details: top-level fields, nested `address`, `additionalGuests`, and a `locked` boolean.  |
| PUT    | `/api/view`   | body: `{ id }`                                                                                   | Record that the form was viewed for this `viewId`.                                                                 |
| PUT    | `/api/submit` | body: `{ name, email, streetAddress, apartment, city, state, zipCode, additionalGuests, viewId }` | Persist the guest's details for that `viewId`.                                                                     |
| POST   | `/api/link`   | body: `{ phoneNumber }`                                                                          | Send (or simulate sending) a new form link to that phone number.                                                   |

Requirements:

- Pick any stack you like (Node/Express, Fastify, Hono, etc.). Keep it small.
- Persist data somewhere — a JSON file or SQLite is fine. No need for a real database.
- Run your backend on port `8081` so the existing Vite proxy in `vite.config.js` reaches it (or set `API_PROXY_PORT` to match your port).
- Ensure loading saved details into the form works end-to-end: submit the form, reload the page with the same `viewId`, and see the data populated.
- `sendFormLink` does not need to send a real SMS — log the link to the server console.

**Done when:** you can open the app with a fresh URL parameter, fill out and submit the form, reload with that same URL parameter, and see your previously-entered data load back into the form.

### Step 3 — Reorganize `AddressBook.vue`

`AddressBook.vue` is ~950 lines and does far too much in one file. Break it apart into smaller, focused single-file components and/or composables. There is no single "right" decomposition — we are looking at your judgment. Some things to consider:

- Split the distinct views (access-denied, loading, the address form, the additional-guests list, the confirmation screen) into their own components.
- Keep behavior identical. Do not introduce a state library (Pinia/Vuex).
- Stay on the Options API for this step — we'll convert the component style only if you choose to during Step 4.

**Done when:** `AddressBook.vue` is a thin composition of smaller pieces, each piece has a single clear responsibility, and the app behaves exactly as it did before.

### Step 4 — Convert the project to TypeScript

Migrate the codebase from JavaScript to TypeScript.

- Add and configure `typescript` and a `tsconfig.json` suited to a Vite + Vue project, plus `vue-tsc` for type-checking `.vue` files.
- Use `lang="ts"` in your `<script>` blocks and type your components (e.g. `defineComponent`).
- Rename `.js` files to `.ts`.
- Type the shared shapes you discovered building the backend in Step 2 — `Guest`, `AdditionalGuest`, `Address`, `FormPayload`, the API response/request types — and use them in both the components and `service.ts`.
- If you wrote the backend in Node, convert it to TypeScript too. If you chose a non-Node stack, leave it as-is.
- The dev server (`npm run dev`) and `npm run build` should both work cleanly under TypeScript.

**Done when:** the project runs and builds cleanly under TypeScript, the obvious types are not `any` and you do not use `as`, and the end-to-end flow from Step 2 still works.

---

You will not be judged on finishing — you will be judged on how you think, how you communicate, and the quality of what you do produce. Ask questions whenever you'd like.