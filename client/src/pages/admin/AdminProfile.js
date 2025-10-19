// import { useEffect, useState, useMemo } from "react";
// import axios from "axios";
// import Profile from "../../components/general/Profile";

// export default function AdminProfile() {
//   const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
//   const storedId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
//   const userId = useMemo(() => storedId, [storedId]);
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const fetchUserById = async (id) => {
//     try {
//       const res = await axios.get(`http://localhost:9999/api/users/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return res.data.data;
//     } catch (e) {
//       console.error(e);
//       return null;
//     }
//   };
//   useEffect(() => {
//     const run = async () => {
//       if (!token || !userId) { setLoading(false); return; }
//       const fresh = await fetchUserById(userId);
//       if (fresh) setUser(fresh);
//       setLoading(false);
//     };
//     run();
//   }, [token, userId]);

//   if (loading) {
//     return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-10">
//       <Profile
//         id={userId}
//         initialUser={user}
//         onUpdated={(u) => setUser(u)}
//       />
//     </div>
//   );
// }

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import AdminLayout from "../../layouts/AdminLayout";
import Profile from "../../components/general/Profile";

export default function AdminProfile() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Try to get the user id from the token first; fall back to localStorage
  const idFromToken = useMemo(() => {
    if (!token) return null;
    try {
      const p = jwtDecode(token);
      return p?.sub || p?._id || p?.id || p?.userId || null;
    } catch {
      return null;
    }
  }, [token]);

  const storedId =
    typeof window !== "undefined"
      ? (localStorage.getItem("userId") ||
         localStorage.getItem("_id") ||
         localStorage.getItem("id"))
      : null;

  const userId = useMemo(() => idFromToken || storedId, [idFromToken, storedId]);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserById = async (id) => {
    try {
      const res = await axios.get(`http://localhost:9999/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // tolerate {data:{...}} or direct object
      return res.data?.data ?? res.data ?? null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!token || !userId) { setLoading(false); return; }
      const fresh = await fetchUserById(userId);
      if (fresh) setUser(fresh);
      setLoading(false);
    };
    run();
  }, [token, userId]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">Loading…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="w-full p-8 bg-gray-50 min-h-screen">
        {/* Page title (left-aligned, 2xl as requested). 
            If your Profile component already renders its own title, you can remove this <h1>. */}
        <h1 className="text-2xl font-semibold mb-4">Update Profile</h1>

        <Profile
          id={userId}
          initialUser={user}
          onUpdated={(u) => setUser(u)}
        />
      </div>
    </AdminLayout>
  );
}
