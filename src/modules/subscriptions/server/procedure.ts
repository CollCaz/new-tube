import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const subscriptionsRouter = createTRPCRouter({
	create: protectedProcedure
		.input(z.object({ userId: z.string().uuid() }))
		.mutation(async ({ input, ctx }) => {
			const { userId } = input;

			if (userId === ctx.user.id) {
				throw new TRPCError({ code: "BAD_REQUEST" })
			}

			const [subscription] = await db
				.insert(subscriptions)
				.values({ viewerId: ctx.user.id, creatorId: userId })
				.returning()

			return subscription
		}),
	remove: protectedProcedure
		.input(z.object({ userId: z.string().uuid() }))
		.mutation(async ({ input, ctx }) => {
			const { id } = ctx.user
			const { userId: creatorId } = input;

			if (creatorId === ctx.user.id) {
				throw new TRPCError({ code: "BAD_REQUEST" })
			}

			const [subscription] = await db
				.delete(subscriptions)
				.where(and(
					eq(subscriptions.viewerId, id),
					eq(subscriptions.creatorId, creatorId),
				))
				.returning()

			return subscription
		}),
})
