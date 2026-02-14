import { startServer } from "./server";
import { db } from "./db";

const PORT = Number(process.env.PORT) || 4000;

startServer(db, PORT);
