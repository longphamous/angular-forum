import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export type NotificationType =
    | "new_message"
    | "thread_reply"
    | "post_like"
    | "achievement_unlocked"
    | "level_up"
    | "coins_received"
    | "xp_gained"
    | "mention"
    | "friend_request"
    | "friend_accepted"
    | "system"
    // Moderation
    | "thread_moved"
    | "thread_locked"
    | "thread_title_changed"
    | "post_edited_by_mod"
    | "post_deleted_by_mod"
    | "best_answer_selected"
    // Forum
    | "thread_pinned"
    | "post_quoted"
    // Content modules
    | "blog_comment"
    | "lexicon_comment"
    | "gallery_comment"
    | "gallery_rated"
    | "recipe_comment"
    | "recipe_rated"
    | "clip_liked"
    | "clip_commented"
    // Lotto
    | "lotto_draw_result"
    | "lotto_win"
    // Marketplace
    | "marketplace_offer"
    | "marketplace_offer_accepted"
    | "marketplace_offer_declined"
    // TCG
    | "tcg_trade_offer"
    | "tcg_rare_pull";

@Entity("notifications")
export class NotificationEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ type: "varchar", length: 50 })
    type!: NotificationType;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "varchar", length: 500 })
    body!: string;

    @Column({ type: "varchar", length: 500, nullable: true })
    link!: string | null;

    @Column({ name: "is_read", type: "boolean", default: false })
    isRead!: boolean;

    @Column({ type: "jsonb", nullable: true })
    metadata!: Record<string, unknown> | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
