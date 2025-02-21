'use client';

import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button"
import { trpc } from "@/trpc/client"
import { Loader2Icon, LoaderIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner";
import { StudioUploader } from "./studio-uploader";

export const StudioUploadModal = () => {
	const utils = trpc.useUtils();
	const create = trpc.videos.create.useMutation({
		onSuccess: () => {
			toast.success("Video created")
			utils.studio.getMany.invalidate();
		},
		onError: (err) => {
			toast.error(err.message)
		}
	});

	return (
		<>
			<ResponsiveModal
				title="Upload a video"
				open={!!create.data}
				onOpenChange={() => create.reset()}
			>
				{
					create.data?.url
						? <StudioUploader endpoint={create.data?.url} onSuccess={() => { }} />
						: <Loader2Icon />
				}
			</ResponsiveModal>
			<Button variant="secondary" onClick={() => create.mutate()} disabled={create.isPending}>
				{create.isPending ? <LoaderIcon className="animate-spin" /> : <PlusIcon />}
				Create
			</Button>
		</>
	)
}
