// require('dotenv').config({path: './env'}) // Inconsistent code

import { app } from "./app.js";
import connectDB from "./db/database.js";


// instead of doing below steps, just add this command in your node run command "--env-file=.env"

// import dotenv from "dotenv";
// -r dotenv/config --experimental-json-modules

// dotenv.config({
//     path: './env'
// })

const appPort = process.env.PORT || 3000

connectDB().then(() => {
    app.on("Database error", (error) => {
        console.log(`Express error: ${error}`)
    })
    app.listen(appPort, () => {
        console.log(`Server is running on port: ${appPort}`)
    })
}).catch((error) => {
    console.error(`Server connection failed: ${error}`)
})



// This is IIFE (Immediately Invoked Function Expression) approach. We have done database connection and express listening on same code.
/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from "express";
const app = express()

;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("Error", error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on ${process.env.PORT}`)
        })
        
    } catch (error) {
        console.error("Error connecting with database.")
    }
})()
*/