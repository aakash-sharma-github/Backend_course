import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiErrors } from '../utils/ApiErrors.js'
import { User } from '../models/user.models.js'
import { cloudinaryFileUpload } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: "Ok"
    // })

    // * steps for registering new users.
    // TODO: get user details from frontend.
    const { username, fullname, email, password } = req.body
    console.log("email", email)

    // TODO: validate if any field is empty sent by user.
    // * validation check for all fields. We can validate all fileds one by one.
    if ([fullname, username, email, password].some((fields) => fields?.trim() === "")) {
        throw new ApiErrors(400, "All fields are required.")
    }

    // TODO: check if user already exist through email, username.
    // * checking user in database.
    const userExist = User.findOne({ $or: [{ username }, { email }] });

    if (userExist) {
        throw new ApiErrors(409, "Username or Email already exists.")
    }

    // TODO: check for image, check for avatar has uploaded from user.
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiErrors(409, "Avatar is required.")
    }

    // TODO: check for avatar is uploaded or not. upload to cloudinary.
    const avatar = cloudinaryFileUpload(avatarLocalPath);
    const coverImage = cloudinaryFileUpload(coverImageLocalPath);

    if (!avatar) {
        throw new ApiErrors(409, "Avatar is required.")
    }

    // TODO: create user object and entry in mongo database.
    // * saving data to database.
    const user = await User.create({
        username: username.toLowerCase(),
        fullname,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || ''

    })

    // TODO: remove password and refreshToken field from response for security purpose.
    const userRegistered = await User.findById(_id).select("-password -refreshToken")

    // TODO: check if user is created or not.
    if (!userRegistered) {
        throw new ApiErrors(500, "Sorry! User not registered. Try again!")
    }
    // TODO: return response.
    return res.status(201).json(new ApiResponse(200, userRegistered, "User Registered successfully."))
})

export { registerUser }