import { db } from "@/db";
import { subscriptions, users, videoReactions, videos, videoUpdateSchema, videoViews } from "@/db/schema";
import { mux } from "@/lib/mux";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns, inArray, isNotNull, lt, or } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

export const videosRouter = createTRPCRouter({
	getManyTrending: baseProcedure
		.input(
			z.object({
				cursor: z.object({
					id: z.string().uuid(),
					viewCount: z.number(),
				}).nullish(),
				limit: z.number().min(1).max(100),
			}),
		)
		.query(async ({ input }) => {
			const { cursor, limit } = input;
			const viewCountQuery = db.$count(
				videoViews,
				eq(videoViews.videoId, videos.id)
			)
			const data = await db
				.select({
					...getTableColumns(videos),
					user: users,
					viewCount: viewCountQuery,
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
							lt(viewCountQuery, cursor.viewCount),
							and(
								eq(viewCountQuery, cursor.viewCount),
								lt(videos.id, cursor.id),
							)
						)
						: undefined
				)).orderBy(desc(viewCountQuery), desc(videos.id))
				.innerJoin(users, eq(videos.userId, users.id))

				.limit(limit + 1)

			const hasMore = data.length > limit;
			const items = hasMore ? data.slice(0, -1) : data;
			const lastitem = items[items.length - 1];
			const nextCursor = hasMore
				? {
					id: lastitem.id,
					viewCount: lastitem.viewCount,
				}
				: null;


			return {
				items,
				nextCursor,
			}
		}),
	getManySubscribed: protectedProcedure
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

			const viewerSubscriptions = db.$with("viewer_subscriptions").as(
				db
					.select({
						userId: subscriptions.creatorId,
					})
					.from(subscriptions)
					.where(eq(subscriptions.viewerId, userId))
			);

			const data = await db
				.with(viewerSubscriptions)
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
				.innerJoin(users, eq(videos.userId, users.id))
				.innerJoin(viewerSubscriptions, eq(viewerSubscriptions.userId, users.id))

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
	getMany: baseProcedure
		.input(
			z.object({
				categoryId: z.string().uuid().nullish(),
				cursor: z.object({
					id: z.string().uuid(),
					updatedAt: z.date(),
				}).nullish(),
				limit: z.number().min(1).max(100),
			}),
		)
		.query(async ({ input }) => {
			const { cursor, limit, categoryId } = input;
			const data = await db
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
				.where(and(
					eq(videos.visibility, "public"),
					categoryId ? eq(videos.categoryId, categoryId) : undefined,
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
				.innerJoin(users, eq(videos.userId, users.id))

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
	getOne: baseProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			if (!input.id) {
				throw new TRPCError({ code: "BAD_REQUEST" })
			}
			const { clerkUserId } = ctx

			let userId: string | null = null

			const [user] = await db
				.select()
				.from(users)
				.where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

			if (user) {
				userId = user.id
			}

			const viewerReactions = db.$with("viewer_reactions").as(
				db
					.select({
						videoId: videoReactions.videoId,
						type: videoReactions.type,
					})
					.from(videoReactions)
					.where(inArray(videoReactions.userId, userId ? [userId] : []))
			)

			const viewerSubscriptions = db.$with("viewer_subscriptions").as(
				db
					.select()
					.from(subscriptions)
					.where(inArray(subscriptions.viewerId, userId ? [userId] : []))
			)

			const [existingVideo] = await db
				.with(viewerReactions, viewerSubscriptions)
				.select({
					...getTableColumns(videos),
					user: {
						...getTableColumns(users),
						subsciberCount: db.$count(subscriptions, eq(subscriptions.creatorId, users.id)),
						viewerSubscribed: isNotNull(viewerSubscriptions.viewerId).mapWith(Boolean)
					},
					viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
					likeCount: db.$count(
						videoReactions,
						and(
							eq(videoReactions.videoId, videos.id),
							eq(videoReactions.type, "like"),
						)
					),
					dislikeCount: db.$count(
						videoReactions,
						and(
							eq(videoReactions.videoId, videos.id),
							eq(videoReactions.type, "dislike"),
						)
					),
					viewerReaction: viewerReactions.type,
				})
				.from(videos)
				.innerJoin(users, eq(videos.userId, users.id))
				.leftJoin(viewerReactions, eq(viewerReactions.videoId, videos.id))
				.leftJoin(viewerSubscriptions, eq(viewerSubscriptions.creatorId, users.id))
				.where(eq(videos.id, input.id))

			if (!existingVideo) {
				throw new TRPCError({ code: "NOT_FOUND" })
			}

			return existingVideo
		}),
	restoreThumbnail: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			if (!input.id) {
				throw new TRPCError({ code: "BAD_REQUEST" })
			}
			const { id: userId } = ctx.user

			const [existingVideo] = await db
				.select()
				.from(videos)
				.where(and(
					eq(videos.id, input.id),
					eq(videos.userId, userId)
				))

			if (!existingVideo) {
				throw new TRPCError({ code: "NOT_FOUND" })
			}

			if (existingVideo.thumbnailKey) {

				const utapi = new UTApi();

				await utapi.deleteFiles(existingVideo.thumbnailKey);
				await db
					.update(videos)
					.set({ thumbnailKey: null, thumbnailUrl: null })
					.where(and(
						eq(videos.id, existingVideo.id),
						eq(videos.userId, userId),
					))
			}
			const thumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`

			const [updatedVideo] = await db
				.update(videos)
				.set({
					thumbnailUrl: thumbnailUrl
				})
				.where(and(
					eq(videos.id, input.id),
					eq(videos.userId, userId),
				))
				.returning()

			return updatedVideo
		}),
	remove: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			if (!input.id) {
				throw new TRPCError({ code: "BAD_REQUEST", cause: "Missing video id" })
			}
			const { id: userId } = ctx.user

			const [removedVideo] = await db
				.delete(videos)
				.where(
					and(
						eq(videos.id, input.id),
						eq(videos.userId, userId),
					))
				.returning()

			if (!removedVideo) {
				throw new TRPCError({ code: "NOT_FOUND", cause: "Video not found" })
			}

			return removedVideo
		}),
	update: protectedProcedure
		.input(videoUpdateSchema)
		.mutation(async ({ ctx, input }) => {
			if (!input.id) {
				throw new TRPCError({ code: "BAD_REQUEST", cause: "Missing video id" })
			}
			const { id: userId } = ctx.user

			const [updatedVideo] = await db
				.update(videos)
				.set({
					title: input.title,
					description: input.description,
					categoryId: input.categoryId,
					visibility: input.visibility,
				})
				.where(and(
					eq(videos.id, input.id),
					eq(videos.userId, userId),
				))
				.returning()

			if (!updatedVideo) {
				throw new TRPCError({ code: "NOT_FOUND" })
			}

			return updatedVideo
		}),
	create: protectedProcedure.mutation(async ({ ctx }) => {
		const { id: userId } = ctx.user;

		const upload = await mux.video.uploads.create({
			new_asset_settings: {
				passthrough: userId,
				playback_policy: ["public"],
				mp4_support: "none",
			},
			cors_origin: "*",
		})

		const [video] = await db
			.insert(videos)
			.values({
				userId,
				title: `Untitled-${new Date().getTime()}`,
				muxStatus: "waiting",
				muxUploadId: upload.id,
			})
			.returning()

		return {
			video: video,
			url: upload.url,
		}
	})
})
