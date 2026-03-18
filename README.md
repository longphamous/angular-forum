# Aniverse

**Aniverse** is a full-featured community platform built for anime enthusiasts. It combines a traditional forum with a rich ecosystem of community tools — including a marketplace, blog, gallery, link database, gamification, a coin economy, and automated community bots — all in a single, cohesive application.

---

## Table of Contents

- [Overview](#overview)
- [User Guide](#user-guide)
  - [Getting Started](#getting-started)
  - [Feed](#feed)
  - [Forum](#forum)
  - [Blog](#blog)
  - [Gallery](#gallery)
  - [Marketplace](#marketplace)
  - [Link Database](#link-database)
  - [Anime Features](#anime-features)
  - [Shop](#shop)
  - [Lotto](#lotto)
  - [Calendar](#calendar)
  - [Messages](#messages)
  - [Dashboard](#dashboard)
  - [Profile](#profile)
  - [Notifications](#notifications)
  - [Coins & Wallet](#coins--wallet)
  - [XP & Levels](#xp--levels)
- [Admin Guide](#admin-guide)
  - [User & Group Management](#user--group-management)
  - [Forum Administration](#forum-administration)
  - [Content Moderation](#content-moderation)
  - [Community Bot](#community-bot)
  - [Coin Settings](#coin-settings)
  - [Gamification Settings](#gamification-settings)
  - [Feed Management](#feed-management)
  - [Shop Management](#shop-management)
  - [Slideshow](#slideshow)
  - [Admin Overview](#admin-overview)
- [Development Setup](#development-setup)
- [Running Tests](#running-tests)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)

---

## Overview

Aniverse is designed as a complete community hub. Every feature is built around keeping members engaged, rewarding participation, and giving administrators powerful tools to moderate and automate community management.

**Key highlights:**

- **Forum** — Threaded discussions organized in categories and sub-forums
- **Feed** — Personalized, algorithm-ranked activity stream
- **Marketplace** — Community-driven buy/sell/trade platform
- **Link Database** — Curated, categorized collection of community links
- **Blog** — Personal and community blog with rich-text editing
- **Gallery** — Photo and video albums with access controls
- **Anime Tracking** — Browse the anime database and maintain a personal watchlist
- **Gamification** — XP system, levels, and achievements for participation
- **Coin Economy** — Earn and spend virtual coins across the platform
- **Community Bot** — Automate greetings, re-engagement messages, and announcements
- **Admin Panel** — Centralized administration for all modules

**Languages:** English and German (switchable at runtime)

---

## User Guide

### Getting Started

#### Registration

Navigate to `/register` to create a new account. Fill in your username, email address, and a password. After registration you will be automatically logged in and redirected to the feed.

#### Login

Navigate to `/login` and enter your credentials. The application uses JWT tokens for authentication; the token is automatically included in all subsequent API calls.

#### Navigation

The sidebar on the left contains the main navigation grouped into three sections:

| Section | Contents |
|---------|----------|
| **Community** | Feed, Dashboard, Forum, Messages, Blog, Gallery, Calendar, Lotto, Shop, Marketplace, Link Database |
| **Anime** | Top List, Anime Database, My List |
| **Admin** | All administrative tools (only visible to Admin group members) |

The sidebar can be collapsed to maximize content space. Your active language and dark/light mode preferences are persisted across sessions.

---

### Feed

**Route:** `/feed`

The feed is the main landing page after login. It shows forum threads ranked by activity and relevance.

**How it works:**

- Threads are scored using a hotness algorithm: `score = views + replies × 3`
- You can switch between three views using the tabs at the top:
  - **Hot** — Trending threads based on the score above
  - **New** — Most recently created threads
  - **Top** — Threads with the most replies overall
- A **search bar** lets you filter threads by title across all forums in real time
- **Featured threads** (pinned by admins) always appear at the top regardless of sort order
- Each thread card displays the author's avatar, XP level badge, post count, creation date, and reply count

---

### Forum

**Route:** `/forum`

The forum is the core discussion area. It is organized in a three-level hierarchy:

```
Category
  └── Forum (Sub-forum)
        └── Thread
              └── Post (Reply)
```

#### Browsing

- The forum overview (`/forum`) lists all categories and their forums with thread/post counts
- Click a forum to see its thread list (`/forum/forums/:forumId`)
- Click a thread to read the full discussion (`/forum/threads/:threadId`)

#### Creating a Thread

1. Navigate to any forum
2. Click **New Thread**
3. Enter a title and write your post using the text editor
4. Submit — your thread is immediately visible

#### Replying

Open any thread and use the reply box at the bottom. Replies appear in chronological order beneath the original post.

#### Reactions

Hover over any post to reveal reaction options. Reactions are emoji-based and multiple users can react to the same post. Receiving a reaction earns you XP.

---

### Blog

**Route:** `/blog`

The blog allows community members to publish longer-form articles.

#### Reading

The blog index shows all published posts sorted by date. Click any card to open the full article.

#### Writing a Post

1. Click **Write** (or navigate to `/blog/write`)
2. Use the **Quill rich-text editor** to compose your article — supports headings, images, code blocks, lists, bold/italic, and more
3. Fill in the **title**, optional **excerpt**, **cover image URL**, **category**, and **tags**
4. Choose **Draft** (only visible to you) or **Published** (visible to everyone)
5. Save — published posts appear immediately in the blog index

#### Editing

Authors can edit their own posts. Navigate to the post and click **Edit**, or go to `/blog/:slug/edit`.

#### Comments

Each blog post has a comment section at the bottom. Comments support nested replies (reply to a comment). Writing a blog post or comment earns coins depending on coin settings.

---

### Gallery

**Route:** `/gallery`

The gallery organizes community media into albums.

#### Browsing

The gallery index lists all accessible albums. Albums marked **Private** require a password to enter. Click an album to view its media items.

#### Media Types

Albums can contain:
- **Images** — Uploaded photos
- **Videos** — Video files
- **YouTube** — Embedded YouTube links

#### Ratings & Comments

Each media item supports 1–5 star ratings and a comment thread. Whether ratings and comments are enabled is configured per album.

#### Access Levels

| Level | Who can see it |
|-------|----------------|
| **Public** | Everyone, including guests |
| **Members Only** | Logged-in members |
| **Private** | Members who enter the correct password |

#### Geolocation

Media items can optionally store a geolocation (latitude/longitude) to show where a photo was taken.

---

### Marketplace

**Route:** `/marketplace`

The marketplace lets community members buy, sell, and trade items with each other.

#### Browsing Listings

- The marketplace index shows all **active** listings
- Use the category sidebar to filter by category
- Search by title or description
- Sort by date, price, or activity

#### Creating a Listing

1. Go to `/marketplace/create`
2. Choose a **type**: Buy, Sell, or Trade
3. Fill in a title, description, price, and category
4. Add custom fields if needed
5. Set an optional **expiration date**
6. Submit — listings with approval required go into a **Pending** state until an admin approves them; otherwise they become **Active** immediately

#### Offers

On any active listing you can send an **offer**:
- Specify an optional amount and a message
- The seller can **Accept**, **Reject**, or **Counter-offer**
- Accepting an offer moves the listing to **Sold** status and automatically rejects all other pending offers

#### Comments

Listings have a comment thread for questions or discussion before making an offer.

#### Ratings

After a trade is completed, both parties can leave a 1–5 star rating with optional text.

#### Reporting

If a listing violates community rules, use the **Report** button. Admins review reports and can remove the listing or ban the seller.

#### My Listings

`/marketplace/my` shows all your own listings across all statuses (Draft, Pending, Active, Sold, Closed, Archived). From here you can edit or delete your listings.

---

### Link Database

**Route:** `/links`

The link database is a curated, community-driven directory of useful links organized by category.

#### Browsing

- The left sidebar lists all categories with link counts
- Click a category to filter the results
- Use the search bar to find links by title, description, or domain
- Toggle between **Grid** and **List** view using the buttons in the top right
- Sort by: **Newest**, **Most Popular** (views), **Highest Rated**, or **Alphabetical**

#### Active Filters

Applied filters (category, tag, or search query) are shown as removable chips above the results. Click the × on a chip or **Clear filters** to reset.

#### Submitting a Link

1. Click **Submit Link** (or go to `/links/submit`)
2. Fill in:
   - **URL** (required)
   - **Title** (required)
   - **Description**
   - **Category** (required)
   - **Tags** — type a tag and press Enter to add it
   - Optional: address, contact email/phone, preview image URL, custom fields
3. Submit — the link goes into **Pending** review until approved by an admin

#### Link Detail

Click any link card to open the detail page (`/links/:id`):
- See the full description, tags, and metadata
- **Open Site** button opens the link in a new tab (view count increments on each visit)
- Leave a **1–5 star rating**
- Read and write **comments**
- If geolocation is set, a link to the map address is shown

#### Tags

Clicking a tag pill on any link filters the results to show all links with that tag.

---

### Anime Features

#### Anime Top List

**Route:** `/anime-top-list`

A ranked list of the most popular anime. Browse titles, view ratings, and click through to the detail page.

#### Anime Database

**Route:** `/anime-database`

The full searchable anime catalog. Filter by genre, status, or score. Includes:
- Anime title, synopsis, cover image
- Genres, studio, episode count, airing status
- Average community score

#### Anime Detail

**Route:** `/anime/:id`

Full information page for a single anime including synopsis, genres, studio, and episode count. From here you can add the title to your personal list.

#### My Anime List

**Route:** `/anime/my-list`

Track your personal anime viewing status:
- **Watching** — Currently watching
- **Completed** — Finished
- **Plan to Watch** — On your backlog
- **Dropped** — Started but stopped

You can also view another member's list at `/users/:userId/anime-list`.

---

### Shop

**Route:** `/shop`

The shop lets members spend their earned coins on virtual items.

#### How it Works

1. Browse available items — each shows a name, description, price in coins, and remaining stock
2. Click **Buy** to purchase an item; the coin cost is deducted from your wallet immediately
3. Purchased items appear in your inventory
4. Some items have a **maximum purchase limit per user** — once reached, the Buy button is disabled

Items may be:
- **Limited stock** — Once stock runs out, the item becomes unavailable
- **Unlimited** — Always available as long as you have enough coins

---

### Lotto

**Route:** `/lotto`

The lotto is a community lottery powered by coins.

#### How it Works

1. Buy a ticket using coins — the cost is set by the admin
2. When the draw happens, a winner is selected randomly from all ticket holders
3. The prize (in coins) is transferred to the winner's wallet automatically
4. All participants are notified of the result

---

### Calendar

**Route:** `/calendar`

A community calendar showing upcoming events. Events are created and managed by admins. Click any event to see its full details including date, time, and description.

---

### Messages

**Route:** `/messages`

Direct private messaging between community members.

#### Starting a Conversation

1. Navigate to `/messages`
2. Click **New Conversation**
3. Search for and select one or more recipients
4. Write your first message and send

#### Conversations

The left panel lists all your conversations sorted by most recent. Unread conversations are highlighted with a badge showing the unread count. Click a conversation to open it and see the full message history.

You receive a **notification** whenever someone sends you a new message.

---

### Dashboard

**Route:** `/dashboard`

A personalized overview page with multiple widgets:

| Widget | Description |
|--------|-------------|
| **Active Forums** | Recent forum activity |
| **Stats** | Platform-wide totals (users, posts, threads) |
| **Newest Anime** | Recently added to the anime database |
| **Recent Threads** | Latest forum threads |
| **Top Posters** | Most active forum contributors |
| **Top Wealth** | Members with the most coins |
| **Upcoming Events** | Next calendar events |
| **Online Users** | Members currently active |

---

### Profile

**Route:** `/profile`

Edit your own profile:
- Display name and avatar
- Bio/about me text
- Birthday (used by the community bot for birthday greetings)
- Other personal settings

To view another member's public profile, go to `/users/:userId`.

---

### Notifications

The bell icon in the top bar shows unread notification count. Notifications are sent automatically by the system for:
- New messages received
- Offers on your marketplace listings
- Offer accepted/rejected
- Blog post comments
- Community bot messages

Click a notification to navigate directly to the relevant content. Mark all as read with a single click.

---

### Coins & Wallet

Coins are Aniverse's virtual currency. You earn coins by participating in the community and spend them in the shop, lotto, and marketplace.

#### Earning Coins

| Activity | Default reward |
|----------|---------------|
| Create a forum thread | 5 coins |
| Reply to a thread | 2 coins |
| Receive a reaction | 1 coin |
| Give a reaction | 1 coin |
| Publish a blog post | 10 coins |
| Write a blog comment | 3 coins |
| Upload to gallery | 5 coins |
| Daily login | varies |

> Admins can adjust or disable individual earning rules and exclude specific forums.

#### Spending Coins

- Buy items in the **Shop**
- Buy **Lotto** tickets

#### Wallet

Your coin balance is shown in the navigation bar. Click it to view your full transaction history with dates and descriptions.

---

### XP & Levels

The XP system tracks your contribution to the community and assigns you a level and level title.

#### Earning XP

| Activity | XP awarded |
|----------|-----------|
| Create a forum thread | configurable |
| Create a forum post | configurable |
| Receive a reaction | configurable |
| Give a reaction | configurable |

#### Levels

As you accumulate XP your level increases. Each level has a name (e.g., "Neuling" at level 1). Your current level and a progress bar toward the next level are displayed on your profile and on your feed/forum cards.

---

## Admin Guide

All admin routes require membership in the **Admin** group. The admin section appears in the sidebar (collapsed by default).

---

### User & Group Management

#### Users — `/admin/users`

- View all registered users in a paginated table
- Search by username or email
- Edit user details (display name, email, group)
- Suspend or delete accounts

#### Groups — `/admin/groups`

- Create and manage user groups (e.g., "Admin", "Moderator", "Registrierte Benutzer")
- Assign users to groups
- Groups control which pages and features users can access

#### Page Permissions — `/admin/permissions`

- Define which groups can access which routes
- Works together with the `accessGuard` on the frontend

---

### Forum Administration

**Route:** `/admin/forum`

- Create, rename, and delete **categories** and **forums**
- Set icons, descriptions, and sort order for each forum
- Archive or lock specific forums

---

### Content Moderation

#### Blog — `/admin/blog`

- View all blog posts across all authors
- Publish, unpublish, or delete any post
- Manage blog categories

#### Gallery — `/admin/gallery`

- View and manage all albums
- Change access levels, remove inappropriate media

#### Marketplace — `/admin/marketplace`

The marketplace admin panel has two tabs:

**Pending Listings** — Listings awaiting approval
- View listing details
- **Approve** (listing becomes Active) or **Reject** (listing is hidden with a reason sent to the author)

**Reports** — Listings flagged by community members
- View report details and the flagged listing
- Take action: remove listing, warn user, or dismiss the report

#### Link Database — `/admin/link-database`

**Two management areas:**

**Pending Links** — Links submitted by users
- Preview the URL, title, category, and description
- **Approve** or **Reject** with an optional reason
- Assign a link to a specific moderator for review

**Categories** — Manage link categories
- Create new categories with name, description, icon class, color, and sort order
- Toggle **Requires Approval** per category
- Set the **default sort order** for that category

---

### Community Bot

**Route:** `/admin/community-bot`

The community bot automates engagement messages and workflow notifications.

#### How It Works

Each bot has:
- A **trigger** — what event causes it to fire
- Optional **conditions** — filter which users it applies to
- An **action** — what it does when it fires
- An **action config** — the content of the message or notification

#### Triggers

| Trigger | When it fires |
|---------|--------------|
| **New User** | Immediately when a new member registers |
| **User Birthday** | On the member's birthday (checked daily at 08:00 UTC) |
| **User Inactivity** | When a member has not logged in for N days (checked at 09:00 UTC) |
| **New Thread** | When a new thread is created (optionally limited to a specific forum) |
| **Scheduled** | On a custom cron expression (e.g., every Monday at 09:00) |
| **User Group Change** | When a user is added to or removed from a group |

#### Conditions

Conditions let you narrow which users the bot applies to:

| Field | Meaning |
|-------|---------|
| `user_role` | Match on user role string |
| `user_post_count` | Number of forum posts |
| `user_registration_days` | How many days since registration |
| `user_group_id` | Specific group ID |

Combine multiple conditions — all must match for the bot to fire.

#### Actions

| Action | What happens |
|--------|-------------|
| **Send Notification** | Creates an in-app notification for the target user |
| **Send Private Message** | Sends a direct message to the target user |
| **Log Only** | Records the event in the log without messaging the user (useful for testing) |

#### Message Templates

Use placeholder variables in notification titles/bodies and message subjects/bodies:

| Placeholder | Value |
|-------------|-------|
| `{{username}}` | User's login name |
| `{{displayName}}` | User's display name |
| `{{threadTitle}}` | Title of the new thread (for `new_thread` trigger) |
| `{{forumName}}` | Forum name |
| `{{inactiveDays}}` | Number of days since last login |
| `{{date}}` | Current date |

#### Test Mode

Enable **Test Mode** on a bot to run it without actually sending messages or notifications. Actions are logged as `test` status instead.

#### Testing a Bot

Click **Test** on any bot in the list. The system immediately simulates a run and shows you the resulting log entries so you can verify the output before enabling it in production.

#### Bot Logs

Click **Logs** on any bot (or the global **All Logs** button) to view a paginated history of all bot executions. Each entry shows:
- Date and time
- Trigger that fired
- Action taken
- Status: `success`, `test`, `skipped`, or `failed`
- Target user
- Message content

---

### Coin Settings

**Route:** `/admin/coins`

Configure how members earn coins:

- **Enable/disable** coin earning globally or per activity type
- Set the **coin amount** for each activity:
  - Thread creation
  - Post reply
  - Receiving a reaction
  - Giving a reaction
  - Blog post publication
  - Blog comment
  - Gallery upload
  - Daily login
- **Exclude forums** — paste forum IDs to exclude them from coin earning (e.g., off-topic sections)

**Admin coin tools:**
- Transfer coins to/from any user (reward or penalty)
- View all wallet balances in a table
- View the full platform-wide transaction log

---

### Gamification Settings

**Route:** `/admin/gamification`

Configure XP rewards:
- Set XP per event type: `create_thread`, `create_post`, `receive_reaction`, `give_reaction`
- Enable or disable XP earning globally

**Route:** `/admin/achievements`

- Create achievement definitions
- Define the trigger conditions
- Award achievements manually or automatically

---

### Feed Management

**Route:** `/admin/feed`

**Featured Threads**
- Pin specific threads to always appear at the top of the feed
- Set a custom position/order for multiple featured threads
- Remove featured status from any thread

---

### Shop Management

**Route:** `/admin/shop`

- Create, edit, and delete shop items
- Set name, description, price (in coins), category, icon, image
- Configure stock: unlimited or limited quantity
- Set maximum purchases per user
- Enable/disable items without deleting them

---

### Slideshow

**Route:** `/admin/slideshow`

Manage the homepage/feature image carousel:
- Upload or link images
- Add captions and links
- Set display order
- Enable or disable individual slides

---

### Admin Overview

**Route:** `/admin/overview`

A dashboard of platform-wide statistics:
- Total registered users
- Total forum posts and threads
- Active listings in the marketplace
- Pending items awaiting moderation
- Recent activity log

---

## Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| [Node.js](https://nodejs.org/) | 18 or higher |
| [pnpm](https://pnpm.io/) | 8 or higher |
| [PostgreSQL](https://www.postgresql.org/) | 14 or higher |

### 1. Clone and Install

```bash
git clone https://github.com/your-username/aniverse.git
cd aniverse
pnpm install
```

### 2. Database Setup

Run the setup script once as a PostgreSQL superuser:

```bash
psql -U postgres -f projects/backend/base/database/setup-db.sql
```

This creates the `aniverse_base` database and the `aniverse_app` role.

### 3. Environment Variables

```bash
cp projects/backend/base/.env.example projects/backend/base/.env
```

Open the file and fill in:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aniverse_base
DB_USER=aniverse_app
DB_PASSWORD=your_password_here
JWT_SECRET=your_jwt_secret_here
```

### 4. Start Development Servers

Start all three projects simultaneously:

```bash
# Backend API (port 3000)
nx serve base

# Frontend — Aniverse (port 4201)
nx serve angular-forum

# Frontend — Anime DB (port 4202)
nx serve anime-db
```

Or run both frontends at once:

```bash
nx run-many --targets=serve --projects=angular-forum,anime-db
```

### 5. Linting

The project uses a custom lint script that runs Prettier followed by ESLint for each project:

```bash
# Lint frontend
node scripts/lint.mjs angular-forum

# Lint backend
node scripts/lint.mjs base
```

---

## Running Tests

### Frontend (Vitest)

```bash
nx test angular-forum
```

### Backend (Jest)

```bash
nx test base
```

---

## Building for Production

```bash
# Frontend
nx build angular-forum

# Backend
nx build base
```

Output directories:
- Frontend: `dist/projects/frontend/angular-forum`
- Backend: `dist/projects/backend/base`

---

## Deployment

The application is configured for deployment on [Render.com](https://render.com/).

| Service | Build Command | Publish / Start |
|---------|--------------|-----------------|
| angular-forum (Static Site) | `nx build angular-forum` | `dist/projects/frontend/angular-forum` |
| base (Web Service) | `nx build base` | `node dist/projects/backend/base/main.js` |

Automatic deployments are triggered on each push to the main branch.

---

## Resources

- [Nx Documentation](https://nx.dev/)
- [Angular Documentation](https://angular.dev/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [PrimeNG Documentation](https://primeng.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeORM Documentation](https://typeorm.io/)
- [Transloco Documentation](https://jsverse.github.io/transloco/)

---

*For technical architecture details, database schema, API reference, and developer guidelines, see [TECHNICAL.md](./docs/TECHNICAL.md).*
