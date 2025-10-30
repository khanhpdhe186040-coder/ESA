const mammoth = require("mammoth");
const ExcelJS = require("exceljs");
const fs = require("fs-extra");
const Material = require("../models/Material");
const cloudinary = require("../config/cloudinary");
const axios = require("axios");

const getAllMaterials = async (req, res) => {
    const files = await Material.find().populate("uploadedBy", "username email");
    res.json(files);
}

const getMaterialsByClass = async (req, res) => {
    const classId = req.params.classId;
    console.log("classId : " + classId) // Debug log
    if (!classId) {
        return res.status(400).json({ error: "Class ID is required" });
    }
    const user = req.user;
    console.log("user : " + user) // Debug log
    if(!user){
        return res.status(401).json({ error: "Unauthorized" });
    }
    const files = await Material.find({ classId }).populate("uploadedBy", "username email");
    res.json(files);
}

const uploadFile = async (req, res) => {
    const classId = req.params.classId;
    if (!classId) return res.status(400).json({ error: "Class ID is required" });
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    try {
        const ext = req.file.originalname.split('.').pop().toLowerCase();
        console.log('Uploading file with extension:', ext);

        const imageExtensions = ["png", "jpg", "jpeg", "gif", "webp"];
        const officeExtensions = ["pptx", "ppt", "xlsx", "xls"];
        const videoExtensions = ["mp4", "webm", "ogg", "mov", "avi"];
        const excelExtensions = ["xlsx", "xls"];
        let result, pdfUrl = null;

        // Determine resource type based on file extension
        let resourceType = "raw";
        if (imageExtensions.includes(ext)) {
            resourceType = "image";
        } else if (videoExtensions.includes(ext)) {
            resourceType = "video";
        } else if (ext === "pdf") {
            resourceType = "raw";  // Changed from 'auto' to 'raw' for PDFs
        }

        // Upload the file with appropriate resource type
        try {
            // For Excel files, we need to ensure they're uploaded as raw files
            const isExcel = excelExtensions.includes(ext);
            const isOffice = officeExtensions.includes(ext);
            
            const uploadOptions = {
                folder: "uploads",
                resource_type: isExcel ? "raw" : resourceType,
                public_id: `${Date.now()}_${req.file.originalname.replace(/\.[^/.]+$/, '')}`, // Remove extension
                access_mode: "public",
                overwrite: true,

                // For Excel files, ensure the original format is preserved
                ...(isExcel && { format: ext })
            };

            // Special handling for office files (PPTX, PPT)
            if (isOffice) {
                uploadOptions.resource_type = "raw";
                // For PowerPoint files, we might want to generate a PDF preview
                if (["pptx", "ppt"].includes(ext)) {
                    uploadOptions.eager = [
                        { format: 'pdf', resource_type: 'raw' }
                    ];
                }
            }

            console.log('Uploading with options:', uploadOptions);
            result = await cloudinary.uploader.upload(req.file.path, uploadOptions);
            console.log('File uploaded successfully:', result);
        } catch (uploadError) {
            console.error('Error uploading file to Cloudinary:', uploadError);
            throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        const newFile = new Material({
            filename: req.file.originalname,
            url: result.secure_url,
            pdfUrl: pdfUrl, // Will be null for non-office files
            public_id: result.public_id,
            classId,
            uploadedBy: user.id,
            fileType: ext
        });

        await newFile.save();
        res.json({ message: "File uploaded successfully", file: newFile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "File upload failed" });
    }
};
const downloadFile =  async (req, res) => {
    const id = req.params.id;
    console.log("downloadFile : " + id); // Debug log
    if (!id) {
        return res.status(400).json({ error: "File ID is required" });
    }
    // const user = req.user;
    // console.log("user : " + user) // Debug log
    // if(!user){
    //     return res.status(401).json({ error: "Unauthorized" });
    // }
    try {
        const file = await Material.findById(req.params.id);
        if (!file) return res.status(404).json({ error: "File not found" });

        // Get the file content from Cloudinary using its URL
        const response = await axios.get(file.url, {
            responseType: "arraybuffer", // download binary data
        });

        // Set headers to force download
        res.set({
            "Content-Disposition": `attachment; filename="${file.filename}"`,
            "Content-Type": response.headers["content-type"],
        });

        // Send the binary data
        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to download file" });
    }
};


// 📂 Mở file theo loại (Word, PPTX, PDF, ảnh, v.v.)
const openFile = async (req, res) => {
    try {
        const file = await Material.findById(req.params.id);
        if (!file) return res.status(404).json({ error: "File not found" });

        const filename = file.filename || "file";
        const ext = file.fileType;
        const safeFilename = encodeURIComponent(filename);

        if (["docx", "doc"].includes(ext)) {
            const tmpDir = "./tmp";
            await fs.ensureDir(tmpDir); // ✅ tạo thư mục nếu chưa tồn tại

            const tmpPath = `${tmpDir}/${file._id}.docx`;

            // tải file về (axios) rồi convert
            const writer = fs.createWriteStream(tmpPath);
            const response = await axios.get(file.url, { responseType: "stream" });
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on("finish", resolve);
                writer.on("error", reject);
            });

            const result = await mammoth.convertToHtml({ path: tmpPath });

            // Xóa file tạm sau khi convert
            await fs.remove(tmpPath);

            // Gửi về browser hiển thị
            res.send(`
              <html>
                <head><meta charset="UTF-8"><title>${filename}</title></head>
                <body style="padding:20px;">${result.value}</body>
              </html>
            `);
        }

        // PowerPoint - Use Google Docs Viewer for preview
        if (["pptx", "ppt", "xlsx", "xls"].includes(ext)) {
            try {
                // Ensure the URL is properly formatted for Google Docs Viewer
                let fileUrl = file.url;

                // If using Cloudinary, get the direct URL to the file
                if (file.public_id) {
                    const resourceType = ["pptx", "ppt"].includes(ext) ? 'raw' : 'auto';
                    fileUrl = cloudinary.url(file.public_id, {
                        resource_type: resourceType,
                        secure: true
                    });
                }

                // Encode the file URL for use in Google Docs Viewer
                const encodedUrl = encodeURIComponent(fileUrl);
                const viewerUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;

                // Return an HTML page with Google Docs Viewer iframe
                return res.send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${filename} - Document Viewer</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body, html { 
                                margin: 0; 
                                padding: 0; 
                                height: 100%; 
                                overflow: hidden; 
                                font-family: Arial, sans-serif;
                            }
                            .container {
                                display: flex;
                                flex-direction: column;
                                height: 100vh;
                            }
                            .header {
                                padding: 10px;
                                background: #f5f5f5;
                                border-bottom: 1px solid #ddd;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            }
                            iframe {
                                flex: 1;
                                width: 100%;
                                border: none;
                                background: #f9f9f9;
                            }
                            .download-btn {
                                display: inline-block;
                                padding: 5px 15px;
                                background: #4CAF50;
                                color: white;
                                text-decoration: none;
                                border-radius: 4px;
                                font-size: 14px;
                                margin-left: 10px;
                            }
                            .file-info {
                                font-weight: bold;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <iframe src="${viewerUrl}" allowfullscreen></iframe>
                        </div>
                        <script>
                            // Add error handling for the iframe
                            document.querySelector('iframe').onerror = function() {
                                alert('Failed to load the document preview. Please try downloading the file instead.');
                            };
                        </script>
                    </body>
                    </html>
                `);
            } catch (error) {
                console.error('Error generating preview:', error);
                // Fallback to download if preview fails
                const response = await axios.get(file.url, { responseType: 'stream' });
                res.setHeader('Content-Type', 'application/octet-stream');
                res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
                return response.data.pipe(res);
            }
        }


            // PDF
        if (ext === "pdf") {
            try {
                const isThumbnail = req.query.thumbnail === "true";

                if (isThumbnail) {
                    // For thumbnails, return a simple PDF icon
                    const pdfIconPath = path.join(__dirname, '../../client/public/pdf-icon.png');
                    return res.sendFile(pdfIconPath);
                }

                // For regular PDF viewing, stream the file directly
                const response = await axios.get(file.url, {
                    responseType: 'stream',
                    headers: {
                        'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
                    }
                });

                // Set headers for PDF display in browser
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
                res.setHeader('Cache-Control', 'public, max-age=31536000');
                return response.data.pipe(res);

            } catch (error) {
                console.error('Error handling PDF:', error);
                // Fallback to direct download if there's an error
                const response = await axios.get(file.url, { responseType: 'stream' });
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
                return response.data.pipe(res);
            }
        }



        // Video files - serve directly with proper MIME type
        if (["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) {
            // Set the correct MIME type for the video
            const mimeTypes = {
                'mp4': 'video/mp4',
                'webm': 'video/webm',
                'ogg': 'video/ogg',
                'mov': 'video/mp4', // .mov files typically use MP4 codec
                'avi': 'video/x-msvideo'
            };

            const contentType = mimeTypes[ext] || 'video/mp4';

            // Stream the video file directly
            const response = await axios.get(file.url, { responseType: 'stream' });
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
            return response.data.pipe(res);
        }

        // Images
        if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
            const response = await axios.get(file.url, { responseType: "stream" });
            res.setHeader("Content-Type", `image/${ext === 'jpg' ? 'jpeg' : ext}`);
            res.setHeader("Content-Disposition", `inline; filename="${safeFilename}"`);
            return response.data.pipe(res);
        }

        // Default → download
        const response = await axios.get(file.url, { responseType: "stream" });
        res.setHeader("Content-Type", response.headers["content-type"] || "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
        response.data.pipe(res);

    } catch (error) {
        console.error("Error opening file:", error);
        res.status(500).json({ error: "Failed to open file" });
    }
};

const deleteMaterial = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) {
            return res.status(404).json({ error: 'Material not found' });
        }

        // Delete from Cloudinary if public_id exists
        if (material.public_id) {
            try {
                const fileExt = material.filename.split('.').pop().toLowerCase();
                const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
                const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

                let resourceType = 'raw'; // Default to raw for all other types

                if (videoExtensions.includes(fileExt)) {
                    resourceType = 'video';
                } else if (imageExtensions.includes(fileExt)) {
                    resourceType = 'image';
                }

                console.log(`Deleting file with public_id: ${material.public_id}, type: ${resourceType}`);

                // First try with the determined resource type
                try {
                    await cloudinary.uploader.destroy(material.public_id, {
                        resource_type: resourceType,
                        invalidate: true
                    });
                    console.log('Successfully deleted from Cloudinary');
                } catch (destroyError) {
                    console.error('Error in cloudinary.uploader.destroy:', destroyError);

                    // If first attempt fails, try with the other resource types
                    const otherResourceTypes = ['image', 'video', 'raw'].filter(rt => rt !== resourceType);

                    for (const rt of otherResourceTypes) {
                        try {
                            console.log(`Trying with resource_type: ${rt}`);
                            await cloudinary.uploader.destroy(material.public_id, {
                                resource_type: rt,
                                invalidate: true
                            });
                            console.log(`Successfully deleted with resource_type: ${rt}`);
                            break; // Exit loop if successful
                        } catch (e) {
                            console.error(`Failed with resource_type ${rt}:`, e.message);
                        }
                    }
                }

                // For videos, try to delete any generated thumbnails
                if (resourceType === 'video' || videoExtensions.includes(fileExt)) {
                    try {
                        const publicIdWithoutExt = material.public_id.split('.').slice(0, -1).join('.');
                        await cloudinary.uploader.destroy(publicIdWithoutExt, {
                            resource_type: 'image',
                            invalidate: true
                        });
                        console.log('Successfully deleted video thumbnail');
                    } catch (thumbError) {
                        console.warn('Could not delete video thumbnail:', thumbError.message);
                    }
                }
            } catch (cloudinaryError) {
                console.error('Error in Cloudinary deletion process:', cloudinaryError);
                // Continue with database deletion even if Cloudinary deletion fails
            }
        }

        // Delete from database
        await Material.findByIdAndDelete(req.params.id);

        res.json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error('Error in deleteMaterial:', error);
        res.status(500).json({
            error: 'Failed to delete material',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getAllMaterials,
    downloadFile,
    uploadFile,
    deleteMaterial,
    getMaterialsByClass,
    openFile
}
