import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Pagination from "@/components/common/Pagination";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const emptyForm = { name: "", email: "", phone: "", password: "", role: "student" };

const initialOf = (name) => name?.trim()?.[0]?.toUpperCase() || "?";

const ROLE_BADGE = {
  admin: "bg-primary/10 text-primary",
  teacher: "bg-gold/20 text-navy dark:text-gold",
  student: "bg-muted text-muted-foreground",
};

const AdminStudents = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  // Debounced copy of `search` — the list is filtered server-side now, so the
  // request waits for a pause in typing instead of firing on every keystroke.
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
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
      const res = await api.get("/users", {
        params: { page, limit: 10, ...(searchTerm ? { search: searchTerm } : {}) },
      });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(search);
      // A new search starts from the first page of its own results.
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

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

  const handleRoleChange = async (id, role, name) => {
    if (
      role === "admin" &&
      !window.confirm(`Make ${name} an admin? They will get full access to this dashboard.`)
    ) {
      return;
    }
    setMessage("");
    try {
      const res = await api.patch(`/users/${id}/role`, { role });
      setMessage(res.data.message);
      loadUsers();
    } catch (err) {
      setMessage(
        err.response?.data?.Error || err.response?.data?.message || "Failed to update role",
      );
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
      // Removing the only row on the last page would otherwise strand the admin
      // on a page that no longer exists.
      if (users.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadUsers();
      }
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
        <div className="space-y-3">
          {users.map((u) => {
            const isSelf = currentUser?._id === u._id;

            return (
              <Card key={u._id}>
                {/* Horizontal layout: avatar, then details, then actions. Wraps
                    to stacked on narrow screens rather than overflowing. */}
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <Avatar size="lg" className="size-14 shrink-0">
                    <AvatarImage src={u.profileImage || undefined} alt={u.name} />
                    <AvatarFallback>{initialOf(u.name)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-1">
                    {editingId === u._id ? (
                      <div className="grid sm:grid-cols-2 gap-2">
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="h-8 text-sm"
                          placeholder="Name"
                        />
                        <Input
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="h-8 text-sm"
                          placeholder="Phone"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium truncate">{u.name}</h3>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full capitalize",
                              ROLE_BADGE[u.role] || ROLE_BADGE.student,
                            )}
                          >
                            {u.role}
                          </span>
                          {!u.isVerified && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                              Unverified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.phone || "No phone"}</p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
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
                        <select
                          className="border rounded-md px-2 py-1 text-xs bg-background disabled:opacity-50"
                          value={u.role}
                          disabled={isSelf}
                          title={isSelf ? "You cannot change your own role" : "Change role"}
                          onChange={(e) => handleRoleChange(u._id, e.target.value, u.name)}
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button size="xs" variant="outline" onClick={() => startEdit(u)}>
                          Edit
                        </Button>
                        {!u.isVerified && (
                          <Button size="xs" variant="outline" onClick={() => handleVerify(u._id)}>
                            Verify
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="destructive"
                          disabled={isSelf}
                          title={isSelf ? "You cannot delete your own account" : "Delete user"}
                          onClick={() => handleDelete(u._id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {users.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No users found.</p>
          )}

          <Pagination pagination={pagination} onPageChange={setPage} label="users" />
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
