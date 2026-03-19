# Aniverse — Technical Documentation

This document covers the architecture, project structure, key patterns, database schema, API design, and developer conventions for the Aniverse platform.

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Monorepo Structure](#monorepo-structure)
- [Frontend Architecture](#frontend-architecture)
  - [Project Layout](#project-layout)
  - [Routing & Guards](#routing--guards)
  - [State Management — Facade Pattern](#state-management--facade-pattern)
  - [Internationalization](#internationalization)
  - [Component Conventions](#component-conventions)
  - [Mock Interceptor](#mock-interceptor)
- [Backend Architecture](#backend-architecture)
  - [Project Layout](#project-layout-1)
  - [Module Structure](#module-structure)
  - [Authentication](#authentication)
  - [Database Access](#database-access)
  - [Scheduled Tasks](#scheduled-tasks)
  - [Notification System](#notification-system)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Key Design Patterns](#key-design-patterns)
- [Linting & Code Style](#linting--code-style)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Adding a New Feature Module](#adding-a-new-feature-module)

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | Angular | 21.1.6 |
| UI component library | PrimeNG (Aura theme) | 20 |
| CSS framework | Tailwind CSS | 4 |
| State management | Angular Signals | built-in |
| i18n | @jsverse/transloco | 7.6 |
| Rich text editor | Quill | 2.0 |
| Charts | Chart.js | 4.4 |
| Frontend test runner | Vitest | 4.1 |
| Backend framework | NestJS | 10.4 |
| ORM | TypeORM | 0.3.28 |
| Database | PostgreSQL | 14+ |
| Auth strategy | passport-jwt | 4.0 |
| Password hashing | bcryptjs | 3.0 |
| WebSocket | Socket.IO | 4.8 |
| Scheduler | @nestjs/schedule | 6.1 |
| Backend test runner | Jest | 30.2 |
| Package manager | pnpm | 10+ (enforced) |
| Monorepo tooling | Nx | 22.5 |
| Build tool (frontend) | Vite | 7.3 |
| TypeScript | typescript | 5.9 |
| Node.js | Node.js | 24+ (required) |

---

## Monorepo Structure

```
aniverse/
├── projects/
│   ├── frontend/
│   │   ├── angular-forum/          # Main community app (port 4201)
│   │   ├── anime-db/               # Standalone anime browser (port 4202)
│   │   └── libs/
│   │       └── shared/             # Shared UI library (components, utilities)
│   └── backend/
│       └── base/                   # NestJS API (port 3000)
│           ├── src/app/
│           └── database/
│               └── setup-db.sql    # One-time DB bootstrap script
├── scripts/
│   └── lint.mjs                    # Prettier + ESLint runner per project
├── nx.json                         # Nx workspace config
├── package.json
├── pnpm-workspace.yaml
├── README.md                       # User-facing handbook
└── TECHNICAL.md                    # This file
```

**Nx project names:**

| Name | Path |
|------|------|
| `angular-forum` | `projects/frontend/angular-forum` |
| `anime-db` | `projects/frontend/anime-db` |
| `shared` | `projects/frontend/libs/shared` |
| `base` | `projects/backend/base` |

---

## Frontend Architecture

### Project Layout

```
projects/frontend/angular-forum/src/app/
├── app.component.ts          # Root component (eagerly injects NavigationHistoryService)
├── app.routes.ts             # Lazy-loaded route definitions
├── core/
│   ├── api/                  # API route constant files (*.routes.ts)
│   ├── guards/               # authGuard, accessGuard
│   ├── interceptors/         # auth.interceptor, mock-interceptor
│   ├── models/               # TypeScript interfaces per domain
│   └── services/             # Singleton services (NavigationHistoryService, etc.)
├── facade/                   # Facade classes per domain
├── features/
│   ├── admin/                # Admin page components
│   └── pages/                # User-facing page components
└── shared/
    ├── components/           # Reusable UI components (NavigationBar, etc.)
    └── prime-ng/             # PrimeNG layout (AppLayout, AppMenu, AppMenuitem)
```

### Routing & Guards

All routes are lazily loaded via `loadComponent`. The route tree is:

```
/login          → LoginPage           (public)
/register       → RegisterPage        (public)
/              → AppLayout            (authGuard)
  /feed         → FeedPage            (accessGuard: Registrierte Benutzer)
  /forum        → ForumListComponent  (accessGuard: Registrierte Benutzer)
  /admin/*      → Admin components    (accessGuard: Admin)
  ...
```

**`authGuard`** — Checks whether a valid JWT token is present in local storage. Redirects to `/login` if not.

**`accessGuard`** — Reads `data.requiredGroups` from the activated route and checks whether the current user belongs to at least one of those groups. Redirects to `/feed` if not. Group data comes from the decoded JWT payload.

### State Management — Facade Pattern

Every domain has a corresponding **Facade** class (e.g., `AuthFacade`, `ForumFacade`, `MarketplaceFacade`) that:

1. Holds **Angular Signals** as the single source of truth for component state
2. Exposes **computed signals** for derived data
3. Issues HTTP requests via `HttpClient` and updates signals with results
4. Is provided in `root` (singleton per application)

```typescript
// Example facade structure
@Injectable({ providedIn: 'root' })
export class MarketplaceFacade {
    // State signals
    readonly listings = signal<MarketListing[]>([]);
    readonly loading = signal(false);
    readonly total = signal(0);

    // Derived state
    readonly hasListings = computed(() => this.listings().length > 0);

    // Methods update signals
    loadListings(filter: ListingFilter): void {
        this.loading.set(true);
        this.http.get<...>(MARKETPLACE_ROUTES.listings, { params: ... }).subscribe({
            next: (res) => {
                this.listings.set(res.items);
                this.total.set(res.total);
                this.loading.set(false);
            }
        });
    }
}
```

Components inject the facade and bind directly to its signals. All components use `ChangeDetectionStrategy.OnPush`.

### Internationalization

Translations are managed with **@jsverse/transloco**. Two locales are supported:

| Locale | File |
|--------|------|
| English | `src/assets/i18n/en.json` |
| German | `src/assets/i18n/de.json` |

Translation keys are structured by domain:

```json
{
  "nav": { "feed": "Feed", "forum": "Forum" },
  "forum": { "newThread": "New Thread" },
  "links": { "submitLink": "Submit Link" }
}
```

**In templates:**

```html
<!-- Pipe approach -->
{{ 'nav.feed' | transloco }}

<!-- Module approach (most common) -->
<ng-container *transloco="let t">
    {{ t('links.submitLink') }}
</ng-container>
```

**In TypeScript:**

```typescript
private readonly translocoService = inject(TranslocoService);
const label = this.translocoService.translate('nav.feed');
```

The `AppMenu` component reacts to language changes via `langChanges$` and rebuilds the entire menu on each switch.

### Component Conventions

- All components are **standalone** (`standalone: true`)
- All components use **`ChangeDetectionStrategy.OnPush`**
- Dependencies are injected via `inject()` (not constructor parameters) — required by `@angular-eslint/prefer-inject`
- Components do not hold business logic — they delegate to facades
- Template files are in separate `.html` files (`templateUrl`)
- TypeScript strict mode is enabled (`strict: true`)

**Placeholder strings for Angular template expressions:**

When displaying literal `{{variable}}` syntax to users (e.g., in the Community Bot admin), use a component property:

```typescript
protected readonly ph = {
    username: "{{username}}",
    displayName: "{{displayName}}"
};
```

```html
<!-- Renders "{{username}}" literally -->
{{ ph.username }}

<!-- Correct way to use in [placeholder] binding -->
[placeholder]="'Welcome, {{displayName}}!'"
```

Never use `\"` inside double-quoted HTML attributes — Prettier's HTML parser treats them as closing the attribute. Use a TypeScript property or `&quot;` (which renders as the literal text `&quot;` in Angular expressions, not a quote character).

### Mock Interceptor

During development, the `MockInterceptor` replaces real HTTP calls with static mock data. Toggle it by setting `useMockData = true` in `mock-interceptor.ts`. This allows frontend development without a running backend.

---

## Backend Architecture

### Project Layout

```
projects/backend/base/src/app/
├── app.module.ts             # Root module — imports all feature modules
├── app.controller.ts
├── app.service.ts
├── auth/
├── anime/
├── anime-list/
├── blog/
├── calendar/
├── chronik/
├── community-bot/
├── credit/
│   └── lotto/               # Lotto system with scheduler & draws
├── dashboard/
├── database/
├── dynamic-market/
├── feed/
├── forum/
├── friends/
├── gallery/
├── gamification/
│   └── tcg/                 # Trading Card Game (boosters, cards, listings)
├── group/
├── link-database/
├── marketplace/
├── messages/
├── notifications/
├── push/                    # WebSocket gateway (Socket.IO at /push)
├── shop/
├── slideshow/
└── user/
```

### Module Structure

Each feature module follows the same pattern:

```
feature/
├── entities/                 # TypeORM entity classes
│   └── feature.entity.ts
├── dto/                      # Data Transfer Objects (request/response shapes)
│   └── create-feature.dto.ts
├── models/                   # TypeScript enums/interfaces shared with frontend
│   └── feature.model.ts
├── feature.service.ts        # Business logic
├── feature.controller.ts     # HTTP route handlers
└── feature.module.ts         # NestJS module definition
```

Modules are imported in `app.module.ts`. The order matters for modules with dependencies (e.g., `ConfigModule` must be first).

### Authentication

**Strategy:** `passport-jwt` with Bearer tokens.

**Global guard:** `JwtAuthGuard` is applied globally in `app.module.ts`. Every route requires authentication **unless** decorated with `@Public()`.

```typescript
// Opt out of authentication
@Public()
@Get('public-data')
getPublicData() { ... }

// Inject the authenticated user into a handler
@Get('me')
getMe(@CurrentUser() user: JwtPayload) { ... }
```

**JWT payload shape:**

```typescript
interface JwtPayload {
    sub: string;        // User UUID
    username: string;
    groups: string[];   // e.g. ["Admin", "Registrierte Benutzer"]
}
```

Token expiry and secret are configured via environment variables (`JWT_SECRET`, `JWT_EXPIRES_IN`).

### Database Access

TypeORM is configured with `synchronize: true` in development (auto-creates/alters tables on startup). In production this should be set to `false` and migrations used instead.

**Entity conventions:**

```typescript
@Entity('table_name')
export class FeatureEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // JSONB columns for flexible data
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, unknown> | null;
}
```

**JSONB columns** are used for tags arrays, conditions, trigger/action configs, and custom fields to avoid over-normalization for infrequently queried flexible data.

**Repository injection:**

```typescript
@Module({
    imports: [TypeOrmModule.forFeature([FeatureEntity, UserEntity])],
    ...
})

// In service constructor:
@InjectRepository(FeatureEntity)
private readonly repo: Repository<FeatureEntity>
```

When a module needs access to `UserEntity` from another module, it registers `UserEntity` directly in its own `TypeOrmModule.forFeature()` rather than importing `UserModule`, because `UserModule` does not export its repository.

### Scheduled Tasks

Background tasks are handled via `@nestjs/schedule` (`SchedulerRegistry` + `CronJob`). The `ScheduleModule.forRoot()` call is idempotent — multiple modules can call it safely.

**Lotto scheduler** (`lotto.scheduler.ts`):

| Job | Schedule | Purpose |
|-----|----------|---------|
| Lotto draw | Configurable cron | Execute lottery draw, pick winner, distribute prize coins |

**Community Bot scheduler** (`bot-scheduler.service.ts`):

| Job | Schedule | Purpose |
|-----|----------|---------|
| Queue processor | Every minute | Process pending notification queue items (max 3 retries) |
| Birthday check | Daily at 08:00 UTC | Fire `user_birthday` trigger for matching users |
| Inactivity check | Daily at 09:00 UTC | Fire `user_inactivity` trigger for users inactive N+ days |

**Pattern:**

```typescript
@Injectable()
export class BotSchedulerService implements OnModuleInit {
    onModuleInit(): void {
        const job = new CronJob('0 8 * * *', () => this.checkBirthdays());
        this.schedulerRegistry.addCronJob('bot-birthdays', job);
        job.start();
    }
}
```

### Notification System

`NotificationsService.create()` is used throughout the backend to push in-app notifications:

```typescript
await this.notificationsService.create(
    userId,     // recipient user ID
    'system',   // notification type
    title,      // notification title
    body,       // notification body text
    link        // optional deep-link URL
);
```

Notifications are stored in the database and polled/fetched by the frontend.

---

## Database Schema

### Core Tables

| Table | Key Columns |
|-------|------------|
| `users` | id, username, email, passwordHash, displayName, avatar, birthday, lastSeenAt |
| `user_wallets` | id, userId, balance |
| `wallet_transactions` | id, walletId, type, amount, description, createdAt |
| `user_xp` | id, userId, totalXp, level |
| `xp_events` | id, userId, event, amount, createdAt |
| `xp_config` | id, event, amount, enabled |
| `credit_config` | id (single row), coinEarningEnabled, settings (JSONB) |

### Forum Tables

| Table | Key Columns |
|-------|------------|
| `forum_categories` | id, name, description, sortOrder |
| `forums` | id, categoryId, name, description, iconClass, sortOrder, threadCount, postCount |
| `forum_threads` | id, forumId, authorId, title, viewCount, replyCount, createdAt, deletedAt |
| `forum_posts` | id, threadId, authorId, content, createdAt, deletedAt |
| `forum_post_reactions` | id, postId, userId, reaction |

### Content Tables

| Table | Key Columns |
|-------|------------|
| `blog_posts` | id, authorId, title, slug, content, status, type, categoryId, tags (JSONB), viewCount |
| `blog_categories` | id, name, slug, postCount |
| `blog_comments` | id, postId, authorId, content, parentId |
| `gallery_albums` | id, title, accessLevel, passwordHash, watermark, allowComments, allowRatings, allowDownload |
| `gallery_media` | id, albumId, uploaderId, type, filename, mimeType, size, latitude, longitude, sortOrder |
| `gallery_comments` | id, mediaId, userId, content |
| `gallery_ratings` | id, mediaId, userId, rating (unique: mediaId+userId) |

### Marketplace Tables

| Table | Key Columns |
|-------|------------|
| `market_categories` | id, parentId, name, slug, sortOrder |
| `market_listings` | id, sellerId, categoryId, type, status, title, price, customFields (JSONB), expiresAt |
| `market_offers` | id, listingId, buyerId, status, amount, message |
| `market_comments` | id, listingId, authorId, content, parentId |
| `market_ratings` | id, listingId, raterId, rating, text |
| `market_reports` | id, listingId, reporterId, reason, status |

### Link Database Tables

| Table | Key Columns |
|-------|------------|
| `link_categories` | id, name, slug, iconClass, color, sortOrder, requiresApproval, defaultSortBy |
| `link_entries` | id, categoryId, submittedById, title, url, status, tags (JSONB), previewImageUrl, viewCount, rating, ratingCount, customFields (JSONB) |
| `link_comments` | id, entryId, authorId, content |
| `link_ratings` | id, entryId, userId, rating (unique: entryId+userId) |

### Community Bot Tables

| Table | Key Columns |
|-------|------------|
| `community_bots` | id, name, trigger, triggerConfig (JSONB), conditions (JSONB), action, actionConfig (JSONB), enabled, testMode, language |
| `bot_logs` | id, botId, trigger, action, status, targetUserId, message, details (JSONB) |
| `community_bot_queue` | id, botId, targetUserId, actionConfig (JSONB), status, retries, errorMessage |

### Communication Tables

| Table | Key Columns |
|-------|------------|
| `conversations` | id, lastMessageAt, lastMessagePreview |
| `conversation_participants` | id, conversationId, userId, lastReadAt, unreadCount |
| `messages` | id, conversationId, senderId, content, isDraft |
| `notifications` | id, userId, type, title, body, link, isRead, createdAt |

### TCG Tables

| Table | Key Columns |
|-------|------------|
| `booster_categories` | id, name, description, sortOrder |
| `booster_packs` | id, categoryId, name, description, price, cardCount, rarity, imageUrl |
| `cards` | id, name, description, imageUrl, rarity, attributes (JSONB) |
| `card_listings` | id, cardId, sellerId, price, status, createdAt |
| `user_cards` | id, userId, cardId, quantity |

### Friends Tables

| Table | Key Columns |
|-------|------------|
| `friendships` | id, requesterId, addresseeId, status, createdAt |

### Lotto Tables

| Table | Key Columns |
|-------|------------|
| `lotto_draws` | id, prizeAmount, ticketPrice, winnerId, drawDate, status |
| `lotto_tickets` | id, drawId, userId, createdAt |

### Other Tables

| Table | Key Columns |
|-------|------------|
| `groups` | id, name, description |
| `user_groups` (join) | userId, groupId |
| `page_permissions` | id, path, requiredGroup |
| `shop_items` | id, name, price, stock, maxPerUser, category |
| `user_inventory` | id, userId, itemId, quantity |
| `anime` | id, title, synopsis, genres, score, status |
| `anime_list_entries` | id, userId, animeId, status |
| `calendar_events` | id, title, startDate, endDate, description |
| `slideshows` | id, imageUrl, caption, link, sortOrder, enabled |
| `featured_threads` | id, threadId, position |

---

## API Reference

All API endpoints are prefixed with `/api`. The backend runs on port 3000 in development.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Obtain JWT token |
| GET | `/api/auth/me` | JWT | Get current user info |

### Forum

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/forum/categories` | JWT | List all categories |
| GET | `/api/forum/forums` | JWT | List all forums |
| GET | `/api/forum/forums/:id/threads` | JWT | Threads in a forum |
| POST | `/api/forum/threads` | JWT | Create thread |
| GET | `/api/forum/threads/:id` | JWT | Get thread + posts |
| POST | `/api/forum/posts` | JWT | Reply to thread |
| POST | `/api/forum/posts/:id/reactions` | JWT | React to post |

### Marketplace

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/marketplace/listings` | JWT | List active listings (filterable) |
| POST | `/api/marketplace/listings` | JWT | Create listing |
| GET | `/api/marketplace/listings/:id` | JWT | Get listing detail |
| PATCH | `/api/marketplace/listings/:id` | JWT | Update own listing |
| DELETE | `/api/marketplace/listings/:id` | JWT | Delete own listing |
| POST | `/api/marketplace/listings/:id/offers` | JWT | Send offer |
| PATCH | `/api/marketplace/offers/:id` | JWT | Accept/reject/counter offer |
| POST | `/api/marketplace/listings/:id/comments` | JWT | Comment on listing |
| POST | `/api/marketplace/listings/:id/ratings` | JWT | Rate completed trade |
| POST | `/api/marketplace/listings/:id/reports` | JWT | Report listing |
| PATCH | `/api/marketplace/listings/:id/approve` | Admin | Approve pending listing |
| PATCH | `/api/marketplace/listings/:id/reject` | Admin | Reject listing |
| PATCH | `/api/marketplace/reports/:id` | Admin | Action a report |

### Link Database

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/links/categories` | Public | List categories |
| GET | `/api/links` | Public | List approved links (filterable) |
| GET | `/api/links/:id` | Public | Get link detail (increments view count) |
| POST | `/api/links` | JWT | Submit new link |
| POST | `/api/links/:id/comments` | JWT | Comment on link |
| POST | `/api/links/:id/ratings` | JWT | Rate a link |
| PATCH | `/api/links/:id/approve` | Admin | Approve pending link |
| PATCH | `/api/links/:id/reject` | Admin | Reject link |
| POST | `/api/links/categories` | Admin | Create category |
| PATCH | `/api/links/categories/:id` | Admin | Update category |
| DELETE | `/api/links/categories/:id` | Admin | Delete category |

### Community Bot

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/community-bots` | Admin | List all bots |
| POST | `/api/community-bots` | Admin | Create bot |
| PATCH | `/api/community-bots/:id` | Admin | Update bot |
| DELETE | `/api/community-bots/:id` | Admin | Delete bot |
| POST | `/api/community-bots/:id/toggle` | Admin | Enable/disable bot |
| POST | `/api/community-bots/:id/test` | Admin | Test run bot |
| GET | `/api/community-bots/logs` | Admin | Get bot logs (paginated) |
| GET | `/api/community-bots/stats` | Admin | Get stats |

### Credit / Wallet

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/credit/wallet` | JWT | Get own wallet |
| GET | `/api/credit/transactions` | JWT | Get own transactions |
| GET | `/api/credit/leaderboard` | JWT | Top wallets |
| POST | `/api/credit/transfer` | Admin | Transfer coins between users |
| GET | `/api/credit/config` | Admin | Get coin earning config |
| PATCH | `/api/credit/config` | Admin | Update coin earning config |

### Gamification

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/gamification/xp` | JWT | Get own XP/level |
| GET | `/api/gamification/config` | Admin | Get XP config |
| PATCH | `/api/gamification/config` | Admin | Update XP config |

### TCG (Trading Card Game)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tcg/booster-packs` | JWT | List available booster packs |
| GET | `/api/tcg/booster-packs/:id` | JWT | Get booster pack details |
| POST | `/api/tcg/booster-packs/:id/open` | JWT | Purchase and open a booster pack |
| GET | `/api/tcg/cards` | JWT | List all cards |
| GET | `/api/tcg/collection` | JWT | Get own card collection |
| GET | `/api/tcg/listings` | JWT | List card trade listings |
| POST | `/api/tcg/listings` | JWT | Create card listing |
| POST | `/api/tcg/booster-categories` | Admin | Create booster category |
| POST | `/api/tcg/booster-packs` | Admin | Create booster pack |
| POST | `/api/tcg/cards` | Admin | Create card |

### Lotto

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/credit/lotto` | JWT | Get current lotto info |
| POST | `/api/credit/lotto/buy` | JWT | Buy lotto ticket |
| GET | `/api/credit/lotto/history` | JWT | Get draw history |

### Friends

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/friends` | JWT | List own friends |
| POST | `/api/friends/request` | JWT | Send friend request |
| PATCH | `/api/friends/request/:id` | JWT | Accept/decline request |
| DELETE | `/api/friends/:id` | JWT | Remove friend |

### Push (WebSocket)

The WebSocket gateway runs at `/push` and emits real-time events to connected clients:

| Event | Description |
|-------|-------------|
| `notification` | New notification for the user |
| `message` | New direct message received |

---

## Key Design Patterns

### 1. `@Public()` Decorator

Routes that should bypass `JwtAuthGuard`:

```typescript
import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata('isPublic', true);
```

The guard checks this metadata and skips verification if present.

### 2. `@CurrentUser()` Decorator

Extracts the JWT payload injected by Passport into the request:

```typescript
export const CurrentUser = createParamDecorator(
    (_, ctx: ExecutionContext): JwtPayload => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    }
);
```

### 3. Soft Deletes

Forum threads and posts, marketplace listings, and blog posts use TypeORM's soft delete (`@DeleteDateColumn() deletedAt`). Soft-deleted records are excluded from normal queries but can be recovered.

### 4. JSONB for Flexible Data

Arrays and nested objects that don't need to be independently queried are stored as PostgreSQL JSONB:
- Bot `triggerConfig`, `conditions`, `actionConfig`
- Listing `customFields`
- Credit config `settings`
- Link entry `tags`, `customFields`

### 5. Navigation History Service

`NavigationHistoryService` tracks the browser navigation stack to power the **Back** button. It must be instantiated early, so `AppComponent` eagerly injects it:

```typescript
export class AppComponent {
    // Injecting here ensures the service starts tracking from the very first navigation
    readonly navHistory = inject(NavigationHistoryService);
}
```

Without eager instantiation (since it's `providedIn: 'root'`), the service would only be created on the first component that injects it, missing earlier navigation events.

### 6. Bot Queue Processing

Community bot actions targeting many users (e.g., birthday greetings) write to a `community_bot_queue` table instead of executing inline. A cron job processes the queue every minute, sending up to N notifications per run and retrying failed items (max 3 attempts). This prevents timeouts and distributes load.

### 7. Rating Upsert Pattern

Ratings (gallery, link database) use a unique constraint on `(entityId, userId)` and perform an upsert:

```typescript
const existing = await this.repo.findOne({ where: { entryId, userId } });
if (existing) {
    existing.rating = rating;
    await this.repo.save(existing);
} else {
    await this.repo.save({ entryId, userId, rating });
}
// Recalculate average
await this.updateRatingAverage(entryId);
```

---

## Linting & Code Style

The project uses a custom script `scripts/lint.mjs` that runs:
1. **Prettier** — code formatting
2. **ESLint** — static analysis

```bash
node scripts/lint.mjs angular-forum   # frontend
node scripts/lint.mjs base            # backend
```

**Key ESLint rules enforced:**

| Rule | Scope | Effect |
|------|-------|--------|
| `@angular-eslint/prefer-inject` | Frontend TS | Must use `inject()` not constructor params |
| `@angular-eslint/template/label-has-associated-control` | Frontend HTML | Every `<label>` needs `for` + matching `id` |
| `@angular-eslint/template/click-events-have-key-events` | Frontend HTML | Clickable elements need keyboard event handlers |
| `@angular-eslint/template/interactive-supports-focus` | Frontend HTML | Interactive elements need `tabindex` |
| `@typescript-eslint/strict` | Both | TypeScript strict mode |

**Commit prefix convention:** `AF-XXXX:` (e.g., `AF-0001: add forum module`)

---

## Testing

### Frontend — Vitest

```bash
nx test angular-forum
# or with watch
nx test angular-forum --watch
```

Test files are co-located with their sources as `*.spec.ts`.

### Backend — Jest

```bash
nx test base
# or with coverage
nx test base --coverage
```

**Backend test conventions:**
- Use real repository interfaces, not mocked TypeORM repos
- Mock external services (NotificationsService, etc.) where needed
- Use `@nestjs/testing` `Test.createTestingModule()`

---

## Environment Variables

All environment variables live in `projects/backend/base/.env` (not committed):

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | Yes | PostgreSQL port (default 5432) |
| `DB_NAME` | Yes | Database name (`aniverse_base`) |
| `DB_USER` | Yes | Database role (`aniverse_app`) |
| `DB_PASSWORD` | Yes | Database password |
| `DB_SSL` | No | Enable SSL for DB connection (default: `false`) |
| `JWT_SECRET` | Yes | Secret used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `7d`) |
| `PORT` | No | Backend listen port (default: `3000`) |
| `NODE_ENV` | No | Environment mode (default: `development`) |
| `PUSH_ENABLED` | No | Enable WebSocket push gateway (default: `true`) |
| `ANIME_DB_HOST` | No | Secondary anime database host |
| `ANIME_DB_PORT` | No | Secondary anime database port |
| `ANIME_DB_USER` | No | Secondary anime database user |
| `ANIME_DB_PASSWORD` | No | Secondary anime database password |
| `ANIME_DB_NAME` | No | Secondary anime database name |
| `ANIME_DB_SCHEMA` | No | Secondary anime database schema |

The `ConfigModule` loads `.env` files in this order (first match wins):
1. `projects/backend/base/.env`
2. `.env` (repo root)

---

## Adding a New Feature Module

Follow these steps to add a new end-to-end feature.

### 1. Backend Module

```bash
# Create the directory
mkdir -p projects/backend/base/src/app/my-feature/{entities,dto,models}
```

Create the files following the pattern in any existing module:
- `my-feature.entity.ts` — TypeORM entity
- `create-my-feature.dto.ts` — Request DTO
- `my-feature.service.ts` — Business logic
- `my-feature.controller.ts` — HTTP handlers
- `my-feature.module.ts` — NestJS module

Register in `app.module.ts`:

```typescript
import { MyFeatureModule } from './my-feature/my-feature.module';

@Module({
    imports: [
        // ... existing modules ...
        MyFeatureModule
    ]
})
export class AppModule {}
```

### 2. Frontend API Routes

```typescript
// src/app/core/api/my-feature.routes.ts
export const MY_FEATURE_ROUTES = {
    base: '/api/my-feature',
    detail: (id: string) => `/api/my-feature/${id}`
} as const;
```

### 3. Frontend Models

```typescript
// src/app/core/models/my-feature/my-feature.ts
export interface MyFeature {
    id: string;
    name: string;
    createdAt: string;
}
```

### 4. Facade

```typescript
// src/app/facade/my-feature/my-feature-facade.ts
@Injectable({ providedIn: 'root' })
export class MyFeatureFacade {
    private readonly http = inject(HttpClient);

    readonly items = signal<MyFeature[]>([]);
    readonly loading = signal(false);

    loadItems(): void {
        this.loading.set(true);
        this.http.get<MyFeature[]>(MY_FEATURE_ROUTES.base).subscribe({
            next: (res) => { this.items.set(res); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }
}
```

### 5. Page Component

```
src/app/features/pages/my-feature/
├── my-feature-page.ts
└── my-feature-page.html
```

### 6. Route

```typescript
// app.routes.ts
{
    path: 'my-feature',
    data: { requiredGroups: ['Registrierte Benutzer'] },
    canActivate: [accessGuard],
    loadComponent: () =>
        import('./features/pages/my-feature/my-feature-page').then((c) => c.MyFeaturePage)
}
```

### 7. Navigation Menu

```typescript
// app.menu.ts — inside buildMenu()
{ label: this.t('nav.myFeature'), icon: 'pi pi-fw pi-star', routerLink: ['/my-feature'] }
```

### 8. Translations

Add keys to both `en.json` and `de.json`:

```json
{
  "nav": {
    "myFeature": "My Feature"
  },
  "myFeature": {
    "title": "My Feature",
    "empty": "No items found"
  }
}
```

### 9. Lint

```bash
node scripts/lint.mjs angular-forum
node scripts/lint.mjs base
```

Fix all reported issues before committing.
