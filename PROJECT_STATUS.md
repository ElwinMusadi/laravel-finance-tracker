# PROJECT_STATUS.md

> **Snapshot date:** 2026-09-08  
> **Scope:** Static codebase analysis + live test run. No runtime profiling or manual UI walkthrough.

---

## Executive Summary

Laravel Finance Tracker is a single-user personal finance application built on Laravel + Inertia + React. The core domain — double-entry-style bookkeeping across five Chart-of-Accounts types — is implemented and the test suite passes fully (**89 passed, 2 skipped, 0 failed**). The application is functional for its intended purpose.

Primary outstanding gap: **all financial data lacks `user_id` ownership**. The system is single-tenant in practice but does not enforce it, creating a latent multi-user data-exposure risk. Several UI sections are still scaffolded from the starter kit template. The working tree contains uncommitted improvements to the global transaction modal architecture.

---

## 1. Stack & Key Versions

| Layer | Package / Tool | Version |
|---|---|---|
| Runtime | PHP | 8.3 |
| Framework | `laravel/framework` | 13.29.0 |
| Auth | `laravel/fortify` | 1.39.0 |
| SPA bridge | `inertiajs/inertia-laravel` / `@inertiajs/react` | 3.3.1 / ^3.0.0 |
| UI | React + TypeScript | ^19.2.0 / ^5.7.2 |
| Styling | Tailwind CSS v4 + shadcn/ui | ^4.0.0 |
| Charts | Recharts | 3.8.0 |
| Static analysis | Larastan (PHPStan level 7) | 3.10.0 |
| Code style | Laravel Pint | 1.30.5 |
| Test runner | Pest | 4.7.8 |
| Route types | Laravel Wayfinder | 0.1.21 |
| DB (prod / test) | MySQL / SQLite in-memory | — |

---

## 2. Architecture & Data Model

### Backend structure

```
app/
├── Http/Controllers/   AccountController, BudgetController, ContactController,
│                       DashboardController, TransactionController
├── Http/Requests/      Store*/Update* for all four domain models
├── Models/             Account, Budget, Contact, Transaction, User
└── Services/
    ├── AccountTypeMatrix   Normal-balance & category per account type
    └── LedgerService       Balance, net worth, income/expense aggregation
```

### Domain models

| Model | Key columns | Notable |
|---|---|---|
| `Account` | `name`, `type`, `code`, `description`, `contact_id`, `is_active` | 5 types: `asset`, `liability`, `revenue`, `expense`, `equity` |
| `Contact` | `name`, `email`, `phone`, `type` | `individual` / `company`; links to accounts |
| `Transaction` | `transaction_date`, `source_account_id`, `destination_account_id`, `amount`, `description` | Double-entry; **no `user_id`** |
| `Budget` | `name`, `account_id`, `amount`, `start_date`, `end_date` | Period-based; **no `user_id`** |

> ⚠️ No `user_id` on any domain model. All records are globally shared across all authenticated users.

### Frontend structure

```
resources/js/
├── pages/       dashboard, accounts, contacts, transactions, budgets, welcome
├── components/  *-form-modal (×4), app-sidebar, nav-main, chart-area-interactive, …
├── hooks/       use-transaction-modal, use-flash-toast, use-appearance, …
├── layouts/     app-sidebar-layout (mounts global TransactionFormModal)
├── actions/     Wayfinder controller bindings
└── routes/      Wayfinder named-route bindings
```

Global modal: `useTransactionModal` hook + `TransactionFormModal` mounted in `AppSidebarLayout`, triggered from sidebar "Add Transaction" and table edit buttons.

---

## 3. Feature Status Matrix

### ✅ Implemented & tested

