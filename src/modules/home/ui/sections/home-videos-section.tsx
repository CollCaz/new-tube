"use client"

import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { DEFAULT_LIMIT } from "../../../../../constants";
import { VideoGridCard } from "@/modules/videos/ui/components/video-grid-card";

interface HomeVideosSectionProps {
	categoryId?: string;
}

export const HomeVideosSection = (props: HomeVideosSectionProps) => {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ErrorBoundary fallback={<div>Error...</div>}>
				<HomeVideosSectionSuspense {...props} />
			</ErrorBoundary>
		</Suspense >
	)
}

const HomeVideosSectionSuspense = ({ categoryId }: HomeVideosSectionProps) => {
	const [videos, query] = trpc.videos.getMany.useSuspenseInfiniteQuery({
		categoryId,
		limit: DEFAULT_LIMIT,
	}, {
		getNextPageParam: (lastPage) => lastPage.nextCursor,
	})

	return (
		<div>
			<div className="gap-4 gap-y-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px)]:grid-cols-6">
				{videos.pages
					.flatMap((pages) => pages.items)
					.map((video) => (
						<VideoGridCard key={video.id} data={video} />
					))
				}
			</div>
		</div>
	)
}
