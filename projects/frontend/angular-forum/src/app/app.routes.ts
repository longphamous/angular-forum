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
                path: "thread-list",
                loadComponent: () =>
                    import("./features/forums/thread/thread-list/thread-list").then((c) => c.ThreadList)
            },
            {
                path: "thread-create",
                loadComponent: () =>
                    import("./features/forums/thread/thread-create/thread-create").then((c) => c.ThreadCreate)
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