| Feature | Details |
|---|---|
| Authentication | Fortify login, profile update, password change, appearance toggle. Registration **disabled**. |
| Account CRUD | Full create / read / update / delete; validation; `is_active` toggle; contact linkage. |
| Contact CRUD | Full create / read / update / delete. Individual / company types. |
| Transaction CRUD | Full create / read / update / delete. Month + account filters. Paginated. |
| Budget CRUD | Full create / read / update / delete. Progress bar (spent vs limit). |
| Dashboard KPIs | Net worth, total assets, liabilities, monthly income, monthly expense, budget usage %. |
| Dashboard – Recent Transactions | Last 10 transactions in table. |
| Ledger logic | `LedgerService::balance()` applies normal-balance rules per `AccountTypeMatrix`. |
| Double-entry constraint | `source_account_id ≠ destination_account_id` enforced in `StoreTransactionRequest`. |
| Flash toasts | `useFlashToast` hook + Sonner; `toast` prop shared in `HandleInertiaRequests`. |
| Global transaction modal | Layout-level `TransactionFormModal`; open from sidebar and transaction page. |
| Theme | Light / dark toggle via `AppearanceDropdown`, persisted in cookie. |
| Wayfinder bindings | TypeScript action and route bindings generated; used in all pages. |
| CI | GitHub Actions `tests.yml`; PHPStan level 7; Pint Laravel preset. |

### ⚠️ Partially implemented

| Feature | Gap |
|---|---|
| Dashboard chart | `ChartAreaInteractive` uses hardcoded template data. Not connected to real transactions. |
| Budget validation | No check that `budget.account_id` is an `expense`-type account. |
| Transaction filters | Month + account filters work; no date-range picker or flow-type (income/expense) filter. |
| Contact → Account cascade | Contact delete does not nullify `accounts.contact_id`. |
| Sidebar navigation | Settings, Help, Search, Reports, Data Library links go to `#`. |
| `useFlashToast` usage | Hook defined correctly but **never called** in any layout — flash messages are silently dropped. |

### ❌ Not implemented

| Feature | Notes |
|---|---|
| User data isolation | No `user_id`, no Policy, no ownership scope on any model. |
| Transaction categories / tags | No model; budget is the only grouping mechanism. |
| Recurring transactions | No scheduler or recurring flag. |
| File attachments | No attachment model or storage config. |
| CSV / Excel export | No export route or job. |
| Reports page | Sidebar link only. |
| Search | No full-text or cross-entity filter. |
| Budget overrun notification | No mail / database notification. |
| Email verification | `emailVerification` Fortify feature not enabled. |
| Two-factor authentication | Passkey migration + 2FA columns present; no activation UI. |
| Multi-currency | Amounts are plain decimals; UI labels "(IDR)" but no currency column or conversion. |
| API / mobile layer | Web-only SPA; no API routes. |

---

## 4. Authentication & Security

| Check | Status |
|---|---|
| Route guard (`auth` middleware) | ✅ All domain routes require authentication |
| Registration disabled | ✅ `Features::registration()` removed from `config/fortify.php` |
| CSRF | ✅ Default Laravel CSRF (cookie + header via Inertia) |
| Data ownership / multi-user isolation | ❌ No `user_id` on any domain model |
| Model policies | ❌ None created |
| Mass assignment protection | ✅ All models use `$fillable` |
| SQL injection | ✅ All queries use Eloquent / query builder |
| XSS | ✅ React handles output escaping (no `dangerouslySetInnerHTML`) |
| Admin seeder credentials | ⚠️ `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env.example`; never use real credentials as defaults |

---

## 5. Validation & Data Integrity

| Rule | Enforced | Location |
|---|---|---|
| `source ≠ destination` account | ✅ | `StoreTransactionRequest::withValidator()` |
| Both accounts must exist | ✅ | `exists:accounts,id` |
| Account type enum | ✅ | `In:asset,liability,revenue,expense,equity` |
| Budget amount positive | ✅ | `min:0.01` |
| Budget start < end date | ✅ | `after_or_equal:start_date` |
| Transaction amount positive | ✅ | `min:0.01` |
| Budget account is expense-type | ❌ | Not validated |
| Contact type enum | ✅ | `In:individual,company` |
| Unique account code on update | ✅ | `unique:accounts,code,{id}` (ignore self) |
| DB foreign key constraints | ✅ | All `_id` columns use `constrained()` |
| Contact delete → nullify account FK | ❌ | No `onDelete('set null')` on `accounts.contact_id` |

