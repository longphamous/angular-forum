import { Routes } from "@angular/router";

import { Dashboard } from "./features/pages/dashboard/dashboard";
import { AppLayout } from "./shared/prime-ng/app.layout";

export const routes: Routes = [
    {
        path: "",
        component: AppLayout,
        children: [
            { path: "", component: Dashboard },
            {
                path: "forum",
                loadComponent: () =>
                    import("./features/forums/forum-list/forum-list.component").then((c) => c.ForumListComponent)
            }
        ]
    }
];
