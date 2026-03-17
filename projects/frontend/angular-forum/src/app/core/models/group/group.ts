export interface Group {
    id: string;
    name: string;
    description?: string;
    isSystem: boolean;
    userCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface PagePermission {
    id: string;
    route: string;
    name: string;
    category?: string;
    groups: GroupRef[];
    createdAt: string;
    updatedAt: string;
}

export interface GroupRef {
    id: string;
    name: string;
}
