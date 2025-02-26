import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"
import { VideoGetOneOutput } from "../../types";
import { useClerk } from "@clerk/nextjs";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

interface VideoReactionProps {
	videoId: string;
	likes: number;
	dislikes: number;
	viewerReaction: VideoGetOneOutput["viewerReaction"]
}

export const VideoReactions = ({
	videoId,
	likes,
	dislikes,
	viewerReaction,
}: VideoReactionProps) => {
	const clerk = useClerk();
	const utils = trpc.useUtils();

	const like = trpc.videoReactions.like.useMutation({
		onSuccess: () => {
			utils.videos.getOne.invalidate();
			utils.playlists.getLiked.invalidate();
		},
		onError: (error) => {
			if (error.data?.code === "UNAUTHORIZED") {
				clerk.openSignIn();
				toast.error("please sign in")
			} else {
				toast.error("something went wrong")
			}
		}
	});
	const dislike = trpc.videoReactions.disLike.useMutation({
		onSuccess: () => {
			utils.videos.getOne.invalidate();
			utils.playlists.getLiked.invalidate();
		},
		onError: (error) => {
			if (error.data?.code === "UNAUTHORIZED") {
				clerk.openSignIn();
				toast.error("please sign in")
			} else {
				toast.error("something went wrong")
			}
		}

	});


	return (
		<div className="flex items-center flex-none">
			<Button
				onClick={() => like.mutate({ videoId })}
				disabled={like.isPending || dislike.isPending}
				variant="secondary"
				className="rounded-l-full rounded-r-none gap-2 pr-4"
			>
				<ThumbsUpIcon
					className={cn("size-5", viewerReaction === "like" && "fill-black")}
				/>
				{likes}
			</Button>
			<Separator orientation="vertical" className="h-7" />
			<Button
				onClick={() => dislike.mutate({ videoId })}
				variant="secondary"
				disabled={like.isPending || dislike.isPending}
				className="rounded-l-none rounded-r-full gap-2 pl-4"
			>
				<ThumbsDownIcon className={cn("size-5", viewerReaction === "dislike" && "fill-black")} />
				{dislikes}
			</Button>
		</div>
	)
}
