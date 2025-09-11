import { useState } from "react";
import Navbar from "../components/teacher/Navbar";
import Sidebar from "../components/teacher/Sidebar";
import { Outlet } from "react-router-dom";

export default function TeacherLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Navbar onToggleSidebar={handleToggleSidebar} />
            <main className="relative flex flex-1">
                <div className={`${isSidebarOpen ? "" : "hidden"}`}>
                    <Sidebar />
                </div>
                {/* Page content goes here */}
                <div className="max-h-[675px] w-full p-8 bg-gray-50 overflow-y-auto overflow-x-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}