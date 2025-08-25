import { Routes } from "@angular/router";

import { DashboardComponent } from "./features/dashboard/dashboard.component";
import { ForumListComponent } from "./features/forums/forum-list/forum-list.component";
import { ThreadViewComponent } from "./features/forums/thread-view/thread-view.component";

export const routes: Routes = [
    {
        path: "",
        loadComponent: () =>
            import("./features/forums/forum-list/forum-list.component").then((c) => c.ForumListComponent)
    },
    { path: "forum/:id", component: ForumListComponent },
    { path: "thread/:id", component: ThreadViewComponent },
    { path: "dashboard", component: DashboardComponent }
];
