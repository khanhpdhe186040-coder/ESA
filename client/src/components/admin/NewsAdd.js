import React, { useEffect, useState } from "react";
import axios from "axios";
import { Editor } from "@tinymce/tinymce-react";
import { jwtDecode } from "jwt-decode";

const NewsAdd = () => {
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const payload = jwtDecode(token);
      if (payload?.id) {
        setUserId(payload.id);
       
      }
    } catch (e) {
      // ignore token errors; userId will remain empty and validation will catch it
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!userId || !title || !content) {
      setError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId,
        title,
        content,
        postDate: new Date().toISOString(),
      };

      const response = await axios.post(
        "http://localhost:9999/api/news/add",
        payload
      );

      if (response?.data?.success) {
        setSuccess("News added successfully.");
        setTitle("");
        setContent("");
      } else {
        setError(response?.data?.message || "Failed to add news.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to add news."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Add News</h2>
        <p className="text-sm text-gray-500">Post date will be set to current time automatically.</p>
      </div>

      {error ? (
        <div className="mb-4 border-l-4 border-red-400 bg-red-50 text-red-700 p-4 text-sm rounded">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 border-l-4 border-green-400 bg-green-50 text-green-700 p-4 text-sm rounded">
          {success}
        </div>
      ) : null}

      {!userId ? (
        <div className="mb-4 border-l-4 border-amber-400 bg-amber-50 text-amber-800 p-4 text-sm rounded">
          No token found. Please log in to auto-fill user.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <Editor
            apiKey="mdy8p6sx9vtssy523gfj5mtp3k9ejqqjtfjpoznd9a6eb92p"
            value={content}
            onEditorChange={(newValue) => setContent(newValue)}
            init={{
              height: 400,
              menubar: false,
              plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "help",
                "wordcount",
              ],
              toolbar:
                "undo redo | blocks | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isSubmitting
                ? "bg-indigo-400 cursor-not-allowed focus:ring-indigo-400"
                : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewsAdd;


