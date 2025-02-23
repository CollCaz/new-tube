import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { useClerk, useUser } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { commentsInsertSchema } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

interface CommentFormProps {
	videoId: string;
	onSuccess?: () => void;
}


export const CommentForm = ({
	videoId,
	onSuccess,
}: CommentFormProps) => {
	const { user } = useUser();

	const clerk = useClerk();
	const utils = trpc.useUtils();
	const create = trpc.comments.create.useMutation({
		onSuccess: () => {
			utils.comments.getMany.invalidate({ videoId })
			form.reset();
			toast.success("Comment added");
			onSuccess?.()
		},
		onError: (error) => {
			if (error.data?.code === "UNAUTHORIZED") {
				clerk.openSignIn();
			} else {
				toast.error("Something went wrong")
			}
		}
	});

	const commentFormSchema = commentsInsertSchema.omit({ userId: true })
	const form = useForm<z.infer<typeof commentFormSchema>>({
		resolver: zodResolver(commentFormSchema),
		defaultValues: {
			videoId,
			value: "",
		}
	})

	const handleSubmit = (values: z.infer<typeof commentFormSchema>) => {
		create.mutate(values)
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className="flex gap-4 group"
			>
				<UserAvatar
					size="lg"
					imageUrl={user?.imageUrl || "/placeholder.svg"}
					name={user?.username || "User"}
				/>
				<div className="flex-1">
					<FormField
						name="value"
						control={form.control}
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Textarea
										{...field}
										placeholder="Add a comment..."
										className="resize-none bg-transparent overflow-hidden min-h-0"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="justify-end gap-2 mt-2 flex">
						<Button
							type="submit"
							size="sm"
						>
							Comment
						</Button>
					</div>
				</div>
			</form>
		</Form>
	)
}
