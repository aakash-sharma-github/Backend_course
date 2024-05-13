import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstences = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MONGO is connected!!! DB host: ${connectionInstences.connection.host}`)
    } catch (error) {
        console.log("Error on mongo connection.", error)
        process.exit(1)
    }
}

export default connectDB;