import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:9999/api/material";

const ClassMaterialForTeacher = () => {
    const {classId} = useParams();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `http://localhost:9999/api/material/${classId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setMaterials(response.data);
            } catch (err) {
                console.error("Error fetching materials:", err);
                setError("Failed to load materials.");
                setMaterials([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();
    }, [classId]);

    // Cloudinary thumbnail generator
    const getThumbnailUrl = (material) => {
        const {url, fileType, filename} = material;
        console.log("url: " + url)
        if (!url) return "/file-icon.png";

        const ext = filename?.split('.').pop()?.toLowerCase() || '';

        // For images - add Cloudinary transformations
        if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
            // Insert transformations after /upload/ but before the rest of the path
            const parts = url.split('/upload/');
            if (parts.length === 2) {
                return `${parts[0]}/upload/w_300,h_200,c_fill/${parts[1]}`;
            }
        }

        // For videos - get first frame
        if (url.includes('res.cloudinary.com') && url.includes('/video/upload/')) {
            // Replace video extension with .jpg for thumbnail
            const videoUrl = url.split('.').slice(0, -1).join('.');
            return `${videoUrl}.jpg`;
        }

        // // For PDFs - get first page as image
        // if ((ext === 'pdf' || fileType === 'application/pdf') && url.includes('res.cloudinary.com')) {
        //     // Keep the original URL structure but add the page extraction and transformation
        //     const parts = url.split('/upload/');
        //     const baseUrl = parts[0];
        //     const path = parts[1];
        //
        //     const uri = `${baseUrl}/upload/${path}`;
        //     console.log("uri: "+ uri)
        //     console.log("test")
        //     // Insert transformation before the filename
        //     return uri;
        // }

        // For Office files - use appropriate icons
        if (['doc', 'docx'].includes(ext)) return '/docx_icon.png';
        if (['ppt', 'pptx'].includes(ext)) return '/pptx_icon.png';
        if (['xls', 'xlsx'].includes(ext)) return '/xlsx_icon.png';
        if (ext === 'pdf') return '/pdf-icon.png';

        // Default file icon
        return '/file-icon.png';
    };

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6 text-blue-800">
                    Class Materials
                </h1>
                <div className="text-center py-10">Loading materials...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6 text-blue-800">
                    Class Materials
                </h1>
                <div className="text-center py-10 text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-blue-800">
                Class Materials
            </h1>

            <div className="my-2">
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Upload Material
                </button>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Upload Material</h2>
                            <button
                                onClick={() => {
                                    setIsUploadModalOpen(false);
                                    setSelectedFile(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {selectedFile ? (
                                    <div className="text-green-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="font-medium">{selectedFile.name}</p>
                                        <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                ) : (
                                    <div>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="mt-2 text-sm text-gray-600">Click to select a file or drag and drop</p>
                                        <p className="text-xs text-gray-500 mt-1">PDF, DOCX, PPTX, XLSX, JPG, PNG, MP4 (Max 50MB)</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            const file = e.target.files[0];
                                            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                                                toast.error("File size should be less than 50MB");
                                                return;
                                            }
                                            setSelectedFile(file);
                                        }
                                    }}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setIsUploadModalOpen(false);
                                    setSelectedFile(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!selectedFile) {
                                        toast.error("Please select a file to upload");
                                        return;
                                    }

                                    try {
                                        setUploading(true);
                                        const formData = new FormData();
                                        formData.append("file", selectedFile);

                                        const token = localStorage.getItem("token");
                                        const response = await axios.post(
                                            `http://localhost:9999/api/material/upload/${classId}`,
                                            formData,
                                            {
                                                headers: {
                                                    "Content-Type": "multipart/form-data",
                                                    Authorization: `Bearer ${token}`,
                                                },
                                            }
                                        );

                                        toast.success("Material uploaded successfully!");
                                        setMaterials([response.data, ...materials]);
                                        setIsUploadModalOpen(false);
                                        setSelectedFile(null);
                                    } catch (err) {
                                        console.error("Error uploading file:", err);
                                        toast.error(err.response?.data?.error || "Failed to upload material");
                                    } finally {
                                        setUploading(false);
                                    }
                                }}
                                className={`px-4 py-2 rounded-md text-white ${uploading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'}`}
                                disabled={!selectedFile || uploading}
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {materials.length === 0 ? (
                <div className="text-center text-gray-500">No materials found.</div>
            ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {materials.map((material) => (
                        <div
                            key={material._id}
                            className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden relative"
                        >
                            {/* Delete Button */}
                            <button
                                onClick={async (e) => {
                                    e.preventDefault();
                                    if (window.confirm('Are you sure you want to delete this material?')) {
                                        try {
                                            const token = localStorage.getItem("token");
                                            await axios.delete(
                                                `${API_BASE}/${material._id}`,
                                                {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                }
                                            );
                                            toast.success('Material deleted successfully');
                                            // Remove the deleted material from the list
                                            setMaterials(materials.filter(m => m._id !== material._id));
                                        } catch (error) {
                                            console.error('Error deleting material:', error);
                                            toast.error(error.response?.data?.error || 'Failed to delete material');
                                        }
                                    }
                                }}
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors z-10"
                                title="Delete material"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            
                            <a
                                href={`${API_BASE}/open/${material._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <img
                                    src={getThumbnailUrl(material)}
                                    alt={material.filename}
                                    className="w-full h-48 object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/icons/file.png";
                                    }}
                                />
                            </a>

                            <div className="p-3 text-center">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                    {material.filename}
                                </p>

                                {/*<a*/}
                                {/*    href={material.url}*/}
                                {/*    target="_blank"*/}
                                {/*    rel="noopener noreferrer"*/}
                                {/*    className=" text-blue-500 text-xs hover:underline"*/}
                                {/*>*/}
                                {/*    Download*/}

                                {/*</a>*/}
                                <div className="my-2">
                                    <a href={`${API_BASE}/download/${material._id}`}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2  dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
                                        Download

                                    </a>
                                </div>


                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClassMaterialForTeacher;
