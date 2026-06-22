import React, { useEffect, useState } from "react";
import PageLoader from "../PageLoader";
import Swal from "sweetalert2";
import { fetchAllUsers, updateUserRole } from "../../services/adminService";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    const res = await Swal.fire({
      title: `Change role to ${newRole}?`,
      icon: "question",
      showCancelButton: true,
    });
    if (!res.isConfirmed) return;
    try {
      await updateUserRole(user.id, newRole);
      load();
      Swal.fire("Updated", `Role set to ${newRole}`, "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" }) : "—";

  return (
    <div className="w-full p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900">Users</h2>
        <p className="text-slate-500">{users.length} registered users on Velora</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="search"
          placeholder="Search name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border rounded-xl px-4 py-2.5"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border rounded-xl px-4 py-2.5">
          <option value="all">All Roles</option>
          <option value="user">Customers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Total Users</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Customers</p>
          <p className="text-2xl font-bold text-blue-600">{users.filter((u) => u.role === "user").length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase font-semibold">Admins</p>
          <p className="text-2xl font-bold text-amber-600">{users.filter((u) => u.role === "admin").length}</p>
        </div>
      </div>

      {loading ? (
        <PageLoader fullScreen={false} />
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Contact</th>
                <th className="text-left p-4">Address</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Joined</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                        {(user.name || user.email)?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{user.name || "—"}</p>
                        <p className="text-xs text-slate-400">{user.id?.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p>{user.email}</p>
                    <p className="text-slate-500">{user.phone || "—"}</p>
                  </td>
                  <td className="p-4 text-slate-600 max-w-xs">
                    <p className="line-clamp-2">
                      {[user.addressLine, user.city, user.state, user.country].filter(Boolean).join(", ") || "—"}
                    </p>
                    {user.postalCode && <p className="text-xs">{user.postalCode}</p>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                      user.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">{formatDate(user.createdAt)}</td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => toggleRole(user)}
                      className="text-xs font-semibold text-slate-600 hover:text-amber-600 underline"
                    >
                      Toggle role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-12 text-slate-400">No users found</p>
          )}
        </div>
      )}
    </div>
  );
}
