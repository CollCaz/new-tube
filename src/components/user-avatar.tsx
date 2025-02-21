import { cva, VariantProps } from "class-variance-authority"
import { Avatar } from "./ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";


const avatarVariants = cva("", {
	variants: {
		size: {
			xs: "h-4 w-4",
			sm: "h-6 w-6",
			md: "h-9 w-9",
			lg: "h10 w-10",
			xl: "h-[160px} w-[160px]]"
		}
	},
	defaultVariants: {
		size: "md"
	}
})

interface UserAvatarProps extends VariantProps<typeof avatarVariants> {
	imageUrl: string;
	name: string;
	className?: string;
	onClick?: () => void;
}

export const UserAvatar = ({
	imageUrl,
	name,
	size,
	className,
	onClick,
}: UserAvatarProps) => {
	return (
		<Avatar className={cn(avatarVariants({ size, className }))} onClick={onClick}>
			<AvatarImage src={imageUrl} alt={name} />
		</Avatar >
	)
}
