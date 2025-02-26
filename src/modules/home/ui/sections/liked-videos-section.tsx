"use client"

import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { VideoRowCard } from "@/modules/videos/ui/components/video-row-card";
import { VideoGridCard } from "@/modules/videos/ui/components/video-grid-card";
import { DEFAULT_LIMIT } from "../../../../../constants";

export const LikedVideosSection = () => {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ErrorBoundary fallback={<div>Error...</div>}>
				<LikedVideosSectionSuspense />
			</ErrorBoundary>
		</Suspense >
	)
}

const LikedVideosSectionSuspense = () => {
	const [videos, query] = trpc.playlists.getLiked.useSuspenseInfiniteQuery({
		limit: DEFAULT_LIMIT,
	}, {
		getNextPageParam: (lastPage) => lastPage.nextCursor,
	})

	return (
		<div>
			<div className="md:hidden flex flex-col gap-4 gap-y-10">
				{videos.pages
					.flatMap((pages) => pages.items)
					.map((video) => (
						<VideoGridCard key={video.id} data={video} />
					))
				}
			</div>
			<div className="hidden md:flex flex-col gap-4">
				{videos.pages
					.flatMap((pages) => pages.items)
					.map((video) => (
						<VideoRowCard key={video.id} data={video} />
					))
				}
			</div>
		</div>
	)
}
