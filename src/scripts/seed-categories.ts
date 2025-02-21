import { db } from "@/db";
import { categories } from "@/db/schema";

const categoryNames = [
	"Comedy",
	"Gaming",
	"Music",
	"Anime",
	"Film",
	"Cars",
	"Travel and events",
	"News and politics",
	"Sports",
	"People and blogs",
	"Education",
	"Entertainment",
	"Science and technology",
];

async function main() {
	console.log("Seeding...")
	try {
		const values = categoryNames.map((name) => ({
			name,
			description: `Videos related ${name.toLowerCase()}`
		}))

		await db.insert(categories).values(values)

		console.log("done!")
	} catch (error) {
		console.error(error)
		process.exit(1)
	}
}

main()