---

## 6. Ledger & AccountTypeMatrix

`AccountTypeMatrix` defines the normal balance per account type:

| Type | Normal Balance | Balance increases when account is… |
|---|---|---|
| `asset` | Debit | source (money flows out to it) |
| `expense` | Debit | source |
| `liability` | Credit | destination (money flows into it) |
| `revenue` | Credit | destination |
| `equity` | Credit | destination |

`LedgerService::balance(Account)` sums `amount` from transactions on the "increases" side minus the "decreases" side. Dashboard KPIs derive from this: `totalAssets`, `totalLiabilities`, `monthlyIncome`, `monthlyExpense`, `netWorth`, `budgetUsedPercentage`.

**Tests:** `AccountTypeMatrixTest` and `LedgerTest` (447 lines total) cover all type rules and aggregation logic.

---

## 7. Test Suite

**Run result (2026-09-08):** `89 passed, 2 skipped, 0 failed (292 assertions, 10.33s)`

| Test file | Coverage area |
|---|---|
| `AccountControllerTest` | CRUD, auth guard, validation |
| `BudgetControllerTest` | CRUD, auth guard, validation |
| `ContactControllerTest` | CRUD, auth guard, validation |
| `TransactionControllerTest` | CRUD, auth guard, validation, filters |
| `DashboardTest` | Auth guard, KPI metric values, Inertia prop shape |
| `AccountTypeMatrixTest` | Matrix rules per type |
| `LedgerTest` | Balance, net worth, income/expense aggregation |
| Settings tests (starter kit) | Profile update, password, appearance |

**2 skipped** tests are in passkey/settings area (unrelated to domain logic).  
**Coverage not measured** — coverage tooling not configured in `phpunit.xml`.

---

## 8. CI / Quality Tooling

| Tool | Config | Status |
|---|---|---|
| Pest | `phpunit.xml` + SQLite in-memory | ✅ Runs in GitHub Actions |
| PHPStan / Larastan | `phpstan.neon` level 7 | ✅ Configured; included in CI |
| Laravel Pint | `pint.json` preset `laravel` | ✅ Configured |
| ESLint (vite-plus `lint`) | `vite.config.ts` | `denyWarnings: true`, type-aware; UI components excluded |
| Prettier (vite-plus `fmt`) | `vite.config.ts` | Tailwind class sorting; UI components excluded |
| GitHub Actions | `.github/workflows/tests.yml` | Single workflow; no separate lint job |
| Lock files | `package-lock.json` + `pnpm-lock.yaml` | ⚠️ Two lockfiles — pick one package manager |

---

## 9. Working Tree (Uncommitted)

| File | Change |
|---|---|
| `app/Http/Middleware/HandleInertiaRequests.php` | Shares `accounts` (all active) on every Inertia response |
| `app/Models/Contact.php` | Adds `active()` scope (PHP 8 attribute style) |
| `resources/js/layouts/app/app-sidebar-layout.tsx` | Mounts global `TransactionFormModal` |
| `resources/js/pages/transactions/index.tsx` | Migrates modal state to `useTransactionModal` hook |
| `tests/Feature/DashboardTest.php` | Extends dashboard test with KPI value assertions |

These changes form a coherent "global transaction modal" feature and are covered by the passing test suite.

---

## 10. Technical Findings by Risk

### 🔴 High

**1. No data ownership.**  
All `accounts`, `contacts`, `transactions`, and `budgets` are readable and writable by any authenticated user. A second user created via Tinker or any future admin UI can read and modify all records.  
*Fix:* Add `user_id` FK on all four models, scope every query to `auth()->id()`, create Laravel Policies.

**2. `useFlashToast` never called.**  
The hook listens to the Inertia `flash` event correctly, but no component calls it. Controllers flash `toast` messages that are silently dropped — users see no success or error feedback.  
*Fix:* Add `useFlashToast()` call inside `AppSidebarLayout`.

### 🟡 Medium

**3. `accounts` shared on every Inertia request.**  
`HandleInertiaRequests` runs `Account::active()->orderBy('name')->get()` for every authenticated page load — constant overhead that grows with account count.  
*Fix:* Use Inertia deferred props or pass accounts only to pages that require them.

