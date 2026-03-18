export interface LevelInfo {
    level: number;
    name: string;
    minXp: number;
}

export const LEVEL_CONFIG: LevelInfo[] = [
    { level: 1, name: "Neuling", minXp: 0 },
    { level: 2, name: "Einsteiger", minXp: 100 },
    { level: 3, name: "Mitglied", minXp: 300 },
    { level: 4, name: "Aktives Mitglied", minXp: 600 },
    { level: 5, name: "Erfahrener Nutzer", minXp: 1000 },
    { level: 6, name: "Veteran", minXp: 1500 },
    { level: 7, name: "Experte", minXp: 2200 },
    { level: 8, name: "Meister", minXp: 3000 },
    { level: 9, name: "Elite", minXp: 4000 },
    { level: 10, name: "Legende", minXp: 5500 }
];

export const XP_AMOUNTS: Record<string, number> = {
    create_thread: 10,
    create_post: 5,
    receive_reaction: 3,
    give_reaction: 1
};

export function getLevelForXp(xp: number): LevelInfo {
    let current = LEVEL_CONFIG[0];
    for (const lvl of LEVEL_CONFIG) {
        if (xp >= lvl.minXp) current = lvl;
        else break;
    }
    return current;
}

export function getXpToNextLevel(xp: number): number {
    const current = getLevelForXp(xp);
    const next = LEVEL_CONFIG.find((l) => l.level === current.level + 1);
    return next ? next.minXp - xp : 0;
}

export function getXpProgressPercent(xp: number): number {
    const current = getLevelForXp(xp);
    const next = LEVEL_CONFIG.find((l) => l.level === current.level + 1);
    if (!next) return 100;
    const range = next.minXp - current.minXp;
    const progress = xp - current.minXp;
    return Math.min(100, Math.round((progress / range) * 100));
}

export interface UserXpData {
    xp: number;
    level: number;
    levelName: string;
    xpToNextLevel: number;
    xpProgressPercent: number;
}
