import { Routes } from "@angular/router";

import { AppLayout } from "./shared/prime-ng/app.layout";

export const routes: Routes = [
    {
        path: "",
        component: AppLayout,
        children: [
            { path: "", redirectTo: "dashboard", pathMatch: "full" },
            {
                path: "dashboard",
                loadComponent: () => import("./features/pages/dashboard/dashboard").then((c) => c.Dashboard)
            },
            {
                path: "forum",
                loadComponent: () =>
                    import("./features/forums/forum-list/forum-list.component").then((c) => c.ForumListComponent)
            },
            {
                path: "forum/forums/:forumId",
                loadComponent: () =>
                    import("./features/forums/thread/thread-list/thread-list").then((c) => c.ThreadList)
            },
            {
                path: "forum/forums/:forumId/create",
                loadComponent: () =>
                    import("./features/forums/thread/thread-create/thread-create").then((c) => c.ThreadCreate)
            },
            {
                path: "forum/threads/:threadId",
                loadComponent: () =>
                    import("./features/forums/thread/thread-detail/thread-detail").then((c) => c.ThreadDetail)
            },
            {
                path: "anime-top-list",
                loadComponent: () =>
                    import("./features/pages/anime/anime-top-list/anime-top-list").then((c) => c.AnimeTopList)
            },
            {
                path: "anime-database",
                loadComponent: () =>
                    import("./features/pages/anime/anime-database/anime-database").then((c) => c.AnimeDatabase)
            }
        ]
    }
];
