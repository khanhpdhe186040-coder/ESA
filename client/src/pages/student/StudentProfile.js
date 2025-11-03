import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Profile from "../../components/general/Profile";

export default function StudentProfile() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const storedId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const userId = useMemo(() => storedId, [storedId]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchUserById = async (id) => {
    try {
      const res = await axios.get(`http://localhost:9999/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
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
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <h1 className="text-2xl font-semibold mb-4">Update Profile</h1>
      <Profile
        id={userId}
        initialUser={user}
        onUpdated={(u) => setUser(u)}
      />
    </div>
  );
}