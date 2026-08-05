import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/services/api";

const emptyForm = { title: "", message: "", targetRole: "all", expiryDate: "" };

const AdminNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/notices", { params: { all: true } });
      setNotices(res.data.notices);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/notices", {
        ...form,
        expiryDate: form.expiryDate || undefined,
      });
      setMessage("Notice created successfully");
      setForm(emptyForm);
      setShowForm(false);
      loadNotices();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to create notice");
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.patch(`/notices/${id}`, { isActive });
      loadNotices();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to update notice");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);
      loadNotices();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to delete notice");
    }
  };

  const isExpired = (notice) => notice.expiryDate && new Date(notice.expiryDate) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Notices</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Notice"}
        </Button>
      </div>

      {message && <p className="text-sm">{message}</p>}

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="sm:col-span-2"
              />
              <Textarea
                placeholder="Message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                className="sm:col-span-2"
              />
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={form.targetRole}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
              >
                <option value="all">Everyone</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
              <Input
                type="date"
                placeholder="Expiry date (optional)"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
              <Button type="submit" className="sm:col-span-2">
                Create Notice
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4">
          {notices.map((notice) => (
            <Card key={notice._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <h3 className="font-medium">{notice.title}</h3>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {notice.targetRole}
                    </span>
                    {isExpired(notice) && (
                      <span className="bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                        Expired
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{notice.message}</p>
                <div className="flex gap-2 items-center">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleToggleActive(notice._id, !notice.isActive)}
                  >
                    {notice.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="xs" variant="destructive" onClick={() => handleDelete(notice._id)}>
                    Delete
                  </Button>
                  {notice.expiryDate && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Expires {new Date(notice.expiryDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {notices.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No notices yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotices;
