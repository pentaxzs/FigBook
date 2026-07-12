# Supabase Cross-Device Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase auth (magic link) and cloud storage so data syncs across all devices.

**Architecture:** The existing `StorageService` interface is kept intact. A new `StorageManager` singleton proxies all calls to the active adapter, which swaps from `LocalStorageAdapter` → `SupabaseAdapter` on login. `AuthProvider` manages the swap and runs a one-time localStorage → Supabase migration on first login.

**Tech Stack:** `@supabase/supabase-js`, `@supabase/ssr`, Next.js App Router, TypeScript strict

## Global Constraints

- Next.js App Router — read `node_modules/next/dist/docs/` before writing route handlers or middleware
- Tailwind CSS v4: no `rounded-*`, no `shadow-*`, use design tokens only (`bg-surface`, `border-border`, `text-secondary`, `text-foreground`, `bg-primary`, `text-background`, etc.)
- No new `rounded-*` or `shadow-*` classes anywhere in UI
- All buttons: `min-h-[44px]`, `cursor-pointer`
- Import `storage` singleton from `@/lib/storage` (NOT `@/lib/storage/LocalStorageAdapter`) after Task 2
- Settings and recent searches stay in localStorage (device-specific, not synced)
- `figbook_migrated` localStorage key tracks migration completion
- `npm test` runs Jest — all existing tests must stay green

---

### Task 1: Supabase project setup + package install + client singletons

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `.env.local` (gitignored)

**Interfaces:**
- Produces:
  - `supabase` — `SupabaseClient` singleton (browser), exported from `src/lib/supabase/client.ts`
  - `createSupabaseServerClient()` — returns `SupabaseClient` for route handlers/middleware, exported from `src/lib/supabase/server.ts`

---

- [ ] **Step 1: Create Supabase project (manual)**

  Go to https://supabase.com → New project. Choose a region close to Korea (ap-northeast-1 Tokyo or ap-southeast-1 Singapore). Wait for it to provision (~2 min).

- [ ] **Step 2: Run the DB schema in Supabase SQL Editor**

  In Supabase dashboard → SQL Editor → New query → paste and run:

  ```sql
  -- products
  create table if not exists products (
    id          text primary key,
    user_id     uuid references auth.users not null,
    name        text not null,
    "order"     integer not null default 0,
    created_at  timestamptz not null default now()
  );

  -- features
  create table if not exists features (
    id          text primary key,
    user_id     uuid references auth.users not null,
    product_id  text not null references products(id) on delete cascade,
    name        text not null,
    "order"     integer not null default 0,
    created_at  timestamptz not null default now()
  );

  -- metrics
  create table if not exists metrics (
    id          text primary key,
    user_id     uuid references auth.users not null,
    product_id  text not null references products(id) on delete cascade,
    feature_id  text references features(id) on delete set null,
    name        text not null,
    value       text not null,
    unit        text not null default '',
    category    text[] not null default '{}',
    memo        text not null default '',
    base_date   text not null default '',
    is_pinned   boolean not null default false,
    created_at  timestamptz not null default now()
  );

  -- Row Level Security
  alter table products enable row level security;
  alter table features enable row level security;
  alter table metrics  enable row level security;

  create policy "own products" on products for all using (auth.uid() = user_id);
  create policy "own features" on features for all using (auth.uid() = user_id);
  create policy "own metrics"  on metrics  for all using (auth.uid() = user_id);
  ```

- [ ] **Step 3: Configure magic link redirect URL in Supabase**

  Supabase dashboard → Authentication → URL Configuration:
  - Site URL: `https://metricspad.vercel.app`
  - Redirect URLs: add `https://metricspad.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`

- [ ] **Step 4: Copy env keys**

  Supabase dashboard → Project Settings → API → copy `Project URL` and `anon public` key.

- [ ] **Step 5: Create `.env.local`**

  ```
  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
  ```

  Verify `.env.local` is in `.gitignore` (it should be already for Next.js projects).

