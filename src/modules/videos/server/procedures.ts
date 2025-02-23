import { db } from "@/db";
import { users, videoReactions, videos, videoUpdateSchema, videoViews } from "@/db/schema";
import { mux } from "@/lib/mux";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq, getTableColumns, inArray } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

export const videosRouter = createTRPCRouter({
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

			const [existingVideo] = await db
				.with(viewerReactions)
				.select({
					...getTableColumns(videos),
					user: {
						...getTableColumns(users),
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
