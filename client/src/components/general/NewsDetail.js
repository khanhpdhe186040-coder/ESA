import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:9999/api";

export default function NewsDetail() {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();
    async function fetchDetail() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/news/${id}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Unexpected response (not JSON). Check API base URL.");
        }
        const json = await res.json();
        setNews(json.data);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchDetail();
    return () => controller.abort();
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 border-gray-300">
      <Link
        to={location.pathname.startsWith("/admin/") ? "/admin/news/list" : location.pathname.startsWith("/teacher/") ? "/teacher/news" : "/student/news"}
        className="text-blue-600 hover:text-blue-700 hover:underline"
      >
        ← Back to News
      </Link>
      {loading && <p className="mt-4 text-gray-500">Loading...</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {!loading && !error && news && (
        <div className="mt-4">
          <h2 className="text-2xl font-semibold mb-2">{news.title}</h2>
          <div className="text-sm text-gray-500 mb-4">
            <span>By: {news.userName || "Unknown"}</span>
            <span className="ml-3">
              {news.postDate ? new Date(news.postDate).toLocaleString() : ""}
            </span>
          </div>
          <div
            className="news-content leading-relaxed text-gray-800 border border-gray-300 p-4 rounded"
            dangerouslySetInnerHTML={{ __html: news.content || "" }}
          />
        
        </div>
      )}
    </div>
  );
}


