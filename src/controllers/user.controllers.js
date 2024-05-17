import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiErrors } from '../utils/ApiErrors.js'
import { User } from '../models/user.models.js'
import { cloudinaryFileUpload } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiErrors(500, "Token generation failed!")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // * steps for registering new users.
    // TODO: get user details from frontend.
    const { username, fullname, email, password } = req.body;

    // TODO: validate if any field is empty sent by user.
    // * validation check for all fields. We can validate all fileds one by one.
    if ([fullname, username, email, password].some((fields) => fields?.trim() === "")) {
        throw new ApiErrors(400, "All fields are required.")
    }

    // TODO: check if user already exist through email, username.
    // * checking user in database.
    const userExist = await User.findOne({ $or: [{ username }, { email }] });

    if (userExist) {
        throw new ApiErrors(409, "Username or Email already exists.")
    }

    // TODO: check for image, check for avatar has uploaded from user.
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiErrors(409, "Avatar is required.")
    }

    // TODO: check for avatar is uploaded or not. upload to cloudinary.
    const avatar = await cloudinaryFileUpload(avatarLocalPath);
    const coverImage = await cloudinaryFileUpload(coverImageLocalPath);

    if (!avatar) {
        throw new ApiErrors(409, "Avatar is required.")
    }

    // TODO: create user object and entry in mongo database.
    // * saving data to database.
    const user = await User.create({
        username: username.toLowerCase(),
        fullname,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ''
    })

    // TODO: remove password and refreshToken field from response for security purpose.
    const userId = user._id;
    const userRegistered = await User.findById(userId).select("-password -refreshToken")

    // TODO: check if user is created or not.
    if (!userRegistered) {
        throw new ApiErrors(500, "Sorry! User not registered. Try again!")
    }

    // TODO: return response.
    return res.status(201)
        .json(new ApiResponse(200, userRegistered, "User Registered successfully."))
})

const loginUser = asyncHandler(async (req, res) => {

    // TODO: get user login data from frontend.
    const { email, password } = req.body;

    // TODO: check if user has sent email.
    if (!(email || password)) {
        throw new ApiErrors(400, "Email or Password is required.")
    }

    // TODO: find email in database.
    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiErrors(404, "Email does not exists.")
    }

    // TODO: check if password is valid.
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiErrors(401, "Invalid user credentials.")
    }

    // TODO: generate access and refresh token.
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // TODO: sent through secure cookie.
    const cookieOptions = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        }, "User logged in successfully."))


})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    }

    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged Out Successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshTokenFromCookie = res.cookies.refreshToken || req.body.refreshToken

    if (!refreshTokenFromCookie) {
        throw new ApiErrors(401, "Unauthorized request.")
    }

    try {
        const decodeToken = jwt.verify(refreshTokenFromCookie, process.env.REFRESH_TOKEN_SECRET)

        const user = User.findById(decodeToken?._id)

        if (!user) {
            throw new ApiErrors(401, "Invalid refresh token.")
        }

        if (refreshTokenFromCookie !== user?.refreshToken) {
            throw new ApiErrors(401, "RefreshToken is used or expired.")
        }

        const { accessToken, refreshToken } = generateAccessAndRefreshToken(user._id)

        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }

        return res.status(200)
            .Cookie("accessToken", accessToken, cookieOptions)
            .Cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(200, { accessToken, refreshToken }, "Token is Refreshed."))
    } catch (error) {
        throw new ApiErrors(401, error?.message || "Invalid refresh token"
        )
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body

    if (!(newPassword === confirmPassword)) {
        throw new ApiErrors(401, "Password does not match.")
    }

    const user = await User.findById(req.body?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiErrors(401, "Invalid password.")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully!"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(200, req.user, "User fetched successfully!")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!(fullname || email)) {
        throw new ApiErrors(400, "All fields are required.")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullname,
            email
        }
    }, { new: true }).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Profile updated!"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const updatedAvatarPath = req.file?.path

    if (!updatedAvatarPath) {
        throw new ApiErrors(400, "Avatar is missing.")
    }

    const avatar = await cloudinaryFileUpload(updatedAvatarPath)

    if (!avatar.url) {
        throw new ApiErrors(401, "Error while uploading avatar.")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true }).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Avatar updated!"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const updatedCoverImagePath = req.file?.path

    if (!updatedCoverImagePath) {
        throw new ApiErrors(400, "Cover image is missing.")
    }

    const coverImage = await cloudinaryFileUpload(updatedCoverImagePath)

    if (!coverImage.url) {
        throw new ApiErrors(401, "Error while uploading avatar.")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, { new: true }).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Cover image updated!"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}