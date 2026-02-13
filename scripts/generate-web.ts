#!/usr/bin/env node
import 'dotenv/config'
import { ReviewServer } from '../web/server.js'

const PORT = Number(process.env.WEB_PORT) || 3000
const AUTO_OPEN = process.env.WEB_AUTO_OPEN !== 'false'

const server = new ReviewServer({
  port: PORT,
  autoOpen: AUTO_OPEN,
  host: 'localhost',
})

server.start()
