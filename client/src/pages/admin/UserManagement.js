import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Search, Edit, Eye, X } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import AddUserModal from "../../components/admin/AddUserModal";
import UpdateUserModal from "../../components/admin/UpdateUserModal";
import ShowUserDetailModal from "../../components/admin/ShowUserDetailModal";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // mã r1,r2 hoặc all

  const [showAdd, setShowAdd] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  /* ---------------- Fetch data ---------------- */
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:9999/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.data || []);
    };

    const fetchRoles = async () => {
      const res = await axios.get("http://localhost:9999/api/roles");
      setRoles(res.data.data || []);
    };

    fetchUsers();
    fetchRoles();
  }, []);

  /* ---------- Lấy 1 user theo id ---------- */
  const fetchUserById = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:9999/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  /* ---------------- Filter ---------------- */
  const filtered = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.roleId.id === roleFilter;
    return matchSearch && matchRole;
  });

  /* ---------------- JSX ---------------- */
  return (
    <AdminLayout>
      <div className="w-full p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Users</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* search */}
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="pl-10 pr-3 py-2 border rounded w-full"
                />
              </div>
            </div>
            {/* role */}
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              >
                <option value="all">All Roles</option>
                {roles.map((r) => (
                  <option key={r._id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            {/* clear */}
            <div className="flex justify-end items-end">
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 border bg-gray-100 rounded hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="min-w-full bg-white shadow-md border">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              {[
                "Full Name",
                "Username",
                "Email",
                "Phone",
                "Role",
                "DOB",
                "Actions",
              ].map((h) => (
                <th key={h} className="py-3 px-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u._id} className="border-b last:border-none">
                <td className="py-4 px-4 font-semibold">{u.fullName}</td>
                <td className="py-4 px-4">{u.userName}</td>
                <td className="py-4 px-4">{u.email}</td>
                <td className="py-4 px-4">{u.number}</td>
                <td className="py-4 px-4 capitalize">{u.roleId.name}</td>
                <td className="py-4 px-4">
                  {new Date(u.birthday).toLocaleDateString("vi-VN")}
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-3">
                    <button
                      className="text-gray-600 hover:text-blue-600"
                      title="Edit"
                      onClick={async () => {
                        const fresh = await fetchUserById(u._id);
                        if (fresh) {
                          setSelectedUser(fresh);
                          setShowUpdate(true);
                        }
                      }}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      className="text-gray-600 hover:text-blue-600"
                      title="View"
                      onClick={async () => {
                        const fresh = await fetchUserById(u._id);
                        if (fresh) {
                          setSelectedUser(fresh);
                          setShowDetail(true);
                        }
                      }}
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onCreate={(u) => {
            setUsers((prev) => [...prev, u]);
            setShowAdd(false);
          }}
        />
      )}
      {showUpdate && selectedUser && (
        <UpdateUserModal
          user={selectedUser}
          onClose={() => {
            setSelectedUser(null);
            setShowUpdate(false);
          }}
          onUpdate={(upd) => {
            setUsers((p) => p.map((x) => (x._id === upd._id ? upd : x)));
            setShowUpdate(false);
          }}
        />
      )}
      {showDetail && selectedUser && (
        <ShowUserDetailModal
          user={selectedUser}
          onClose={() => {
            setSelectedUser(null);
            setShowDetail(false);
          }}
        />
      )}
    </AdminLayout>
  );
}
