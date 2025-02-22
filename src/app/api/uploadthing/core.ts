import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server"
import { z } from "zod";
import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const f = createUploadthing();

export const ourFileRouter = {
	thumbnailUploader: f({
		image: {
			maxFileSize: "4MB",
			maxFileCount: 1,
		},
	})
		.input(z.object({
			videoId: z.string().uuid(),
		}))
		.middleware(async ({ input }) => {
			// This code runs on your server before upload
			const { userId } = await auth();

			// If you throw, the user will not be able to upload
			if (!userId) throw new UploadThingError("Unauthorized");
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.clerkId, userId))

			if (!user) throw new UploadThingError("Unauthorized")

			const [existingVideo] = await db
				.select({
					thumbnailKey: videos.thumbnailKey,
				})
				.from(videos)
				.where(and(
					eq(videos.id, input.videoId),
					eq(videos.userId, user.id),
				))

			if (!existingVideo) {
				console.error("not found")
				throw new UploadThingError("NotFound")
			}

			if (existingVideo.thumbnailKey) {

				const utapi = new UTApi();

				await utapi.deleteFiles(existingVideo.thumbnailKey);
				await db
					.update(videos)
					.set({ thumbnailKey: null, thumbnailUrl: null })
					.where(and(
						eq(videos.id, input.videoId),
						eq(videos.userId, user.id),
					))
			}

			// Whatever is returned here is accessible in onUploadComplete as `metadata`
			return { user, ...input };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			await db
				.update(videos)
				.set({
					thumbnailUrl: file.url,
					thumbnailKey: file.key,
				})
				.where(and(
					eq(videos.id, metadata.videoId),
					eq(videos.userId, metadata.user.id),
				))

			return { uploadedBy: metadata.user.id };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

