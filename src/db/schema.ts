import { text, pgTable, timestamp, uuid, uniqueIndex, integer, pgEnum, primaryKey, foreignKey } from "drizzle-orm/pg-core";

import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema
} from "drizzle-zod"

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	clerkId: text("clerk_id").unique().notNull(),
	name: text("name").notNull(),
	//TODO: add banner fields
	imageUrl: text("image_url").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("clerk_id_idx").on(t.clerkId)]);

export const subscriptions = pgTable("subscriptions", {
	viewerId: uuid("viewer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
	creatorId: uuid("creater_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
	primaryKey({
		name: "subscriptions_pk",
		columns: [t.viewerId, t.creatorId]
	})
]);

export const categories = pgTable("categories", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull().unique(),
	description: text("description"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("name_idx").on(t.name)])

export const videoVisibility = pgEnum("video_visibility", [
	"private",
	"public",
])


export const videos = pgTable("videos", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull().unique(),
	description: text("description"),
	muxStatus: text("mux_status"),
	muxAssetid: text("mux_asset_id").unique(),
	muxUploadId: text("mux_upload_id").unique(),
	muxPlaybackId: text("mux_playback_id").unique(),
	muxTrackId: text("mux_track_id").unique(),
	muxTrackStatus: text("mux_track_status"),
	thumbnailUrl: text("thumbnail_url"),
	thumbnailKey: text("thumbnail_key"),
	previewUrl: text("preview_url"),
	previewKey: text("preview_key"),
	duration: integer("duration").notNull().default(0),
	visibility: videoVisibility("visibility").notNull().default("private"),
	userId: uuid("user_id").references(() => users.id, {
		onDelete: "cascade",
	}).notNull(),
	categoryId: uuid("category_id").references(() => categories.id, {
		onDelete: "set null"
	}),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const videoInsertSchema = createInsertSchema(videos)
export const videoUpdateSchema = createUpdateSchema(videos)
export const videoSelectSchema = createSelectSchema(videos)

export const comments = pgTable("comments", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
	videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
	parentId: uuid("parent_id"),
	value: text("value").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
	foreignKey({
		name: "comments_parent_fk",
		columns: [t.parentId],
		foreignColumns: [t.id],
	}).onDelete("cascade")
])

export const commentsInsertSchema = createInsertSchema(comments)
export const commentsUpdateSchema = createUpdateSchema(comments)
export const commentsSelectSchema = createSelectSchema(comments)

export const reactionType = pgEnum("reaction_type", ["like", "dislike"])

export const playlists = pgTable("playlists", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	description: text("description"),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const playlistVideos = pgTable("playlist_videos", {
	playlistId: uuid("playlist_id").references(() => playlists.id, { onDelete: "cascade" }).notNull(),
	videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
	primaryKey({
		name: "playlist_videos_pk",
		columns: [t.playlistId, t.videoId]
	})
])

export const commentReactions = pgTable("comment_reactions", {
	commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }).notNull(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
	type: reactionType("type").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
	primaryKey({
		name: "comment_reactions_pk",
		columns: [t.commentId, t.userId]
	})
])

export const videoViews = pgTable("video_views", {
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
	videoId: uuid("video_id").references(() => videos.id, {
		onDelete: "cascade",
	}).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
	primaryKey({
		name: "video_views_pk",
		columns: [t.userId, t.videoId],
	}),
])


export const videoReactions = pgTable("video_reactions", {
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
	videoId: uuid("video_id").references(() => videos.id, {
		onDelete: "cascade",
	}).notNull(),
	type: reactionType("type").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
	primaryKey({
		name: "video_reactions_pk",
		columns: [t.userId, t.videoId],
	}),
])

export const videoReactionsInsertSchema = createInsertSchema(videoReactions)
export const videoReactionsUpdateSchema = createUpdateSchema(videoReactions)
export const videoReactionsSelectSchema = createSelectSchema(videoReactions)
