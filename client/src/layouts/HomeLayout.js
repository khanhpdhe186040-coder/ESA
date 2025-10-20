import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/home/Sidebar";
import Navbar from "../components/home/Navbar";
import ChatWidget from "../components/chat/ChatWidget";

const HomeLayout = () => {
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

export default HomeLayout;
