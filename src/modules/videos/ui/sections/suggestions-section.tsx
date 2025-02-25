"use client"

import { trpc } from "@/trpc/client"
import { VideoRowCard } from "../components/video-row-card";
import { VideoGridCard } from "../components/video-grid-card";
import { InfiniteScroll } from "@/components/infinite-scroll";

interface SuggestionsSectionProps {
	videoId: string;
	isManual?: boolean;
}

export const SuggestionsSection = ({
	videoId,
	isManual = false,
}: SuggestionsSectionProps) => {
	const [suggestions, query] = trpc.suggestions.getMany.useSuspenseInfiniteQuery({
		videoId,
		limit: 5,
	}, {
		getNextPageParam: (lastPage) => lastPage.nextCursor,
	});

	return (
		<>
			<div className="hidden md:block space-y-3">
				{suggestions.pages.flatMap((page) => page.items.map((video) => (
					<VideoRowCard
						size="compact"
						data={video}
						key={video.id}
					/>
				)))}
			</div>
			<div className="block md:hidden space-y-3">
				{suggestions.pages.flatMap((page) => page.items.map((video) => (
					<VideoGridCard
						data={video}
						key={video.id}
					/>
				)))}
			</div>
			<InfiniteScroll
				isManual={isManual}
				hasNextPage={query.hasNextPage}
				isFetchingNextPage={query.isFetchingNextPage}
				fetchNextpage={query.fetchNextPage}
			/>
		</>
	)
}
