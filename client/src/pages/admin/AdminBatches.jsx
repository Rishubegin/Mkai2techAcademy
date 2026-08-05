import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/services/api";
import BatchRosterPanel from "./BatchRosterPanel";

const emptyForm = { batchName: "", course: "", capacity: "", startDate: "" };

const AdminBatches = () => {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [rosterOpenId, setRosterOpenId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [batchesRes, coursesRes] = await Promise.all([
        api.get("/batches", { params: { limit: 100 } }),
        api.get("/courses", { params: { limit: 100 } }),
      ]);
      setBatches(batchesRes.data.batches);
      setCourses(coursesRes.data.courses);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/batches", { ...form, capacity: Number(form.capacity) });
      setMessage("Batch created successfully");
      setForm(emptyForm);
      setShowForm(false);
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to create batch");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/batches/${id}/status`, { status });
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this batch? This cannot be undone.")) return;
    try {
      await api.delete(`/batches/${id}`);
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to delete batch");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Batches</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Batch"}
        </Button>
      </div>

      {message && <p className="text-sm">{message}</p>}

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
              <Input
                placeholder="Batch Name"
                value={form.batchName}
                onChange={(e) => setForm({ ...form, batchName: e.target.value })}
                required
              />
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                required
              >
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Capacity"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
              />
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              <Button type="submit" className="sm:col-span-2">
                Create Batch
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <Card key={batch._id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{batch.batchName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {batch.course?.title} · Seats: {batch.students?.length || 0}/
                      {batch.capacity}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <select
                      className="border rounded-md px-2 py-1 text-xs bg-background"
                      value={batch.status}
                      onChange={(e) => handleStatusChange(batch._id, e.target.value)}
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Running">Running</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        setRosterOpenId(rosterOpenId === batch._id ? null : batch._id)
                      }
                    >
                      {rosterOpenId === batch._id ? "Hide Students" : "Manage Students"}
                    </Button>
                    <Button size="xs" variant="destructive" onClick={() => handleDelete(batch._id)}>
                      Delete
                    </Button>
                  </div>
                </div>
                {rosterOpenId === batch._id && <BatchRosterPanel batchId={batch._id} />}
              </CardContent>
            </Card>
          ))}
          {batches.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No batches yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminBatches;
