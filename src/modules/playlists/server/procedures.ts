import { db } from "@/db";
import { playlists, playlistVideos, users, videoReactions, videos, videoViews } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns, lt, or, sql } from "drizzle-orm";
import { z } from "zod";

export const playlistRouter = createTRPCRouter({
	remove: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ input, ctx }) => {
			const { id } = input;
			const { id: userId } = ctx.user;

			const [existingPlaylist] = await db
				.select()
				.from(playlists)
				.where(and(
					eq(playlists.id, id),
					eq(playlists.userId, userId)
				))

			if (!existingPlaylist) {
				throw new TRPCError({ code: "NOT_FOUND" })
			}

			const [deletedPlaylist] = await db
				.delete(playlists)
				.where(and(
					eq(playlists.id, id),
					eq(playlists.userId, userId)
				))
				.returning()

			if (!deletedPlaylist) {
				throw new TRPCError({ code: "BAD_REQUEST" })
			}

			return deletedPlaylist

		}),
	getOne: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ input, ctx }) => {
			const { id } = input;
			const { id: userId } = ctx.user;

			const [existingPlaylist] = await db
				.select()
				.from(playlists)
				.where(and(
					eq(playlists.id, id),
					eq(playlists.userId, userId)
				))

			if (!existingPlaylist) {
				throw new TRPCError({ code: "NOT_FOUND" })
			}

			return existingPlaylist

		}),
	getVideos: protectedProcedure
		.input(
			z.object({
				playlistId: z.string().uuid(),
				cursor: z.object({
					id: z.string().uuid(),
					updatedAt: z.date(),
				}).nullish(),
				limit: z.number().min(1).max(100),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { id: userId } = ctx.user
			const { cursor, limit, playlistId } = input;

			const [existingPlaylist] = await db
				.select()
				.from(playlists)
				.where(and(
					eq(playlists.id, playlistId),
					eq(playlists.userId, userId)
				))

			if (!existingPlaylist) {
				throw new TRPCError({ code: "NOT_FOUND" })
			}

			const videosFromPlaylist = db.$with("playlist_videos").as(
				db
					.select({
						videoId: playlistVideos.videoId,
					})
					.from(playlistVideos)
					.where(eq(playlistVideos.playlistId, playlistId))
			);

			const data = await db
				.with(videosFromPlaylist)
				.select({
					...getTableColumns(videos),
					user: users,
					viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
					likeCount: db.$count(videoReactions, and(
						eq(videoReactions.videoId, videos.id),
						eq(videoReactions.type, "like"),
					)),
					dislikeCount: db.$count(videoReactions, and(
						eq(videoReactions.videoId, videos.id),
						eq(videoReactions.type, "dislike"),
					))
				})
				.from(videos)
				.innerJoin(videoViews, eq(videoViews.videoId, videos.id))
				.innerJoin(videosFromPlaylist, eq(videosFromPlaylist.videoId, videos.id))
				.innerJoin(users, eq(videos.userId, users.id))
				.where(and(
					eq(videos.visibility, "public"),
					cursor
						? or(
							lt(videos.updatedAt, cursor.updatedAt),
							and(
								eq(videos.updatedAt, cursor.updatedAt),
								lt(videos.id, cursor.id),
							)
						)
						: undefined
				)).orderBy(desc(videos.updatedAt), desc(videos.id))

				.limit(limit + 1)

			const hasMore = data.length > limit;
			const items = hasMore ? data.slice(0, -1) : data;
			const lastitem = items[items.length - 1];
			const nextCursor = hasMore
				? {
					id: lastitem.id,
					updatedAt: lastitem.updatedAt,
				}
				: null;


			return {
				items,
				nextCursor,
			}
		}),
	removeVideo: protectedProcedure
		.input(z.object({
			playlistId: z.string().uuid(),
			videoId: z.string().uuid(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id: userId } = ctx.user;
			const { playlistId, videoId } = input;

			const [existingPlaylist] = await db
				.select()
				.from(playlists)
				.where(and(
					eq(playlists.id, playlistId),
					eq(playlists.userId, userId),
				))

			if (!existingPlaylist) {
				throw new TRPCError({ code: "NOT_FOUND" })
			}

			const [existingVideo] = await db
				.select()
				.from(videos)
				.where(eq(videos.id, videoId))

			if (existingVideo) {
				throw new TRPCError({ code: "NOT_FOUND" })
			}

			const [existingPlaylistVideo] = await db
				.select()
				.from(playlistVideos)
				.where(and(
					eq(playlistVideos.videoId, videoId),
					eq(playlistVideos.playlistId, playlistId)
				))

			if (!existingPlaylistVideo) {
				throw new TRPCError({ code: "NOT_FOUND" })
			}


			const [removedPlaylistVideo] = await db
				.delete(playlistVideos)
				.where(and(
					eq(playlistVideos.playlistId, playlistId),
					eq(playlistVideos.videoId, videoId),
				))
				.returning();

			if (!removedPlaylistVideo) {
				throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
			}

			return removedPlaylistVideo
		}),
	addVideo: protectedProcedure
		.input(z.object({
			playlistId: z.string().uuid(),
			videoId: z.string().uuid(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id: userId } = ctx.user;
			const { playlistId, videoId } = input;

			const [existingPlaylist] = await db
				.select()
				.from(playlists)
				.where(and(
					eq(playlists.id, playlistId),
					eq(playlists.userId, userId),
				))

			if (!existingPlaylist) {
				throw new TRPCError({ code: "NOT_FOUND", message: "existing playlist" })
			}

			const [existingVideo] = await db
				.select()
				.from(videos)
				.where(eq(videos.id, videoId))

			if (!existingVideo) {
				throw new TRPCError({ code: "NOT_FOUND", message: "exisitng video" })
			}

			const [existingPlaylistVideo] = await db
				.select()
				.from(playlistVideos)
				.where(and(
					eq(playlistVideos.videoId, videoId),
					eq(playlistVideos.playlistId, playlistId)
				))

			if (existingPlaylistVideo) {
				throw new TRPCError({ code: "CONFLICT" })
			}


			const [createdPlaylistVideo] = await db
				.insert(playlistVideos)
				.values({
					playlistId,
					videoId,
				})
				.returning();

			if (!createdPlaylistVideo) {
				throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
			}

			return createdPlaylistVideo
		}),
	create: protectedProcedure
		.input(z.object({ name: z.string().nonempty() }))
		.mutation(async ({ ctx, input }) => {
			const { id: userId } = ctx.user;
			const { name } = input;

			const [createdPlaylist] = await db
				.insert(playlists)
				.values({
					userId,
					name,
				})
				.returning();

			if (!createdPlaylist) {
				throw new TRPCError({ code: "NOT_FOUND" })
			}

			return createdPlaylist
		}),
	getManyForVideo: protectedProcedure
		.input(
			z.object({
				videoId: z.string().uuid(),
				cursor: z.object({
					id: z.string().uuid(),
					updatedAt: z.date(),
				}).nullish(),
				limit: z.number().min(1).max(100),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { id: userId } = ctx.user
			const { cursor, videoId, limit } = input;

			console.info("getMany: ", videoId)
			const data = await db
				.select({
					...getTableColumns(playlists),
					videoCount: db.$count(
						playlistVideos,
						eq(playlists.id, playlistVideos.playlistId)
					),
					user: users,
					containsVideo: videoId
						? sql<boolean>`(
							SELECT EXISTS (
								SELECT 1 
								FROM ${playlistVideos} pv
								WHERE pv.playlist_id = ${playlists.id} AND pv.video_id = ${videoId}
								)
							)`
						: sql<boolean>`false`
				})
				.from(playlists)
				.innerJoin(users, eq(playlists.userId, users.id))
				.where(and(
					eq(playlists.userId, userId),
					cursor
						? or(
							lt(playlists.updatedAt, cursor.updatedAt),
							and(
								eq(playlists.updatedAt, cursor.updatedAt),
								lt(playlists.id, cursor.id),
							)
						)
						: undefined
				))
				.orderBy(desc(playlists.updatedAt), desc(playlists.id))
				.limit(limit + 1)
			console.info("getMany 2: ", videoId)


			const hasMore = data.length > limit;
			const items = hasMore ? data.slice(0, -1) : data;
			const lastitem = items[items.length - 1];
			const nextCursor = hasMore
				? {
					id: lastitem.id,
					updatedAt: lastitem.updatedAt,
				}
				: null;


			return {
				items,
				nextCursor,
			}
		}),
	getMany: protectedProcedure
		.input(
			z.object({
				cursor: z.object({
					id: z.string().uuid(),
					updatedAt: z.date(),
				}).nullish(),
				limit: z.number().min(1).max(100),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { id: userId } = ctx.user
			const { cursor, limit } = input;

			const data = await db
				.select({
					...getTableColumns(playlists),
					videoCount: db.$count(
						playlistVideos,
						eq(playlists.id, playlistVideos.playlistId)
					),
					user: users,
					thubmnailUrl: sql<string | null>`(
						SELECT v.thumbnail_url
						FROM ${playlistVideos} pv
						JOIN ${videos} v ON v.id = pv.video_id
						WHERE pv.playlist_id = ${playlists.id}
						ORDER BY pv.updated_at DESC
						LIMIT 1
					)`
				})
				.from(playlists)
				.innerJoin(users, eq(playlists.userId, users.id))
				.where(and(
					eq(playlists.userId, userId),
					cursor
						? or(
							lt(playlists.updatedAt, cursor.updatedAt),
							and(
								eq(playlists.updatedAt, cursor.updatedAt),
								lt(playlists.id, cursor.id),
							)
						)
						: undefined
				))
				.orderBy(desc(playlists.updatedAt), desc(playlists.id))
				.limit(limit + 1)

			const hasMore = data.length > limit;
			const items = hasMore ? data.slice(0, -1) : data;
			const lastitem = items[items.length - 1];
			const nextCursor = hasMore
				? {
					id: lastitem.id,
					updatedAt: lastitem.updatedAt,
				}
				: null;


			return {
				items,
				nextCursor,
			}
		}),
	getLiked: protectedProcedure
		.input(
			z.object({
				cursor: z.object({
					id: z.string().uuid(),
					likedAt: z.date(),
				}).nullish(),
				limit: z.number().min(1).max(100),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { id: userId } = ctx.user
			const { cursor, limit } = input;

			const viewerVideoLikes = db.$with("viewer_video_likes").as(
				db
					.select({
						videoId: videoReactions.videoId,
						likedAt: videoReactions.updatedAt,
					})
					.from(videoReactions)
					.where(
						and(
							eq(videoReactions.userId, userId),
							eq(videoReactions.type, "like")
						)
					)
			);

			const data = await db
				.with(viewerVideoLikes)
				.select({
					...getTableColumns(videos),
					user: users,
					viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
					likedAt: viewerVideoLikes.likedAt,
					likeCount: db.$count(videoReactions, and(
						eq(videoReactions.videoId, videos.id),
						eq(videoReactions.type, "like"),
					)),
					dislikeCount: db.$count(videoReactions, and(
						eq(videoReactions.videoId, videos.id),
						eq(videoReactions.type, "dislike"),
					))
				})
				.from(videos)
				.where(and(
					eq(videos.visibility, "public"),
					cursor
						? or(
							lt(viewerVideoLikes.likedAt, cursor.likedAt),
							and(
								eq(viewerVideoLikes.likedAt, cursor.likedAt),
								lt(videos.id, cursor.id),
							)
						)
						: undefined
				)).orderBy(desc(viewerVideoLikes.likedAt), desc(videos.id))
				.innerJoin(users, eq(videos.userId, users.id))
				.innerJoin(viewerVideoLikes, eq(viewerVideoLikes.videoId, videos.id))

				.limit(limit + 1)

			const hasMore = data.length > limit;
			const items = hasMore ? data.slice(0, -1) : data;
			const lastitem = items[items.length - 1];
			const nextCursor = hasMore
				? {
					id: lastitem.id,
					likedAt: lastitem.likedAt,
				}
				: null;


			return {
				items,
				nextCursor,
			}
		}),
	getHistory: protectedProcedure
		.input(
			z.object({
				cursor: z.object({
					id: z.string().uuid(),
					viewedAt: z.date(),
				}).nullish(),
				limit: z.number().min(1).max(100),
			}),
		)
		.query(async ({ ctx, input }) => {
			const { id: userId } = ctx.user
			const { cursor, limit } = input;

			const viewerVideoViews = db.$with("viewer_video_views").as(
				db
					.select({
						videoId: videoViews.videoId,
						viewedAt: videoViews.updatedAt,
					})
					.from(videoViews)
					.where(eq(videoViews.userId, userId))
			);

			const data = await db
				.with(viewerVideoViews)
				.select({
					...getTableColumns(videos),
					user: users,
					viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
					viewedAt: viewerVideoViews.viewedAt,
					likeCount: db.$count(videoReactions, and(
						eq(videoReactions.videoId, videos.id),
						eq(videoReactions.type, "like"),
					)),
					dislikeCount: db.$count(videoReactions, and(
						eq(videoReactions.videoId, videos.id),
						eq(videoReactions.type, "dislike"),
					))
				})
				.from(videos)
				.where(and(
					eq(videos.visibility, "public"),
					cursor
						? or(
							lt(viewerVideoViews.viewedAt, cursor.viewedAt),
							and(
								eq(viewerVideoViews.viewedAt, cursor.viewedAt),
								lt(videos.id, cursor.id),
							)
						)
						: undefined
				)).orderBy(desc(viewerVideoViews.viewedAt), desc(videos.id))
				.innerJoin(users, eq(videos.userId, users.id))
				.innerJoin(viewerVideoViews, eq(viewerVideoViews.videoId, videos.id))

				.limit(limit + 1)

			const hasMore = data.length > limit;
			const items = hasMore ? data.slice(0, -1) : data;
			const lastitem = items[items.length - 1];
			const nextCursor = hasMore
				? {
					id: lastitem.id,
					viewedAt: lastitem.viewedAt,
				}
				: null;


			return {
				items,
				nextCursor,
			}
		}),
})
