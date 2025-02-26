import { db } from "@/db";
import { users, videoReactions, videos, videoViews } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, desc, eq, getTableColumns, lt, or } from "drizzle-orm";
import { z } from "zod";

export const playlistRouter = createTRPCRouter({
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
