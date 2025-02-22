import { db } from "@/db"
import { videos } from "@/db/schema"
import { mux } from "@/lib/mux"
import {
	VideoAssetCreatedWebhookEvent,
	VideoAssetDeletedWebhookEvent,
	VideoAssetErroredWebhookEvent,
	VideoAssetReadyWebhookEvent,
	VideoAssetTrackReadyWebhookEvent
}
	from "@mux/mux-node/resources/webhooks.mjs"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

const SIGNING_SECRET = process.env.MUX_SIGNING_SECRET!


type WebhookEvent =
	| VideoAssetCreatedWebhookEvent
	| VideoAssetReadyWebhookEvent
	| VideoAssetErroredWebhookEvent
	| VideoAssetTrackReadyWebhookEvent
	| VideoAssetDeletedWebhookEvent


export const POST = async (request: Request) => {
	if (!SIGNING_SECRET) {
		throw new Error("MUX_WEBHOOK_SECRET is not set")
	}

	const headerPayload = await headers();
	const muxSignature = headerPayload.get("mux-signature");

	if (!muxSignature) {
		return new Response("No signature found", { status: 401 });
	}

	const payload = await request.json();
	const body = JSON.stringify(payload)

	mux.webhooks.verifySignature(
		body,
		{
			"mux-signature": muxSignature,
		},
		SIGNING_SECRET,
	);

	switch (payload.type as WebhookEvent["type"]) {
		case "video.asset.created": {
			const data = payload.data as VideoAssetCreatedWebhookEvent["data"]

			if (!data.upload_id) {
				return new Response("No upload ID found", { status: 400 })
			}

			await db
				.update(videos)
				.set({
					muxAssetid: data.id,
					muxStatus: data.status,
				})
				.where(eq(videos.muxUploadId, data.upload_id))
			break;
		}
		case "video.asset.ready": {
			const data = payload.data as VideoAssetReadyWebhookEvent["data"]
			const playbackId = data.playback_ids?.[0].id;

			if (!data.upload_id) {
				return new Response("Missingg upload id", { status: 400 })
			}

			if (!playbackId) {
				return new Response("Missing playback id", { status: 400 })
			}


			try {
				await db
					.update(videos)
					.set({
						muxStatus: data.status,
						muxPlaybackId: playbackId,
						muxAssetid: data.id,
						thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
						previewUrl: `https://image.mux.com/${playbackId}/animated.gif`,
						duration: data.duration ? Math.round(data.duration * 1000) : 0,
					})
					.where(eq(videos.muxUploadId, data.upload_id))
			} catch (error) {
				console.log(error)
				return new Response("Error updating database", { status: 400 })
			}
			break;
		}
		case "video.asset.errored": {
			const data = payload.data as VideoAssetErroredWebhookEvent["data"]

			if (!data.upload_id) {
				return new Response("Missingg upload id", { status: 400 })
			}

			await db
				.update(videos)
				.set({
					muxStatus: data.status,
				})
				.where(eq(videos.muxUploadId, data.upload_id))
			break;
		}
		case "video.asset.deleted": {
			const data = payload.data as VideoAssetDeletedWebhookEvent["data"]

			if (!data.upload_id) {
				return new Response("Missing upload id", { status: 400 })
			}

			await db
				.delete(videos)
				.where(eq(videos.muxUploadId, data.upload_id))

			break;
		}
	}
	return new Response("Webhook recieved", { status: 200 })
}
