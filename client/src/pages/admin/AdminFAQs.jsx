import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Pagination from "@/components/common/Pagination";
import api from "@/services/api";

const emptyForm = { question: "", answer: "", category: "General" };

const AdminFAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/faqs", { params: { all: true, page, limit: 10 } });
      setFaqs(res.data.faqs);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/faqs", form);
      setMessage("FAQ created successfully");
      setForm(emptyForm);
      setShowForm(false);
      loadFaqs();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to create FAQ");
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.patch(`/faqs/${id}`, { isActive });
      loadFaqs();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to update FAQ");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this FAQ?")) return;
    try {
      await api.delete(`/faqs/${id}`);
      // Removing the only row on the last page would otherwise strand the admin
      // on a page that no longer exists.
      if (faqs.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadFaqs();
      }
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to delete FAQ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">FAQs</h2>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Add FAQ"}</Button>
      </div>

      {message && <p className="text-sm">{message}</p>}

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                placeholder="Question"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                required
              />
              <Textarea
                placeholder="Answer"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                required
              />
              <Input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Button type="submit">Create FAQ</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4">
          {faqs.map((faq) => (
            <Card key={faq._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{faq.question}</h3>
                  <span className="text-xs text-muted-foreground">{faq.category}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{faq.answer}</p>
                <div className="flex gap-2 items-center">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleToggleActive(faq._id, !faq.isActive)}
                  >
                    {faq.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="xs" variant="destructive" onClick={() => handleDelete(faq._id)}>
                    Delete
                  </Button>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {faq.views} views · {faq.helpful} helpful
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {faqs.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No FAQs yet.</p>
          )}

          <Pagination pagination={pagination} onPageChange={setPage} label="FAQs" />
        </div>
      )}
    </div>
  );
};

export default AdminFAQs;
