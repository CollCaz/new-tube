"use client";

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { HistoryIcon, ListVideo, PlaySquareIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
	{
		title: "History",
		url: "/playlists/history",
		icon: HistoryIcon,
		auth: true,
	},
	{
		title: "Liked Videos",
		url: "/playlists/liked",
		icon: PlaySquareIcon,
		auth: true,
	},
	{
		title: "All Playlists",
		url: "/playlists",
		icon: ListVideo,
		auth: true,
	},
]

export const PersonalSection = () => {
	const pathname = usePathname();
	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								tooltip={item.title}
								asChild
								isActive={pathname === item.url}
								onClick={() => { }}
							>
								<Link href={item.url} className="flex items-center gap-4">
									<item.icon />
									<span className="text-sm">{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
