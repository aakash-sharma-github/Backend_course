import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express()

// cors only allows specific domains to interact with our backend
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// accept json files upto 20kb.
app.use(express.json({ limit: '20kb' }))

// search input url encoder and modify urls limit upto 20kb.
app.use(express.urlencoded({ extended: true, limit: "20kb" }))

// store uploaded files to public folder within your server.
app.use(express.static("public"))

// to perform CRUD operation on user's browser cookie.
app.use(cookieParser())

export { app }