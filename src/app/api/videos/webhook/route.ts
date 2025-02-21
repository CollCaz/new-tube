import { db } from "@/db"
import { videos } from "@/db/schema"
import { mux } from "@/lib/mux"
import { VideoAssetCreatedWebhookEvent, VideoAssetErroredWebhookEvent, VideoAssetReadyWebhookEvent, VideoAssetTrackReadyWebhookEvent } from "@mux/mux-node/resources/webhooks.mjs"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

const SIGNING_SECRET = process.env.MUX_SIGNING_SECRET!


type WebhookEvent =
	| VideoAssetCreatedWebhookEvent
	| VideoAssetReadyWebhookEvent
	| VideoAssetErroredWebhookEvent
	| VideoAssetTrackReadyWebhookEvent


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
				.where(eq(videos.muxUploaderId, data.upload_id))
			break;
		}
	}
	return new Response("Webhook recieved", { status: 200 })
}
