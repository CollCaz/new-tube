import { StudioView } from "@/modules/studio/ui/view/studio-view";
import { HydrateClient, trpc } from "@/trpc/server";

const Page = () => {
	void trpc.studio.getMany.prefetchInfinite({
		limit: 5,
	})
	return (
		<HydrateClient>
			<StudioView />
		</HydrateClient>
	)
}

export default Page;
