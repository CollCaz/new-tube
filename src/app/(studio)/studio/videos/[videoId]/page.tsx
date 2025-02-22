import { VideoView } from "@/modules/studio/ui/view/video-view";
import { HydrateClient, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic"

interface PageProps {
	params: Promise<{ videoId: string }>
}

const Page = async ({ params }: PageProps) => {
	console.warn("Params: ", await params)
	const { videoId } = await params
	console.warn("id: ", videoId)
	void trpc.studio.getOne.prefetch({ id: videoId });
	void trpc.categories.getMany.prefetch();

	return (
		<HydrateClient>
			<VideoView videoId={videoId} />
		</HydrateClient>
	)
}

export default Page;
