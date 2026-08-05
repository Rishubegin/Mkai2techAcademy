import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/services/api";
import { cn } from "@/lib/utils";

const emptyForm = { name: "", email: "", phone: "", password: "", role: "student" };

const AdminStudents = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data.users);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/admin/users", form);
      setMessage("User created successfully");
      setForm(emptyForm);
      setShowForm(false);
      loadUsers();
    } catch (err) {
      setMessage(err.response?.data?.Error || err.response?.data?.message || "Failed to create user");
    }
  };

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditForm({ name: user.name, phone: user.phone || "" });
  };

  const handleUpdate = async (id) => {
    setMessage("");
    try {
      await api.patch(`/users/${id}`, editForm);
      setEditingId(null);
      loadUsers();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to update user");
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.patch(`/users/${id}/verify`);
      loadUsers();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to verify user");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      await api.delete(`/users/${id}`);
      loadUsers();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Student"}
        </Button>
      </div>

      {message && <p className="text-sm">{message}</p>}

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
              <Input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Temporary Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit" className="sm:col-span-2">
                Create User
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b-2 border-gold bg-navy text-white">
                <th className="py-2 pr-4 pl-2">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Verified</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => (
                <tr
                  key={u._id}
                  className={cn("border-b", idx % 2 === 1 && "bg-light-blue dark:bg-accent")}
                >
                  <td className="py-2 pr-4 pl-2">
                    {editingId === u._id ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      u.name
                    )}
                  </td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4">
                    {editingId === u._id ? (
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      u.phone || "-"
                    )}
                  </td>
                  <td className="py-2 pr-4">{u.role}</td>
                  <td className="py-2 pr-4">{u.isVerified ? "Yes" : "No"}</td>
                  <td className="py-2 pr-4 space-x-2 whitespace-nowrap">
                    {editingId === u._id ? (
                      <>
                        <Button size="xs" onClick={() => handleUpdate(u._id)}>
                          Save
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="xs" variant="outline" onClick={() => startEdit(u)}>
                          Edit
                        </Button>
                        {!u.isVerified && (
                          <Button size="xs" variant="outline" onClick={() => handleVerify(u._id)}>
                            Verify
                          </Button>
                        )}
                        <Button size="xs" variant="destructive" onClick={() => handleDelete(u._id)}>
                          Delete
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
