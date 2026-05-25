import 'dotenv/config'
import { db } from './db'
import { startServer } from './server'

const PORT = Number(process.env.PORT) || 4000

startServer(db, PORT)
