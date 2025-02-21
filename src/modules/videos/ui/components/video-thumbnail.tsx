import Image from "next/image"

export const VideoThumbnail = () => {
	return (
		<div className="relative">
			{ /* thumbnail wrapper */}
			<div className="relative w-full rounded-xl aspect-video">
				<Image src="/placeholder.svg" alt="Thumbnail" fill className="size-full" />
			</div>

			<div>
			</div>
		</div>
	)
}