- [ ] **Step 6: Install packages**

  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```

  Expected: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 7: Create `src/lib/supabase/client.ts`**

  ```typescript
  import { createBrowserClient } from '@supabase/ssr'

  export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  ```

- [ ] **Step 8: Create `src/lib/supabase/server.ts`**

  ```typescript
  import { createServerClient } from '@supabase/ssr'
  import { cookies } from 'next/headers'

  export async function createSupabaseServerClient() {
    const cookieStore = await cookies()
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          },
        },
      },
    )
  }
  ```

- [ ] **Step 9: Verify build passes**

  ```bash
  npm run build
  ```

  Expected: build succeeds (env vars may show type warnings if not set yet — that's OK).

- [ ] **Step 10: Commit**

  ```bash
  git add src/lib/supabase/ .env.local package.json package-lock.json
  git commit -m "feat: add Supabase client + server helpers, DB schema"
  ```

---

### Task 2: StorageManager + `storage` singleton re-export + import path updates

**Files:**
- Create: `src/lib/storage/StorageManager.ts`
- Create: `src/lib/storage/index.ts`
- Modify: `src/lib/storage/LocalStorageAdapter.ts` (remove singleton export)
- Modify: 8 component files (import path change only)

**Interfaces:**
- Consumes: `StorageService` from `./StorageService`, `LocalStorageAdapter` from `./LocalStorageAdapter`
- Produces:
  - `StorageManager` class with `setAdapter(adapter: StorageService): void`
  - `storage` — `StorageManager` instance, exported from `src/lib/storage/index.ts`

---

- [ ] **Step 1: Write the failing test**

  Create `src/__tests__/lib/storage/StorageManager.test.ts`:

  ```typescript
  import { StorageManager } from '@/lib/storage/StorageManager'
  import type { StorageService } from '@/lib/storage/StorageService'
  import type { Product } from '@/types'

  const mockProduct: Product = {
    id: 'p1', user_id: 'u1', name: 'Test', order: 0, created_at: '2026-01-01T00:00:00Z',
  }

  function makeMockAdapter(overrides: Partial<StorageService> = {}): StorageService {
    return {
      getProducts: jest.fn().mockResolvedValue([]),
      saveProduct: jest.fn().mockResolvedValue(undefined),
      updateProduct: jest.fn().mockResolvedValue(undefined),
      deleteProduct: jest.fn().mockResolvedValue(undefined),
      getFeatures: jest.fn().mockResolvedValue([]),
      saveFeature: jest.fn().mockResolvedValue(undefined),
      updateFeature: jest.fn().mockResolvedValue(undefined),
      deleteFeature: jest.fn().mockResolvedValue(undefined),
      getMetrics: jest.fn().mockResolvedValue([]),
      saveMetric: jest.fn().mockResolvedValue(undefined),
      updateMetric: jest.fn().mockResolvedValue(undefined),
      deleteMetric: jest.fn().mockResolvedValue(undefined),
      getSettings: jest.fn().mockResolvedValue({ ai_provider: 'openai', api_keys: {} }),
      saveSettings: jest.fn().mockResolvedValue(undefined),
      getRecentSearches: jest.fn().mockResolvedValue([]),
      saveRecentSearch: jest.fn().mockResolvedValue(undefined),
      clearRecentSearches: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    }
  }

  describe('StorageManager', () => {
    it('starts with LocalStorageAdapter (returns empty arrays)', async () => {
      const manager = new StorageManager()
      expect(await manager.getProducts()).toEqual([])
      expect(await manager.getMetrics()).toEqual([])
    })

    it('delegates getProducts to the active adapter', async () => {
      const manager = new StorageManager()
      const mock = makeMockAdapter({
        getProducts: jest.fn().mockResolvedValue([mockProduct]),
      })
      manager.setAdapter(mock)
      const result = await manager.getProducts()
      expect(mock.getProducts).toHaveBeenCalledTimes(1)
      expect(result).toEqual([mockProduct])
    })

    it('setAdapter swaps adapter — subsequent calls use new adapter', async () => {
      const manager = new StorageManager()
      const mockA = makeMockAdapter({ getProducts: jest.fn().mockResolvedValue([]) })
      const mockB = makeMockAdapter({ getProducts: jest.fn().mockResolvedValue([mockProduct]) })

      manager.setAdapter(mockA)
      await manager.getProducts()
      expect(mockA.getProducts).toHaveBeenCalledTimes(1)

      manager.setAdapter(mockB)
      const result = await manager.getProducts()
      expect(mockB.getProducts).toHaveBeenCalledTimes(1)
      expect(result).toEqual([mockProduct])
    })

    it('delegates saveMetric to the active adapter', async () => {
      const manager = new StorageManager()
      const mock = makeMockAdapter()
      manager.setAdapter(mock)
      const metric = {
        id: 'm1', user_id: 'u1', product_id: 'p1', feature_id: 'f1',
        name: 'MAU', value: '100', unit: '명', category: [], memo: '',
        base_date: '2026-01', is_pinned: false, created_at: '2026-01-01T00:00:00Z',
      }
      await manager.saveMetric(metric)
      expect(mock.saveMetric).toHaveBeenCalledWith(metric)
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  npm test -- --testPathPattern="StorageManager"
  ```

  Expected: FAIL — `Cannot find module '@/lib/storage/StorageManager'`

- [ ] **Step 3: Create `src/lib/storage/StorageManager.ts`**

  ```typescript
  import type { StorageService } from './StorageService'
  import { LocalStorageAdapter } from './LocalStorageAdapter'
  import type { Product, Feature, Metric, Settings } from '@/types'

  export class StorageManager implements StorageService {
    private adapter: StorageService = new LocalStorageAdapter()

    setAdapter(adapter: StorageService): void {
      this.adapter = adapter
    }

    getProducts() { return this.adapter.getProducts() }
    saveProduct(p: Product) { return this.adapter.saveProduct(p) }
    updateProduct(id: string, data: Partial<Product>) { return this.adapter.updateProduct(id, data) }
    deleteProduct(id: string) { return this.adapter.deleteProduct(id) }

    getFeatures(productId?: string) { return this.adapter.getFeatures(productId) }
    saveFeature(f: Feature) { return this.adapter.saveFeature(f) }
    updateFeature(id: string, data: Partial<Feature>) { return this.adapter.updateFeature(id, data) }
    deleteFeature(id: string) { return this.adapter.deleteFeature(id) }

    getMetrics(productId?: string) { return this.adapter.getMetrics(productId) }
    saveMetric(m: Metric) { return this.adapter.saveMetric(m) }
    updateMetric(id: string, data: Partial<Metric>) { return this.adapter.updateMetric(id, data) }
    deleteMetric(id: string) { return this.adapter.deleteMetric(id) }

    getSettings() { return this.adapter.getSettings() }
    saveSettings(data: Partial<Settings>) { return this.adapter.saveSettings(data) }

    getRecentSearches() { return this.adapter.getRecentSearches() }
    saveRecentSearch(query: string) { return this.adapter.saveRecentSearch(query) }
    clearRecentSearches() { return this.adapter.clearRecentSearches() }
  }
  ```

- [ ] **Step 4: Create `src/lib/storage/index.ts`**

  ```typescript
  import { StorageManager } from './StorageManager'

  export const storage = new StorageManager()
  ```

- [ ] **Step 5: Remove singleton export from `LocalStorageAdapter.ts`**

  Delete the last line of `src/lib/storage/LocalStorageAdapter.ts`:

  ```typescript
  // DELETE this line:
  export const storage = new LocalStorageAdapter()
  ```

  The class export stays — only the singleton instance line is removed.

- [ ] **Step 6: Run StorageManager tests to verify they pass**

  ```bash
  npm test -- --testPathPattern="StorageManager"
  ```

  Expected: PASS — 4 tests pass.

- [ ] **Step 7: Update all import paths (8 files)**

  In each file below, change:
  ```typescript
  import { storage } from '@/lib/storage/LocalStorageAdapter'
  ```
  to:
  ```typescript
  import { storage } from '@/lib/storage'
  ```

  Files to update (exact paths):
  - `src/app/page.tsx`
  - `src/app/settings/page.tsx`
  - `src/app/quiz/page.tsx`
  - `src/app/search/page.tsx`
  - `src/components/metrics/AddMetricSheet.tsx`
  - `src/components/metrics/ParseResultReview.tsx`
  - `src/components/products/ProductCombobox.tsx`
  - `src/components/products/FeatureCombobox.tsx`

  One-liner to do all 8 at once:
  ```bash
  find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s|from '@/lib/storage/LocalStorageAdapter'|from '@/lib/storage'|g"
  ```

- [ ] **Step 8: Verify build and all tests pass**

  ```bash
  npm run build && npm test
  ```

  Expected: build succeeds, all existing tests green.

- [ ] **Step 9: Commit**

  ```bash
  git add src/lib/storage/ src/app/ src/components/
  git commit -m "refactor: StorageManager adapter swap — storage singleton now from @/lib/storage"
  ```

---

### Task 3: SupabaseAdapter

**Files:**
- Create: `src/lib/storage/SupabaseAdapter.ts`
- Create: `src/__tests__/lib/storage/SupabaseAdapter.test.ts`

**Interfaces:**
- Consumes: `StorageService` from `./StorageService`, `LocalStorageAdapter` from `./LocalStorageAdapter`, `SupabaseClient` from `@supabase/supabase-js`
- Produces: `SupabaseAdapter` class — `new SupabaseAdapter(client: SupabaseClient, userId: string)`

---

- [ ] **Step 1: Write the failing test**

  Create `src/__tests__/lib/storage/SupabaseAdapter.test.ts`:

  ```typescript
  import { SupabaseAdapter } from '@/lib/storage/SupabaseAdapter'
  import type { Product, Feature, Metric } from '@/types'

  const userId = 'user-123'

  const mockProduct: Product = {
    id: 'p1', user_id: userId, name: 'TestApp', order: 0, created_at: '2026-01-01T00:00:00Z',
  }
  const mockFeature: Feature = {
    id: 'f1', user_id: userId, product_id: 'p1', name: 'Auth', order: 0, created_at: '2026-01-01T00:00:00Z',
  }
  const mockMetric: Metric = {
    id: 'm1', user_id: userId, product_id: 'p1', feature_id: 'f1',
    name: 'MAU', value: '100', unit: '명', category: ['retention'],
    memo: '', base_date: '2026-01', is_pinned: false, created_at: '2026-01-01T00:00:00Z',
  }

  function makeChain(resolveValue: unknown) {
    const chain: Record<string, jest.Mock> = {}
    const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'order', 'single']
    methods.forEach(m => {
      chain[m] = jest.fn(() => chain)
    })
    // Terminal — actual resolved value
    Object.defineProperty(chain, 'then', {
      get() {
        return (resolve: (v: unknown) => unknown) => Promise.resolve(resolveValue).then(resolve)
      },
    })
    return chain
  }

  function makeSupabaseClient(resolveValue: unknown = { data: [], error: null }) {
    const chain = makeChain(resolveValue)
    return { from: jest.fn(() => chain), _chain: chain }
  }

  describe('SupabaseAdapter', () => {
    describe('getProducts', () => {
      it('returns products from Supabase', async () => {
        const { _chain, ...client } = makeSupabaseClient({ data: [mockProduct], error: null })
        const adapter = new SupabaseAdapter(client as never, userId)
        const result = await adapter.getProducts()
        expect(client.from).toHaveBeenCalledWith('products')
        expect(result).toEqual([mockProduct])
      })

      it('returns [] when data is null', async () => {
        const { _chain, ...client } = makeSupabaseClient({ data: null, error: null })
        const adapter = new SupabaseAdapter(client as never, userId)
        expect(await adapter.getProducts()).toEqual([])
      })
    })

    describe('saveProduct', () => {
      it('inserts product with correct user_id', async () => {
        const { _chain, ...client } = makeSupabaseClient({ error: null })
        const adapter = new SupabaseAdapter(client as never, userId)
        await adapter.saveProduct(mockProduct)
        expect(client.from).toHaveBeenCalledWith('products')
        expect(_chain.insert).toHaveBeenCalledWith({ ...mockProduct, user_id: userId })
      })
    })

    describe('getMetrics', () => {
      it('maps null feature_id to empty string', async () => {
        const row = { ...mockMetric, feature_id: null }
        const { _chain, ...client } = makeSupabaseClient({ data: [row], error: null })
        const adapter = new SupabaseAdapter(client as never, userId)
        const result = await adapter.getMetrics()
        expect(result[0].feature_id).toBe('')
      })
    })

    describe('settings and recent searches', () => {
      it('getSettings delegates to localStorage', async () => {
        const { _chain, ...client } = makeSupabaseClient({ data: [], error: null })
        const adapter = new SupabaseAdapter(client as never, userId)
        const settings = await adapter.getSettings()
        expect(settings).toHaveProperty('ai_provider')
      })
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  npm test -- --testPathPattern="SupabaseAdapter"
  ```

  Expected: FAIL — `Cannot find module '@/lib/storage/SupabaseAdapter'`

- [ ] **Step 3: Create `src/lib/storage/SupabaseAdapter.ts`**

  ```typescript
  import type { SupabaseClient } from '@supabase/supabase-js'
  import type { StorageService } from './StorageService'
  import { LocalStorageAdapter } from './LocalStorageAdapter'
  import type { Product, Feature, Metric, Settings } from '@/types'

  export class SupabaseAdapter implements StorageService {
    private local = new LocalStorageAdapter()

    constructor(
      private supabase: SupabaseClient,
      private userId: string,
    ) {}

    // ── Products ──────────────────────────────────────────────────────────────

    async getProducts(): Promise<Product[]> {
      const { data } = await this.supabase
        .from('products')
        .select('*')
        .order('order', { ascending: true })
      return (data ?? []) as Product[]
    }

    async saveProduct(product: Product): Promise<void> {
      await this.supabase
        .from('products')
        .insert({ ...product, user_id: this.userId })
    }

    async updateProduct(id: string, data: Partial<Product>): Promise<void> {
      await this.supabase.from('products').update(data).eq('id', id)
    }

    async deleteProduct(id: string): Promise<void> {
      await this.supabase.from('products').delete().eq('id', id)
    }

    // ── Features ──────────────────────────────────────────────────────────────

    async getFeatures(productId?: string): Promise<Feature[]> {
      let query = this.supabase
        .from('features')
        .select('*')
        .order('order', { ascending: true })
      if (productId) query = (query as ReturnType<typeof query.eq>).eq('product_id', productId)
      const { data } = await query
      return (data ?? []) as Feature[]
    }

    async saveFeature(feature: Feature): Promise<void> {
      await this.supabase
        .from('features')
        .insert({ ...feature, user_id: this.userId })
    }

    async updateFeature(id: string, data: Partial<Feature>): Promise<void> {
      await this.supabase.from('features').update(data).eq('id', id)
    }

    async deleteFeature(id: string): Promise<void> {
      await this.supabase.from('features').delete().eq('id', id)
    }

    // ── Metrics ───────────────────────────────────────────────────────────────

    async getMetrics(productId?: string): Promise<Metric[]> {
      let query = this.supabase
        .from('metrics')
        .select('*')
        .order('created_at', { ascending: false })
      if (productId) query = (query as ReturnType<typeof query.eq>).eq('product_id', productId)
      const { data } = await query
      return ((data ?? []) as (Metric & { feature_id: string | null })[]).map(row => ({
        ...row,
        feature_id: row.feature_id ?? '',  // on delete set null → fallback to ''
      }))
    }

    async saveMetric(metric: Metric): Promise<void> {
      await this.supabase
        .from('metrics')
        .insert({ ...metric, user_id: this.userId })
    }

    async updateMetric(id: string, data: Partial<Metric>): Promise<void> {
      await this.supabase.from('metrics').update(data).eq('id', id)
    }

    async deleteMetric(id: string): Promise<void> {
      await this.supabase.from('metrics').delete().eq('id', id)
    }

    // ── Settings + Recent Searches — stay in localStorage ─────────────────────

    getSettings(): Promise<Settings> { return this.local.getSettings() }
    saveSettings(data: Partial<Settings>): Promise<void> { return this.local.saveSettings(data) }
    getRecentSearches(): Promise<string[]> { return this.local.getRecentSearches() }
    saveRecentSearch(query: string): Promise<void> { return this.local.saveRecentSearch(query) }
    clearRecentSearches(): Promise<void> { return this.local.clearRecentSearches() }
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  npm test -- --testPathPattern="SupabaseAdapter"
  ```

  Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/storage/SupabaseAdapter.ts src/__tests__/lib/storage/SupabaseAdapter.test.ts
  git commit -m "feat: SupabaseAdapter — implements StorageService over Supabase tables"
  ```

---

### Task 4: Migration utility

**Files:**
- Create: `src/lib/storage/migration.ts`
- Create: `src/__tests__/lib/storage/migration.test.ts`

**Interfaces:**
- Consumes: `LocalStorageAdapter` from `./LocalStorageAdapter`, `StorageService` from `./StorageService`
- Produces: `migrateLocalToSupabase(local: LocalStorageAdapter, remote: StorageService): Promise<void>`

---

- [ ] **Step 1: Write the failing test**

  Create `src/__tests__/lib/storage/migration.test.ts`:

  ```typescript
  import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter'
  import { migrateLocalToSupabase } from '@/lib/storage/migration'
  import type { StorageService } from '@/lib/storage/StorageService'
  import type { Product } from '@/types'

  const MIGRATION_KEY = 'figbook_migrated'

  const mockProduct: Product = {
    id: 'p1', user_id: 'old-user', name: 'App', order: 0, created_at: '2026-01-01T00:00:00Z',
  }

  function makeRemote(products: Product[] = []): StorageService {
    return {
      getProducts: jest.fn().mockResolvedValue(products),
      saveProduct: jest.fn().mockResolvedValue(undefined),
      updateProduct: jest.fn().mockResolvedValue(undefined),
      deleteProduct: jest.fn().mockResolvedValue(undefined),
      getFeatures: jest.fn().mockResolvedValue([]),
      saveFeature: jest.fn().mockResolvedValue(undefined),
      updateFeature: jest.fn().mockResolvedValue(undefined),
      deleteFeature: jest.fn().mockResolvedValue(undefined),
      getMetrics: jest.fn().mockResolvedValue([]),
      saveMetric: jest.fn().mockResolvedValue(undefined),
      updateMetric: jest.fn().mockResolvedValue(undefined),
      deleteMetric: jest.fn().mockResolvedValue(undefined),
      getSettings: jest.fn().mockResolvedValue({ ai_provider: 'openai', api_keys: {} }),
      saveSettings: jest.fn().mockResolvedValue(undefined),
      getRecentSearches: jest.fn().mockResolvedValue([]),
      saveRecentSearch: jest.fn().mockResolvedValue(undefined),
      clearRecentSearches: jest.fn().mockResolvedValue(undefined),
    }
  }

  beforeEach(() => {
    localStorage.clear()
  })

  describe('migrateLocalToSupabase', () => {
    it('skips if figbook_migrated flag is set', async () => {
      localStorage.setItem(MIGRATION_KEY, 'true')
      const remote = makeRemote()
      await migrateLocalToSupabase(new LocalStorageAdapter(), remote)
      expect(remote.getProducts).not.toHaveBeenCalled()
    })

    it('skips and sets flag if Supabase already has products', async () => {
      const remote = makeRemote([mockProduct])
      await migrateLocalToSupabase(new LocalStorageAdapter(), remote)
      expect(remote.saveProduct).not.toHaveBeenCalled()
      expect(localStorage.getItem(MIGRATION_KEY)).toBe('true')
    })

    it('migrates local products/features/metrics to Supabase', async () => {
      const local = new LocalStorageAdapter()
      await local.saveProduct(mockProduct)

      const remote = makeRemote([])  // empty Supabase
      await migrateLocalToSupabase(local, remote)

      expect(remote.saveProduct).toHaveBeenCalledWith(mockProduct)
      expect(localStorage.getItem(MIGRATION_KEY)).toBe('true')
    })

    it('sets flag even when local storage is empty', async () => {
      const remote = makeRemote([])
      await migrateLocalToSupabase(new LocalStorageAdapter(), remote)
      expect(remote.saveProduct).not.toHaveBeenCalled()
      expect(localStorage.getItem(MIGRATION_KEY)).toBe('true')
    })

    it('does not throw if migration fails — sets no flag', async () => {
      const local = new LocalStorageAdapter()
      await local.saveProduct(mockProduct)

      const remote = makeRemote([])
      ;(remote.getProducts as jest.Mock).mockRejectedValueOnce(new Error('network'))

      await expect(migrateLocalToSupabase(local, remote)).resolves.not.toThrow()
      expect(localStorage.getItem(MIGRATION_KEY)).toBeNull()
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  npm test -- --testPathPattern="migration"
  ```

  Expected: FAIL — `Cannot find module '@/lib/storage/migration'`

- [ ] **Step 3: Create `src/lib/storage/migration.ts`**

  ```typescript
  import type { LocalStorageAdapter } from './LocalStorageAdapter'
  import type { StorageService } from './StorageService'

  const MIGRATION_KEY = 'figbook_migrated'

  export async function migrateLocalToSupabase(
    local: LocalStorageAdapter,
    remote: StorageService,
  ): Promise<void> {
    if (localStorage.getItem(MIGRATION_KEY) === 'true') return

    try {
      // Skip if Supabase already has data (e.g. logged in on a second device)
      const existing = await remote.getProducts()
      if (existing.length > 0) {
        localStorage.setItem(MIGRATION_KEY, 'true')
        return
      }

      const [products, features, metrics] = await Promise.all([
        local.getProducts(),
        local.getFeatures(),
        local.getMetrics(),
      ])

      // Nothing to migrate
      if (products.length === 0 && features.length === 0 && metrics.length === 0) {
        localStorage.setItem(MIGRATION_KEY, 'true')
        return
      }

      // Insert sequentially: products → features → metrics (FK order)
      for (const p of products) await remote.saveProduct(p)
      for (const f of features) await remote.saveFeature(f)
      for (const m of metrics) await remote.saveMetric(m)

      localStorage.setItem(MIGRATION_KEY, 'true')
    } catch {
      // Silent failure — localStorage data is untouched, user can retry next login
    }
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  npm test -- --testPathPattern="migration"
  ```

  Expected: PASS — 5 tests pass.

- [ ] **Step 5: Run full test suite**

  ```bash
  npm test
  ```

  Expected: all tests green.

- [ ] **Step 6: Commit**

  ```bash
  git add src/lib/storage/migration.ts src/__tests__/lib/storage/migration.test.ts
  git commit -m "feat: migration utility — auto-migrate localStorage to Supabase on first login"
  ```

---

### Task 5: Login page + auth callback route

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/auth/callback/route.ts`

**Interfaces:**
- Consumes: `supabase` from `@/lib/supabase/client`, `createSupabaseServerClient` from `@/lib/supabase/server`
- Produces: `/login` route (email form → magic link), `/auth/callback` route (code exchange → session)

---

- [ ] **Step 1: Create `src/app/login/page.tsx`**

  ```typescript
  'use client'

  import { useState } from 'react'
  import { supabase } from '@/lib/supabase/client'

  export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!email.trim()) return
      setLoading(true)
      setError('')
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      setLoading(false)
      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
    }

    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold font-mono mb-1 text-foreground">🐷 FigBook</h1>
          <p className="text-sm text-secondary mb-8">프로덕트 지표를 기록하고 팔로업하세요</p>

          {sent ? (
            <div className="border border-border p-6 bg-surface">
              <p className="text-sm font-medium text-foreground mb-1">이메일을 확인하세요</p>
              <p className="text-xs text-secondary mt-1">
                <span className="font-mono">{email}</span>로 로그인 링크를 보냈어요.
                링크를 클릭하면 바로 로그인돼요.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="이메일 주소"
                required
                autoFocus
                className="w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary bg-surface min-h-[44px]"
              />
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-primary text-white py-3 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 cursor-pointer transition-colors min-h-[44px]"
              >
                {loading ? '보내는 중...' : '로그인 링크 받기'}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Create `src/app/auth/callback/route.ts`**

  Read `node_modules/next/dist/docs/` or the existing route handlers in the project to confirm the exact route handler signature for this Next.js version. Then write:

  ```typescript
  import { createSupabaseServerClient } from '@/lib/supabase/server'
  import { NextResponse } from 'next/server'

  export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
      const supabase = await createSupabaseServerClient()
      await supabase.auth.exchangeCodeForSession(code)
    }

    return NextResponse.redirect(new URL('/', origin))
  }
  ```

- [ ] **Step 3: Verify build passes**

  ```bash
  npm run build
  ```

  Expected: build succeeds with new routes at `/login` and `/auth/callback`.

- [ ] **Step 4: Manual smoke test (dev server)**

  ```bash
  npm run dev
  ```

  - Open `http://localhost:3000/login` — email form renders with no errors
  - Enter a real email → click "로그인 링크 받기" → "이메일을 확인하세요" message appears
  - Check inbox for magic link email from Supabase

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/login/ src/app/auth/
  git commit -m "feat: login page (magic link) + auth callback route"
  ```

---

### Task 6: AuthProvider + middleware + layout + Header + deploy

**Files:**
- Create: `src/components/auth/AuthProvider.tsx`
- Create: `src/middleware.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/layout/Header.tsx`

**Interfaces:**
- Consumes:
  - `supabase` from `@/lib/supabase/client`
  - `storage` from `@/lib/storage`
  - `SupabaseAdapter` from `@/lib/storage/SupabaseAdapter`
  - `LocalStorageAdapter` from `@/lib/storage/LocalStorageAdapter`
  - `migrateLocalToSupabase` from `@/lib/storage/migration`
  - `createSupabaseServerClient` from `@/lib/supabase/server` (middleware only)
- Produces:
  - `AuthProvider` component — wraps app, manages adapter swap + migration
  - `useAuth()` hook — returns `{ user: User | null, signOut: () => Promise<void> }`
  - Middleware — redirects unauthenticated requests to `/login`

---

- [ ] **Step 1: Create `src/components/auth/AuthProvider.tsx`**

  ```typescript
  'use client'

  import { createContext, useContext, useEffect, useState } from 'react'
  import type { User } from '@supabase/supabase-js'
  import { supabase } from '@/lib/supabase/client'
  import { storage } from '@/lib/storage'
  import { SupabaseAdapter } from '@/lib/storage/SupabaseAdapter'
  import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter'
  import { migrateLocalToSupabase } from '@/lib/storage/migration'

  interface AuthContextValue {
    user: User | null
    signOut: () => Promise<void>
  }

  const AuthContext = createContext<AuthContextValue>({
    user: null,
    signOut: async () => {},
  })

  export function useAuth() {
    return useContext(AuthContext)
  }

  export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)

    async function activateSupabase(u: User) {
      const adapter = new SupabaseAdapter(supabase, u.id)
      storage.setAdapter(adapter)
      setUser(u)
      const localAdapter = new LocalStorageAdapter()
      await migrateLocalToSupabase(localAdapter, adapter)
    }

    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) activateSupabase(session.user)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          activateSupabase(session.user)
        } else {
          storage.setAdapter(new LocalStorageAdapter())
          setUser(null)
        }
      })

      return () => subscription.unsubscribe()
    }, [])

    const signOut = async () => {
      await supabase.auth.signOut()
    }

    return (
      <AuthContext.Provider value={{ user, signOut }}>
        {children}
      </AuthContext.Provider>
    )
  }
  ```

- [ ] **Step 2: Create `src/middleware.ts`**

  ```typescript
  import { createServerClient } from '@supabase/ssr'
  import { NextResponse } from 'next/server'
  import type { NextRequest } from 'next/server'

  export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
      request: { headers: request.headers },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/auth')

    if (!user && !isAuthPath) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return response
  }

  export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
  }
  ```

- [ ] **Step 3: Wrap layout with AuthProvider**

  Replace the `<body>` content in `src/app/layout.tsx`:

  ```typescript
  import type { Metadata } from 'next'
  import { Noto_Sans, Fira_Code } from 'next/font/google'
  import './globals.css'
  import { BottomNav } from '@/components/layout/BottomNav'
  import { AuthProvider } from '@/components/auth/AuthProvider'

  const notoSans = Noto_Sans({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-sans',
    display: 'swap',
  })

  const firaCode = Fira_Code({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-mono',
    display: 'swap',
  })

  export const metadata: Metadata = {
    title: 'FigBook',
    description: '프로덕트 지표 메모장',
  }

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="ko" className={`${notoSans.variable} ${firaCode.variable}`}>
        <body className="bg-background min-h-dvh font-sans">
          <AuthProvider>
            <main className="max-w-lg mx-auto pt-14 pb-20 min-h-dvh">
              {children}
            </main>
            <BottomNav />
          </AuthProvider>
        </body>
      </html>
    )
  }
  ```

- [ ] **Step 4: Update `src/components/layout/Header.tsx` — add logout button**

  Replace the full file content:

  ```typescript
  'use client'

  import { useState, useEffect } from 'react'
  import { LayoutList, LayoutGrid, LogOut, LogIn } from 'lucide-react'
  import { useAuth } from '@/components/auth/AuthProvider'
  import { useRouter } from 'next/navigation'

  type ViewMode = 'list' | 'grid'

  interface HeaderProps {
    view: ViewMode
    onToggleView: (v: ViewMode) => void
  }

  const PIG_EMOJIS = ['🐷', '🐽', '🐖']

  export function Header({ view, onToggleView }: HeaderProps) {
    const [pig, setPig] = useState('🐷')
    const { user, signOut } = useAuth()
    const router = useRouter()

    useEffect(() => {
      setPig(PIG_EMOJIS[Math.floor(Math.random() * PIG_EMOJIS.length)])
    }, [])

    const handleSignOut = async () => {
      await signOut()
      router.push('/login')
    }

    return (
      <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 max-w-lg mx-auto px-4">
          <div className="flex items-center gap-1">
            <a href="/" className="text-lg font-bold text-black font-sans tracking-tight hover:opacity-80 transition-opacity">
              {pig} FigBook
            </a>
            {user ? (
              <button
                onClick={handleSignOut}
                aria-label="로그아웃"
                className="ml-1 p-1.5 text-secondary hover:text-foreground cursor-pointer transition-colors"
              >
                <LogOut size={14} />
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                aria-label="로그인"
                className="ml-1 p-1.5 text-secondary hover:text-foreground cursor-pointer transition-colors"
              >
                <LogIn size={14} />
              </button>
            )}
          </div>
          <div className="flex border border-border">
            <button onClick={() => onToggleView('list')} aria-label="리스트 보기"
              className={`px-2.5 py-1.5 transition-colors cursor-pointer border-r border-border ${view === 'list' ? 'bg-foreground text-background' : 'bg-surface text-secondary hover:text-foreground'}`}>
              <LayoutList size={14} />
            </button>
            <button onClick={() => onToggleView('grid')} aria-label="그리드 보기"
              className={`px-2.5 py-1.5 transition-colors cursor-pointer ${view === 'grid' ? 'bg-foreground text-background' : 'bg-surface text-secondary hover:text-foreground'}`}>
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </header>
    )
  }
  ```

- [ ] **Step 5: Verify build passes**

  ```bash
  npm run build
  ```

  Expected: build succeeds.

- [ ] **Step 6: Run full test suite**

  ```bash
  npm test
  ```

  Expected: all tests green.

- [ ] **Step 7: Set Vercel environment variables**

  ```bash
  npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
  # paste: https://YOUR_PROJECT_REF.supabase.co

  npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
  # paste: your_anon_key_here
  ```

  Also add for preview:
  ```bash
  npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview
  npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
  ```

- [ ] **Step 8: Commit**

  ```bash
  git add src/components/auth/ src/middleware.ts src/app/layout.tsx src/components/layout/Header.tsx
  git commit -m "feat: AuthProvider + middleware + Header logout — full Supabase auth + adapter swap"
  ```

- [ ] **Step 9: Deploy to production**

  ```bash
  npx vercel --prod --yes
  ```

  Expected: deployment succeeds.

- [ ] **Step 10: End-to-end test on device**

  1. Open `https://metricspad.vercel.app` on iPhone — should redirect to `/login`
  2. Enter your email → receive magic link → click → redirected to home
  3. Add a test metric
  4. Open same URL on iPad → log in → same metric should appear
  5. Verify logout button (LogOut icon next to FigBook) works
