import { startServer } from "./server";
import { importCSV } from "./db/seed";
import { Effect } from "effect";
import { db } from "./db";

// Import CSV if needed (run once)
const shouldImport = process.argv.includes("--import");

const PORT = Number(process.env.PORT) || 4000;

if (shouldImport) {
	const csvFile =
		process.argv[process.argv.indexOf("--import") + 1] || "medicines.csv";
	console.log(`Importing from ${csvFile}...`);

	Effect.runPromise(importCSV(db, csvFile))
		.then((result) => {
			console.log("Import completed:", result);
			startServer(db, PORT);
		})
		.catch((error) => {
			console.error("Import failed:", error);
			process.exit(1);
		});
} else {
	startServer(db, PORT);
}
