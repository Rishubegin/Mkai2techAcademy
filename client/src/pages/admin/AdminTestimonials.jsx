import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/testimonials", { params: { all: true, limit: 50 } });
      setTestimonials(res.data.testimonials);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  const handleApprove = async (id, isApproved) => {
    try {
      await api.patch(`/testimonials/${id}`, { isApproved });
      loadTestimonials();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to update testimonial");
    }
  };

  const handleFeature = async (id, isFeatured) => {
    try {
      await api.patch(`/testimonials/${id}`, { isFeatured });
      loadTestimonials();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to update testimonial");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this testimonial?")) return;
    try {
      await api.delete(`/testimonials/${id}`);
      loadTestimonials();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to delete testimonial");
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Testimonials</h2>
      {message && <p className="text-sm">{message}</p>}

      {testimonials.length === 0 && (
        <p className="text-center text-muted-foreground py-6">No testimonials submitted yet.</p>
      )}

      <div className="grid gap-4">
        {testimonials.map((t) => (
          <Card key={t._id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{t.name}</h3>
                <div className="flex gap-1">
                  {t.isApproved && (
                    <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">
                      Approved
                    </span>
                  )}
                  {t.isFeatured && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{t.testimonial}</p>
              <div className="flex gap-2 flex-wrap pt-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleApprove(t._id, !t.isApproved)}
                >
                  {t.isApproved ? "Unapprove" : "Approve"}
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleFeature(t._id, !t.isFeatured)}
                >
                  {t.isFeatured ? "Unfeature" : "Feature"}
                </Button>
                <Button size="xs" variant="destructive" onClick={() => handleDelete(t._id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminTestimonials;
