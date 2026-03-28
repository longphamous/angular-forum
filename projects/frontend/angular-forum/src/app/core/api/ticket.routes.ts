export const TICKET_ROUTES = {
    list: () => "/tickets",
    stats: () => "/tickets/stats",
    my: () => "/tickets/my",
    detail: (id: string) => `/tickets/${id}`,
    children: (id: string) => `/tickets/${id}/children`,
    links: (id: string) => `/tickets/${id}/links`,
    linkDetail: (ticketId: string, linkId: string) => `/tickets/${ticketId}/links/${linkId}`,
    activity: (id: string) => `/tickets/${id}/activity`,
    comments: (id: string) => `/tickets/${id}/comments`,
    board: (projectId: string) => `/tickets/board/${projectId}`,
    boardMove: () => "/tickets/board/move",
    admin: {
        projects: () => "/tickets/admin/projects",
        projectDetail: (id: string) => `/tickets/admin/projects/${id}`,
        categories: () => "/tickets/admin/categories",
        categoryDetail: (id: string) => `/tickets/admin/categories/${id}`,
        labels: () => "/tickets/admin/labels",
        labelDetail: (id: string) => `/tickets/admin/labels/${id}`,
        workflows: () => "/tickets/admin/workflows",
        workflowDetail: (id: string) => `/tickets/admin/workflows/${id}`,
        seedDefaultWorkflow: () => "/tickets/admin/workflows/seed-default"
    }
} as const;