**4. Dashboard chart is static.**  
`ChartAreaInteractive` renders hardcoded example data from the shadcn template. The time-range selector does nothing.  
*Fix:* Pass `dailyTotals` from `DashboardController` and wire into the component.

**5. Budget–account type not validated.**  
A budget can be linked to any account type. Only `expense` accounts are semantically valid for budgeting.  
*Fix:* Add a custom validation rule or `whereHas` type check in `StoreBudgetRequest`.

**6. Contact delete leaves dangling FK.**  
`accounts.contact_id` has no cascade or nullify rule. Deleting a contact with linked accounts leaves orphaned `contact_id` values.  
*Fix:* Add `->onDelete('set null')` to the accounts migration (requires new migration) or handle in `ContactController::destroy`.

**7. Two frontend lockfiles.**  
Both `package-lock.json` and `pnpm-lock.yaml` are present. Builds from different environments may resolve different dependency trees.  
*Fix:* Choose one package manager and delete the other lockfile.

### 🟢 Low / Cosmetic

**8.** Sidebar placeholder links (Settings, Help, Search, Reports, Data Library) go to `#`.  
**9.** `usePage<any>()` in `app-sidebar-layout.tsx` — should use a typed interface.  
**10.** Duplicate `tw-animate-css` import in `app.css`.  
**11.** Static fallback user `"shadcn"` / `"m@example.com"` in `app-sidebar.tsx`.  
**12.** Single CI workflow — tests and lint merged; consider a matrix split.

---

## 11. Roadmap & Priority

### P0 — Data safety (before any second user exists)

- [ ] Decide: enforce single-user with a seeder guard and documentation, **or** add full `user_id` ownership + Policies to all four domain models.
- [ ] Call `useFlashToast()` in `AppSidebarLayout` so user-facing feedback works.

### P1 — Functional completeness

- [ ] Commit working-tree changes (global modal, shared accounts, extended dashboard test).
- [ ] Fix contact-delete cascade: add `onDelete('set null')` or nullify in controller.
- [ ] Validate that budget `account_id` is of type `expense`.
- [ ] Wire real transaction data into `ChartAreaInteractive`.
- [ ] Add `dailyTotals` / period aggregation to `DashboardController`.

### P2 — Quality & UX

- [ ] Replace `usePage<any>()` with a typed Inertia page props interface.
- [ ] Move account sharing out of global middleware (deferred props or page-level).
- [ ] Remove or implement sidebar placeholder nav items.
- [ ] Remove duplicate `tw-animate-css` import in `app.css`.
- [ ] Remove static fallback user from `app-sidebar.tsx`.
- [ ] Pick one package manager; delete the other lockfile.
- [ ] Enable coverage measurement in `phpunit.xml` / CI.

### P3 — Feature expansion

- [ ] CSV / Excel export for transactions and accounts.
- [ ] Cross-entity search / full-text filter.
- [ ] Recurring transaction scheduler.
- [ ] Budget overrun notification (mail or database).
- [ ] Reports page with period-over-period comparison.
- [ ] Multi-currency: add `currency` column and conversion logic.
- [ ] Two-factor / passkey activation UI.

---

## 12. Validation Evidence

```
vendor/bin/pest --compact --no-coverage
Tests: 2 skipped, 89 passed (292 assertions)
Duration: 10.33s
Date: 2026-09-08
```

Migration status (all Ran): `users`, `cache`, `jobs`, `passkeys`, `two_factor_columns`, `contacts`, `accounts`, `transactions`, `budgets`.

PHP packages confirmed via `composer show --direct`.  
JS packages confirmed via `package.json`.

---

## 13. Limitations of This Analysis

- No live browser session — React rendering, modal behaviour, and chart interactivity not verified at runtime.
- PHPStan not re-run in this session; static analysis status reflects CI configuration only.
- No coverage report; untested code paths are not quantified.
- Performance / N+1 query analysis not performed.
- Security audit (OWASP) not performed; findings are structural observations only.
