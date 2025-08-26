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
            }
        ]
    }
];
