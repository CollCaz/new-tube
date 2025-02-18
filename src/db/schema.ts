import { text, pgTable, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	clerkId: text("clerk_id").unique().notNull(),
	name: text("name").notNull(),
	//TODO: add banner fields
	imageUrl: text("image_url").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("clerk_id_idx").on(t.clerkId)]);
