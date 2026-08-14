import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Pagination from "@/components/common/Pagination";
import api from "@/services/api";

const AdminContactForms = () => {
  const [forms, setForms] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadForms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/contact", { params: { page, limit: 10 } });
      setForms(res.data.contactForms);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/contact/${id}`, { status });
      loadForms();
    } catch {
      // no-op: status will just remain unchanged in the UI on refresh
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Contact Inquiries</h2>

      {forms.length === 0 && (
        <p className="text-center text-muted-foreground py-6">No inquiries yet.</p>
      )}

      <div className="grid gap-4">
        {forms.map((form) => (
          <Card key={form._id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{form.name}</h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(form.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {form.email} {form.phone && `· ${form.phone}`}
              </p>
              <p className="text-sm">{form.message}</p>
              <div className="flex items-center gap-2">
                <select
                  className="border rounded-md px-2 py-1 text-xs bg-background"
                  value={form.status}
                  onChange={(e) => handleStatusChange(form._id, e.target.value)}
                >
                  <option value="new">New</option>
                  <option value="responded">Responded</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} label="inquiries" />
    </div>
  );
};

export default AdminContactForms;
