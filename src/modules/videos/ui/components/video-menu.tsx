import { DropdownMenu } from "@/components/ui/dropdown-menu"

interface VideoMenuProps {
	videoId: string;
	variant?: "ghost" | "secondary";
	onRemove?: () => void;
}

export const VideoMenu = () => {
	return (
		<div>
			Video menu
		</div>
	)
}
