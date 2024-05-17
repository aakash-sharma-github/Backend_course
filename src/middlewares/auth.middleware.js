import jwt from "jsonwebtoken";
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

// ! instead of "res" we have used "_". because our res params was not in used.

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiErrors("Unauthorized request")
        }

        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodeToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiErrors(401, "Invalid Access Token.")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiErrors(401, error?.message || "Invalid Access Token.")
    }
})