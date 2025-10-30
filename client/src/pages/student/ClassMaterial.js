import {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:9999/api/material";

const ClassMaterial = () => {
    const {classId} = useParams();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

            {materials.length === 0 ? (
                <div className="text-center text-gray-500">No materials found.</div>
            ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {materials.map((material) => (
                        <div
                            key={material._id}
                            className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
                        >
                            <a
                                href={`${API_BASE}/open/${material._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
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

export default ClassMaterial;
