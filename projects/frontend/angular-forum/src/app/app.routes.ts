import { Routes } from "@angular/router";

import { accessGuard } from "./core/guards/access.guard";
import { authGuard } from "./core/guards/auth.guard";
import { AppLayout } from "./shared/prime-ng/app.layout";

export const routes: Routes = [
    {
        path: "login",
        loadComponent: () => import("./features/pages/login-page/login-page").then((c) => c.LoginPage)
    },
    {
        path: "register",
        loadComponent: () => import("./features/pages/register-page/register-page").then((c) => c.RegisterPage)
    },
    {
        path: "",
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: "", redirectTo: "feed", pathMatch: "full" },
            {
                path: "feed",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/feed/feed-page").then((c) => c.FeedPage)
            },
            {
                path: "dashboard",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/dashboard/dashboard").then((c) => c.Dashboard)
            },
            {
                path: "forum",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/forums/forum-list/forum-list.component").then((c) => c.ForumListComponent)
            },
            {
                path: "forum/forums/:forumId",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/forums/thread/thread-list/thread-list").then((c) => c.ThreadList)
            },
            {
                path: "forum/forums/:forumId/create",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/forums/thread/thread-create/thread-create").then((c) => c.ThreadCreate)
            },
            {
                path: "forum/threads/:threadId",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/forums/thread/thread-detail/thread-detail").then((c) => c.ThreadDetail)
            },
            {
                path: "anime-top-list",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/anime/anime-top-list/anime-top-list").then((c) => c.AnimeTopList)
            },
            {
                path: "anime-database",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/anime/anime-database/anime-database").then((c) => c.AnimeDatabase)
            },
            {
                path: "anime/my-list",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/anime/my-anime-list/my-anime-list").then((c) => c.MyAnimeList)
            },
            {
                path: "anime/:id",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/anime/anime-detail/anime-detail").then((c) => c.AnimeDetail)
            },
            {
                path: "users/:userId",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/user-profile/user-profile-page").then((c) => c.UserProfilePage)
            },
            {
                path: "users/:userId/anime-list",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/anime/my-anime-list/my-anime-list").then((c) => c.MyAnimeList)
            },
            {
                path: "profile",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/profile/profile-page").then((c) => c.ProfilePage)
            },
            {
                path: "admin/overview",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/admin/admin-overview/admin-overview").then((c) => c.AdminOverview)
            },
            {
                path: "admin/forum",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/admin/admin-forum/admin-forum").then((c) => c.AdminForum)
            },
            {
                path: "admin/users",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/admin/admin-users/admin-users").then((c) => c.AdminUsers)
            },
            {
                path: "admin/groups",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/admin/admin-groups/admin-groups").then((c) => c.AdminGroups)
            },
            {
                path: "admin/permissions",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/admin/admin-permissions/admin-permissions").then((c) => c.AdminPermissions)
            },
            {
                path: "admin/gamification",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/admin/admin-gamification/admin-gamification").then((c) => c.AdminGamification)
            },
            {
                path: "admin/achievements",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/admin/admin-achievements/admin-achievements").then((c) => c.AdminAchievements)
            },
            {
                path: "admin/slideshow",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/admin/admin-slideshow/admin-slideshow").then((c) => c.AdminSlideshow)
            },
            {
                path: "admin/shop",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/admin/admin-shop/admin-shop").then((c) => c.AdminShop)
            },
            {
                path: "shop",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/shop/shop-page").then((c) => c.ShopPage)
            },
            {
                path: "calendar",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/calendar/calendar-page").then((c) => c.CalendarPage)
            },
            {
                path: "admin/calendar",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/admin/admin-calendar/admin-calendar").then((c) => c.AdminCalendar)
            },
            {
                path: "lotto",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/lotto/lotto-page").then((c) => c.LottoPage)
            },
            {
                path: "admin/lotto",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/admin/admin-lotto/admin-lotto").then((c) => c.AdminLotto)
            },
            {
                path: "messages",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/messages/messages-page").then((c) => c.MessagesPage)
            },
            {
                path: "gallery",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/gallery/gallery-page").then((c) => c.GalleryPage)
            },
            {
                path: "gallery/:albumId",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/gallery/gallery-album-page").then((c) => c.GalleryAlbumPage)
            },
            {
                path: "admin/gallery",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/admin/admin-gallery/admin-gallery").then((c) => c.AdminGallery)
            },
            {
                path: "blog",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/blog/blog-page").then((c) => c.BlogPage)
            },
            {
                path: "blog/write",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/blog/blog-write-page").then((c) => c.BlogWritePage)
            },
            {
                path: "blog/:slug/edit",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/blog/blog-write-page").then((c) => c.BlogWritePage)
            },
            {
                path: "blog/:slug",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/blog/blog-detail-page").then((c) => c.BlogDetailPage)
            },
            {
                path: "admin/blog",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/admin/admin-blog/admin-blog").then((c) => c.AdminBlog)
            },
            {
                path: "admin/coins",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/admin/admin-coins/admin-coins").then((c) => c.AdminCoins)
            },
            {
                path: "marketplace",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/marketplace/marketplace-page").then((c) => c.MarketplacePage)
            },
            {
                path: "marketplace/my",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/marketplace/my-listings-page").then((c) => c.MyListingsPage)
            },
            {
                path: "marketplace/create",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/marketplace/create-listing-page").then((c) => c.CreateListingPage)
            },
            {
                path: "marketplace/:id",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/marketplace/listing-detail-page").then((c) => c.ListingDetailPage)
            },
            {
                path: "admin/marketplace",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/admin/admin-marketplace/admin-marketplace").then((c) => c.AdminMarketplace)
            },
            {
                path: "admin/feed",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/admin/admin-feed/admin-feed").then((c) => c.AdminFeed)
            },
            {
                path: "admin/community-bot",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/admin/admin-community-bot/admin-community-bot").then((c) => c.AdminCommunityBot)
            },
            {
                path: "links",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/link-database/link-database-page").then((c) => c.LinkDatabasePage)
            },
            {
                path: "links/submit",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/link-database/link-submit-page").then((c) => c.LinkSubmitPage)
            },
            {
                path: "links/:id",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/link-database/link-detail-page").then((c) => c.LinkDetailPage)
            },
            {
                path: "admin/link-database",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/admin/admin-link-database/admin-link-database").then((c) => c.AdminLinkDatabase)
            },
            {
                path: "chronik",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/chronik/chronik-page").then((c) => c.ChronikPage)
            },
            {
                path: "market",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/pages/dynamic-market/dynamic-market-page").then((c) => c.DynamicMarketPage)
            },
            {
                path: "admin/market",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () =>
                    import("./features/admin/admin-dynamic-market/admin-dynamic-market").then(
                        (c) => c.AdminDynamicMarket
                    )
            },
            {
                path: "friends",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/friends/friends-page").then((c) => c.FriendsPage)
            },
            {
                path: "tcg",
                data: { requiredGroups: ["Registrierte Benutzer"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/pages/tcg/tcg-page").then((c) => c.TcgPage)
            },
            {
                path: "admin/tcg",
                data: { requiredGroups: ["Admin"] },
                canActivate: [accessGuard],
                loadComponent: () => import("./features/admin/admin-tcg/admin-tcg").then((c) => c.AdminTcg)
            }
        ]
    }
];
