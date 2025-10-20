import React from "react";
import { Menu } from "lucide-react"; // Lucide: bộ icon Tailwind-friendly
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Navbar = ({ onToggleSidebar }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const token = localStorage.getItem("token");
    const userName = token ? jwtDecode(token).userName : "Guest";

    return (
        <div className="w-full bg-gray-300 px-4 py-2 shadow-md flex items-center justify-between">
            {/* Left: Toggle + Title */}
            <div className="flex items-center gap-4">
                <button onClick={onToggleSidebar} className="p-2 rounded hover:bg-gray-100">
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-semibold text-gray-800">English Center</h1>
            </div>

            {/* Center */}
            <div className="flex-1 px-4">

            </div>

            {/* Right: Notification + Avatar + Name + Logout */}
            <div className="flex items-center gap-4">

                {/* Avatar + Name */}
                <div className="flex items-center gap-2">

                    <span className="text-gray-700 font-medium">{userName}</span>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="text-sm text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-md"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Navbar;
