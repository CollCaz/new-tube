import { db } from "@/db";
import { commentReactions, comments, users } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, getTableColumns, inArray, lt, or } from "drizzle-orm";
import { z } from "zod";

export const commentsRouter = createTRPCRouter({
	like: protectedProcedure
		.input(z.object({ commentId: z.string().uuid() }))
		.mutation(async ({ input, ctx }) => {
			const { commentId } = input;
			const { id: userId } = ctx.user;

			const [existingCommentReactionLike] = await db
				.select()
				.from(commentReactions)
				.where(
					and(
						eq(commentReactions.commentId, commentId),
						eq(commentReactions.userId, userId),
						eq(commentReactions.type, "like"),
					)
				);

			if (existingCommentReactionLike) {
				const [deletedViewerReaction] = await db
					.delete(commentReactions)
					.where(
						and(
							eq(commentReactions.commentId, commentId),
							eq(commentReactions.userId, userId),
						)
					)
					.returning()

				return deletedViewerReaction
			}

			const [createdCommentReaction] = await db
				.insert(commentReactions)
				.values({ userId, commentId, type: "like" })
				.onConflictDoUpdate({
					target: [commentReactions.userId, commentReactions.commentId],
					set: {
						type: "like"
					}
				})
				.returning()

			return createdCommentReaction
		}),
	dislike: protectedProcedure
		.input(z.object({ commentId: z.string().uuid() }))
		.mutation(async ({ input, ctx }) => {
			const { commentId } = input;
			const { id: userId } = ctx.user;

			const [existingCommentReactionDislike] = await db
				.select()
				.from(commentReactions)
				.where(
					and(
						eq(commentReactions.commentId, commentId),
						eq(commentReactions.userId, userId),
						eq(commentReactions.type, "dislike"),
					)
				);

			if (existingCommentReactionDislike) {
				const [deletedViewerReaction] = await db
					.delete(commentReactions)
					.where(
						and(
							eq(commentReactions.commentId, commentId),
							eq(commentReactions.userId, userId),
						)
					)
					.returning()

				return deletedViewerReaction
			}

			const [createdCommentReaction] = await db
				.insert(commentReactions)
				.values({ userId, commentId, type: "like" })
				.onConflictDoUpdate({
					target: [commentReactions.userId, commentReactions.commentId],
					set: {
						type: "dislike"
					}
				})
				.returning()

			return createdCommentReaction
		}),
	remove: protectedProcedure
		.input(z.object({
			id: z.string().uuid().nonempty(),
		}))
		.mutation(async ({ input, ctx }) => {
			const { id } = input;
			const { id: userId } = ctx.user;

			const [deletedComment] = await db
				.delete(comments)
				.where(and(
					eq(comments.userId, userId),
					eq(comments.id, id),
				))
				.returning()
			if (!deletedComment) {
				throw new TRPCError({ code: "NOT_FOUND" })
			}

			return deletedComment
		}),

	create: protectedProcedure
		.input(z.object({
			videoId: z.string().uuid().nonempty(),
			value: z.string().nonempty(),
		}))
		.mutation(async ({ input, ctx }) => {
			const { videoId, value } = input;
			const { id: userId } = ctx.user;

			const [createdComment] = await db
				.insert(comments)
				.values({ userId, videoId, value })
				.returning()

			return createdComment
		}),

	getMany: baseProcedure
		.input(
			z.object({
				videoId: z.string().uuid().nonempty(),
				cursor: z.object({
					id: z.string().uuid().nonempty(),
					updatedAt: z.date(),
				}).nullish(),
				limit: z.number().min(1).max(100),
			})
		)
		.query(async ({ ctx, input }) => {
			const { videoId, cursor, limit } = input;
			const { clerkUserId } = ctx;

			let userId;
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
						commentId: commentReactions.commentId,
						type: commentReactions.type,
					})
					.from(commentReactions)
					.where(inArray(commentReactions.userId, userId ? [userId] : []))
			)

			const [totalData, data] = await Promise.all([
				db
					.select({
						count: count(),
					})
					.from(comments)
					.where(eq(comments.videoId, videoId)),
				db
					.with(viewerReactions)
					.select({
						...getTableColumns(comments),
						user: users,
						viewerReaction: viewerReactions.type,
						likeCount: db.$count(
							commentReactions,
							and(
								eq(commentReactions.type, "like"),
								eq(commentReactions.commentId, comments.id)
							)
						),
						disLike: db.$count(
							commentReactions,
							and(
								eq(commentReactions.type, "dislike"),
								eq(commentReactions.commentId, comments.id)
							)
						)
					})
					.from(comments)
					.where(and(
						eq(comments.videoId, videoId),
						cursor
							? or(
								lt(comments.updatedAt, cursor.updatedAt),
								and(
									eq(comments.updatedAt, cursor.updatedAt),
									lt(comments.id, cursor.id),
								)
							) : undefined,
					))
					.innerJoin(users, eq(comments.userId, users.id))
					.leftJoin(viewerReactions, eq(comments.id, viewerReactions.commentId))
					.orderBy(desc(comments.updatedAt))
					.limit(limit + 1)
			])

			const hasMore = data.length > limit;
			const items = hasMore ? data.slice(0, -1) : data;
			const lastItem = items[items.length - 1];
			const nextCursor = hasMore
				? {
					id: lastItem.id,
					updatedAt: lastItem.updatedAt,
				}
				: null

			return {
				items,
				nextCursor,
				commentsCount: totalData[0].count,
			}
		})
})
