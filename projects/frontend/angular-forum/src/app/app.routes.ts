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
            { path: "", redirectTo: "dashboard", pathMatch: "full" },
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
            }
        ]
    }
];
