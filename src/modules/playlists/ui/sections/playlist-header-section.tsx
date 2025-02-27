"use client"

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";

interface PlaylistHeaderSectionProps {
	playlistId: string;
}

export const PlaylistHeaderSection = (params: PlaylistHeaderSectionProps) => {
	return (
		<div>
			<Suspense fallback={<div>Loading...</div>}>
				<ErrorBoundary fallback={<div>Error...</div>}>
					<PlaylistHeaderSectionSuspense {...params} />
				</ErrorBoundary>
			</Suspense>
		</div>
	)
}

const PlaylistHeaderSectionSuspense = ({ playlistId }: PlaylistHeaderSectionProps) => {
	const [playlist] = trpc.playlists.getOne.useSuspenseQuery({ id: playlistId })
	const utils = trpc.useUtils();
	const router = useRouter();

	const remove = trpc.playlists.remove.useMutation({
		onSuccess: () => {
			toast.success("video removed")
			utils.playlists.getOne.invalidate();
			utils.playlists.getMany.invalidate();
			router.push("/playlists")
		},
		onError: (error) => {
			toast.error(error.message)
		}
	})

	return (
		<div className="flex justify-between items-center">
			<div>
				<h1 className="text-2xl font-bold">{playlist.name}</h1>
				<p className="text-xs text-muted-foreground">
					Videos from the playlist
				</p>
			</div>
			<Button
				variant="outline"
				size="icon"
				className="rounded-full"
				onClick={() => remove.mutate({ id: playlistId })}
				disabled={remove.isPending}
			>
				<Trash2Icon />
			</Button>
		</div>
	)
}
