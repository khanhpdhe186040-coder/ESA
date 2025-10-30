import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PAGE_SIZE = 15;
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:9999/api";

export default function NewsList() {
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const roleId = (() => {
    try {
      return token ? jwtDecode(token)?.roleId : undefined;
    } catch {
      return undefined;
    }
  })();
  const isAdmin = roleId === "r1";

  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchNews() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(
          `${API_BASE}/news/paginated?page=${page}&limit=${PAGE_SIZE}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Unexpected response (not JSON). Check API base URL.");
        }
        const json = await res.json();
        setItems(json.data || []);
        setTotalPages(json.totalPages || 1);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
    return () => controller.abort();
  }, [page]);

  const goToPage = (nextPage) => {
    setSearchParams({ page: String(nextPage) });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">News</h2>
        {isAdmin && (
          <button
            onClick={() => navigate("/admin/news/add")}
            className="inline-flex items-center px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            + Add News
          </button>
        )}
      </div>
      {loading && <p className="mt-4 text-gray-500">Loading...</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="mt-4 text-gray-500">No news found.</p>
      )}
      <ul className="mt-4 divide-y divide-gray-200">
        {items.map((n) => (
          <li key={n._id} className="py-4">
            <Link
              to={location.pathname.startsWith("/admin/news")
                ? `/admin/news/list/${n._id}`
                : `${location.pathname.replace(/\/$/, "")}/${n._id}`}
              className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              {n.title}
            </Link>
            <div className="mt-1 text-sm text-gray-500">
              <span>By: {n.userName || "Unknown"}</span>
              <span className="ml-3">
                {n.postDate ? new Date(n.postDate).toLocaleString() : ""}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={() => goToPage(1)}
          disabled={page <= 1}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          « First
        </button>
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          ‹ Prev
        </button>
        <span className="px-3 py-1 text-sm text-gray-700">
          Page {page} / {totalPages}
        </span>
        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next ›
        </button>
        <button
          onClick={() => goToPage(totalPages)}
          disabled={page >= totalPages}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Last »
        </button>
      </div>
    </div>
  );
}


