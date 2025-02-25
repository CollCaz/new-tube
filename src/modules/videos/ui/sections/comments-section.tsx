"use client"

import { InfiniteScroll } from "@/components/infinite-scroll";
import { CommentForm } from "@/modules/comments/ui/components/comment-form";
import { CommentItem } from "@/modules/comments/ui/components/comment-item";
import { trpc } from "@/trpc/client"
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { DEFAULT_LIMIT } from "../../../../../constants";

interface CommentsSectionProps {
	videoId: string;
}

export const CommentsSection = (props: CommentsSectionProps) => {
	return (
		<Suspense fallback={<p>Loading...</p>}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<CommentsSectionSuspense {...props} />
			</ErrorBoundary>
		</Suspense>
	)
}

const CommentsSectionSuspense = ({ videoId }: CommentsSectionProps) => {
	const [comments, query] = trpc.comments.getMany.useSuspenseInfiniteQuery({
		videoId,
		limit: DEFAULT_LIMIT,
	}, {
		getNextPageParam: (lastPage) => lastPage.nextCursor,
	});

	return (
		<div className="mt-6">
			<div className="flex flex-col gap-6">
				<h1>
					{comments.pages[0].commentsCount} Comments
				</h1>
				<CommentForm videoId={videoId} />
				<div className="flex flex-col gap-4 mt-2">
					{comments.pages.flatMap((page) => page.items).map((comment) => (
						<CommentItem
							key={comment.id}
							comment={comment}
							variant="comment"
						/>
					))}
					<InfiniteScroll
						isManual
						hasNextPage={query.hasNextPage}
						isFetchingNextPage={query.isFetchingNextPage}
						fetchNextpage={query.fetchNextPage}
					/>
				</div>
			</div>
		</div>
	)
}
