# Supabase Cross-Device Sync — Design Spec

## Goal

iPad, iPhone, 어떤 기기에서 접속해도 동일한 데이터를 볼 수 있도록 Supabase 기반 인증 + 클라우드 스토리지를 추가한다.

## Architecture

### Adapter Swap 패턴

기존 `StorageService` 인터페이스와 `storage` 싱글턴을 그대로 유지하되, 런타임에 어댑터를 교체한다.

```
Before login:  storage → LocalStorageAdapter
After login:   storage → SupabaseAdapter
```

모든 컴포넌트는 `import { storage } from '@/lib/storage/LocalStorageAdapter'` 그대로 유지. 교체는 `StorageManager`가 담당.

### 파일 구조

```
src/lib/
  supabase/
    client.ts           — Supabase 클라이언트 싱글턴
    auth.ts             — signInWithEmail, signOut, getSession, onAuthStateChange
  storage/
    StorageService.ts   — (기존, 변경 없음)
    LocalStorageAdapter.ts — (기존, 변경 없음)
    SupabaseAdapter.ts  — NEW: StorageService 구현체 (Supabase)
    StorageManager.ts   — NEW: 활성 어댑터 보유, 런타임 스왑
    index.ts            — NEW: storage 싱글턴 re-export (StorageManager 위임)
    migration.ts        — NEW: localStorage → Supabase 일회성 마이그레이션

src/app/
  login/page.tsx        — NEW: 이메일 입력 + 매직 링크 발송 UI
  auth/callback/route.ts — NEW: Supabase OAuth callback 처리 (세션 수립)
  layout.tsx            — 수정: AuthProvider 래핑, 미인증 시 /login 리다이렉트

src/components/
  auth/
    AuthProvider.tsx    — NEW: 세션 감지, 어댑터 스왑, 마이그레이션 트리거
  layout/
    Header.tsx          — 수정: FigBook 타이틀 바로 오른쪽에 로그인/로그아웃 버튼 추가
```

## 인증 플로우

1. 앱 로드 → `AuthProvider`가 Supabase 세션 확인
2. 세션 없음 → `/login`으로 리다이렉트
3. `/login`: 이메일 입력 → "로그인 링크 보내기" 클릭 → Supabase가 매직 링크 발송
4. 사용자가 이메일의 링크 클릭 → `/auth/callback`으로 리다이렉트
5. `/auth/callback`: 세션 수립 → 홈(`/`)으로 리다이렉트
6. `AuthProvider`가 세션 감지 → SupabaseAdapter로 스왑 → 마이그레이션 실행(필요시)

## Supabase DB 스키마

```sql
-- products
create table products (
  id          uuid primary key,
  user_id     uuid references auth.users not null,
  name        text not null,
  "order"     integer not null default 0,
  created_at  timestamptz not null default now()
);

-- features
create table features (
  id          uuid primary key,
  user_id     uuid references auth.users not null,
  product_id  uuid not null references products(id) on delete cascade,
  name        text not null,
  "order"     integer not null default 0,
  created_at  timestamptz not null default now()
);

-- metrics
create table metrics (
  id          uuid primary key,
  user_id     uuid references auth.users not null,
  product_id  uuid not null references products(id) on delete cascade,
  feature_id  uuid references features(id) on delete set null,
  name        text not null,
  value       text not null,
  unit        text not null default '',
  category    text[] not null default '{}',
  memo        text not null default '',
  base_date   text not null,
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- RLS: 본인 데이터만 접근 가능
alter table products enable row level security;
alter table features enable row level security;
alter table metrics enable row level security;

create policy "users own products" on products for all using (auth.uid() = user_id);
create policy "users own features" on features for all using (auth.uid() = user_id);
create policy "users own metrics"  on metrics  for all using (auth.uid() = user_id);
```

Settings와 최근검색어는 localStorage에 유지 (API 키 등 기기별 민감 데이터).

## 마이그레이션

- 트리거: 첫 로그인 후 Supabase에 products가 0개일 때
- 동작: LocalStorageAdapter에서 products/features/metrics를 읽어 Supabase에 bulk insert. `user_id`를 현재 로그인 유저 ID로 덮어씀
- 완료 후: localStorage에 `figbook_migrated = "true"` 저장해 재실행 방지
- 실패시: 조용히 무시하고 빈 상태로 시작 (데이터 손실 없음 — localStorage 원본 유지)

## 헤더 레이아웃

```
[ 🐷 FigBook  [로그아웃] ]          [ ☰  ⊞ ]
  ↑ 좌측                              ↑ 우측 (현재 위치 유지)
```

- 로그인 전: `[로그인]` 버튼 표시 (→ `/login`)
- 로그인 후: 유저 이메일 약자 또는 `[로그아웃]` 아이콘 버튼

## 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Vercel 대시보드와 `.env.local`에 모두 설정 필요.

## StorageManager 인터페이스

```typescript
// 내부적으로 활성 어댑터를 들고 있음
class StorageManager implements StorageService {
  private adapter: StorageService = new LocalStorageAdapter()
  setAdapter(adapter: StorageService): void
  // StorageService 메서드 전부 → this.adapter에 위임
}

export const storage = new StorageManager()
```

기존 `import { storage } from '@/lib/storage/LocalStorageAdapter'`는
`import { storage } from '@/lib/storage'`로 일괄 변경 필요.

## 범위 밖 (이번 구현 제외)

- 실시간 동기화 (Supabase Realtime) — 여러 기기 동시 사용시 즉시 반영
- 오프라인 지원
- 소셜 로그인 추가 (Google 등)
