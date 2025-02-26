import { ResponsiveModal } from "@/components/responsive-modal";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface PlaylistCreateModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
	name: z.string().nonempty()
})

export const PlaylistCreateModal = ({
	open,
	onOpenChange,
}: PlaylistCreateModalProps) => {
	const utils = trpc.useUtils();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: ""
		}
	})

	const create = trpc.playlists.create.useMutation({
		onSuccess: () => {
			utils.playlists.getMany.invalidate()
			toast.success("Playlist created!")
			form.reset();
			onOpenChange(false)
		}
	})

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		create.mutate(values)
	};

	return (
		<ResponsiveModal
			title="Create a playlists"
			open={open}
			onOpenChange={onOpenChange}
		>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-4"
				>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="My playlist"
									/>
								</FormControl>
							</FormItem>
						)}
					/>
					<div className="flex justify-end">
						<Button
							disabled={create.isPending}
							type="submit"
						>
							Create
							<PlusIcon />
						</Button>
					</div>
				</form>
			</Form>
		</ResponsiveModal>
	)
}
