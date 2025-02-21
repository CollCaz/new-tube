import { useIntersectionObserver } from "@/hooks/user-intersection-observer";
import { useEffect } from "react";
import { Button } from "./ui/button";

interface InfiniteScrollProps {
	isManual?: boolean;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	fetchNextpage: () => void;
};

export const InfiniteScroll = ({
	isManual = false,
	hasNextPage,
	isFetchingNextPage,
	fetchNextpage,
}: InfiniteScrollProps) => {
	const { targetRef, isIntersecting } = useIntersectionObserver({
		threshold: 0.5,
		rootMargin: "100px",
	});

	useEffect(() => {
		if (isIntersecting && hasNextPage && !isFetchingNextPage && !isManual) {
			fetchNextpage();
		}
	}, [isIntersecting, hasNextPage, isFetchingNextPage, isManual, fetchNextpage])

	return (
		<div className="flex flex-col items-center gap-4 p-4">
			<div ref={targetRef} className="h-1" />
			{hasNextPage ? (
				<Button
					variant="secondary"
					disabled={!hasNextPage || isFetchingNextPage}
					onClick={() => fetchNextpage()}
				>
					{isFetchingNextPage ? "Loading..." : "Load more"}
				</Button>
			) : (
				<p className="text-xs text-muted-foreground">
					You have reached the end of the list
				</p>
			)}
		</div>
	)
}
