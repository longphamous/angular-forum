import { Injectable, NotFoundException } from "@nestjs/common";

import { Achievement } from "./models/achievement.model";
import { LeaderboardEntry } from "./models/leaderboard.model";
import { UserProgress } from "./models/user-progress.model";

const ACHIEVEMENTS: Achievement[] = [
    {
        id: "first-post",
        name: "First Steps",
        description: "Create your first forum post",
        icon: "📝",
        points: 10
    },
    {
        id: "helpful-member",
        name: "Helpful Member",
        description: "Receive 10 upvotes on your answers",
        icon: "🌟",
        points: 50
    },
    {
        id: "veteran",
        name: "Veteran",
        description: "Be a member for 365 days",
        icon: "🏆",
        points: 100
    },
    {
        id: "anime-expert",
        name: "Anime Expert",
        description: "Write 50 posts in the anime category",
        icon: "🎌",
        points: 200
    }
];

const LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, userId: "u1", username: "NarutoFan99", points: 1250, level: 12 },
    { rank: 2, userId: "u2", username: "AnimeQueen", points: 980, level: 10 },
    { rank: 3, userId: "u3", username: "MangaMaster", points: 750, level: 8 },
    { rank: 4, userId: "u4", username: "OtakuLord", points: 540, level: 6 },
    { rank: 5, userId: "u5", username: "SakuraChan", points: 320, level: 4 }
];

@Injectable()
export class GamificationService {
    getAllAchievements(): Achievement[] {
        return ACHIEVEMENTS;
    }

    getAchievementById(id: string): Achievement {
        const achievement = ACHIEVEMENTS.find((a) => a.id === id);
        if (!achievement) {
            throw new NotFoundException(`Achievement with id "${id}" not found`);
        }
        return achievement;
    }

    getUserProgress(userId: string): UserProgress {
        const entry = LEADERBOARD.find((e) => e.userId === userId);
        if (!entry) {
            throw new NotFoundException(`User with id "${userId}" not found`);
        }
        const pointsToNextLevel = (entry.level + 1) * 100 - entry.points;
        return {
            userId: entry.userId,
            username: entry.username,
            level: entry.level,
            currentPoints: entry.points,
            pointsToNextLevel: Math.max(0, pointsToNextLevel),
            totalAchievements: Math.floor(entry.points / 100)
        };
    }

    getLeaderboard(limit = 10): LeaderboardEntry[] {
        return LEADERBOARD.slice(0, limit);
    }
}
