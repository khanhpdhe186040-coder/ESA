import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/student/Sidebar";
import Navbar from "../components/student/Navbar";
import ChatWidget from "../components/chat/ChatWidget";

const StudentLayout = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-4">
          <Outlet />
        </main>
      </div>
      <ChatWidget />
    </div>
  );
};

export default StudentLayout;
