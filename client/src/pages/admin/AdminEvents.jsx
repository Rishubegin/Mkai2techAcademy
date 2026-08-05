import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/services/api";

const emptyForm = {
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  fee: "0",
  maxAttendees: "",
  file: null,
};

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const [upcomingRes, pastRes] = await Promise.all([
        api.get("/events", { params: { upcoming: true } }),
        api.get("/events", { params: { past: true } }),
      ]);
      setEvents([...upcomingRes.data.events, ...pastRes.data.events]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("date", form.date);
      formData.append("time", form.time);
      formData.append("location", form.location);
      formData.append("fee", form.fee);
      formData.append("maxAttendees", form.maxAttendees);
      if (form.file) formData.append("image", form.file);

      await api.post("/events", formData);
      setMessage("Event created successfully");
      setForm(emptyForm);
      setShowForm(false);
      loadEvents();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    try {
      await api.delete(`/events/${id}`);
      loadEvents();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to delete event");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Events & Workshops</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Event"}
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
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                className="sm:col-span-2"
              />
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
              <Input
                placeholder="Time (e.g. 10:00 AM)"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
              <Input
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
                className="sm:col-span-2"
              />
              <Input
                type="number"
                placeholder="Fee (0 for free)"
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Max Attendees"
                value={form.maxAttendees}
                onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })}
                required
              />
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                className="sm:col-span-2"
              />
              <Button type="submit" disabled={submitting} className="sm:col-span-2">
                {submitting ? "Creating..." : "Create Event"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event._id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString()} · {event.location} ·{" "}
                    {event.attendees?.length || 0}/{event.maxAttendees} registered
                  </p>
                </div>
                <Button size="xs" variant="destructive" onClick={() => handleDelete(event._id)}>
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
          {events.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No events yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
