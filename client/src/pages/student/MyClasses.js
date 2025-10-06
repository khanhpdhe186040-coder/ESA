import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Ensure you have this package installed

const MyClasses = () => {
  const [classes, setClasses] = useState([]);
  const [filter, setFilter] = useState("Ongoing");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in again to view your classes.");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const studentId = jwtDecode(token).id; // Decode token to get student ID
        const response = await axios.get(
          `http://localhost:9999/api/student/${studentId}/my-classes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("MyClasses API Response:", response.data);
        if (response.data && Array.isArray(response.data.data)) {
          setClasses(response.data.data);
        } else {
          console.warn(
            "API response.data.data is not an array or is missing 'data' property:",
            response.data
          );
          setError("Invalid classes data format received from server.");
          setClasses([]);
        }
      } catch (err) {
        console.error(
          "Error fetching classes:",
          err.response?.status,
          err.response?.data
        );
        setError(
          `Failed to fetch classes. Status: ${
            err.response?.status || "Unknown"
          }, Message: ${err.response?.data?.message || err.message}`
        );
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const mapStatusForFilter = (status) => {
    if (!status) {
      return "ongoing"; // Default status if undefined
    }
    if (status.toLowerCase() === "finished") {
      return "completed";
    }
    return status.toLowerCase();
  };

  const filteredClasses = classes.filter((cls) => {
    if (filter === "All") {
      return true;
    }
    return mapStatusForFilter(cls.status) === filter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="text-gray-500 text-center py-10">Loading classes...</div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-10">
        Error: {error}. Please check your network or try logging in again.
      </div>
    );
  }

  if (filteredClasses.length === 0 && !loading && !error) {
    return (
      <div className="text-gray-500 text-center py-10">
        No classes found matching your filter or in the system.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold">My Classes</h1>
        <div className="flex gap-2 flex-wrap">
          {["All", "Ongoing", "Completed"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`border px-4 py-1.5 rounded text-sm font-medium transition-all ${
                filter === type
                  ? "bg-blue-500 text-white shadow"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-3 text-left">Class Name</th>
              <th className="border px-4 py-3 text-left">Teacher</th>
              <th className="border px-4 py-3 text-left">Schedule</th>
              <th className="border px-4 py-3 text-center">Status</th>
              <th className="border px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.map((cls) => {
              const displayStatus =
                cls.status === "finished" ? "Completed" : (cls.status || "Ongoing");

              return (
                <tr
                  key={cls._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="border px-4 py-3 font-semibold text-blue-700">
                    {cls.name}
                  </td>
                  <td className="border px-4 py-3">
                    {Array.isArray(cls.teachers) && cls.teachers.length > 0
                      ? cls.teachers
                          .map((teacher) => teacher.fullName)
                          .join(", ")
                      : "N/A"}
                  </td>
                  <td className="border px-4 py-3">
                    {Array.isArray(cls.schedule) && cls.schedule.length > 0 ? (
                      <div>
                        {cls.schedule.map((s, index) => (
                          <div key={index}>
                            {s.weekday}: {" "}
                            {s.slot?.from && s.slot?.to
                              ? `${s.slot.from} - ${s.slot.to}`
                              : "Time N/A"}
                          </div>
                        ))}
                      </div>
                    ) : (
                      "No Schedule"
                    )}
                  </td>

                  <td className="border px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        displayStatus.toLowerCase() === "ongoing"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {displayStatus}
                    </span>
                  </td>
                  <td className="border px-4 py-3 text-center">
                    <Link
                      to={`/student/my-classes/${cls._id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyClasses;
