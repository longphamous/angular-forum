import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("user_bounties")
export class UserBountyEntity {
    @PrimaryColumn({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ type: "bigint", default: 0 })
    bounty!: number;

    @Column({ type: "int", nullable: true })
    rank?: number;

    // Factor breakdown
    @Column({ name: "coin_value", type: "bigint", default: 0 })
    coinValue!: number;

    @Column({ name: "xp_value", type: "bigint", default: 0 })
    xpValue!: number;

    @Column({ name: "post_value", type: "bigint", default: 0 })
    postValue!: number;

    @Column({ name: "thread_value", type: "bigint", default: 0 })
    threadValue!: number;

    @Column({ name: "reaction_value", type: "bigint", default: 0 })
    reactionValue!: number;

    @Column({ name: "achievement_value", type: "bigint", default: 0 })
    achievementValue!: number;

    @Column({ name: "lexicon_value", type: "bigint", default: 0 })
    lexiconValue!: number;

    @Column({ name: "blog_value", type: "bigint", default: 0 })
    blogValue!: number;

    @Column({ name: "gallery_value", type: "bigint", default: 0 })
    galleryValue!: number;

    @Column({ name: "clan_value", type: "bigint", default: 0 })
    clanValue!: number;

    @Column({ name: "ticket_value", type: "bigint", default: 0 })
    ticketValue!: number;

    @Column({ type: "varchar", length: 200, nullable: true })
    epithet?: string;

    @Column({ name: "calculated_at", type: "timestamptz" })
    calculatedAt!: Date;
}
