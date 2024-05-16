import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'


// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const cloudinaryFileUpload = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        // file uploaded successfully
        // console.log("File uploaded successfully", response.url)
        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        // remove locally saved file when upload is failed.
        fs.unlinkSync(localFilePath)
        return null

    }
}

export { cloudinaryFileUpload }