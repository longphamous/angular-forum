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
