import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/services/api";
import { resolveMediaUrl } from "@/lib/utils";

const emptyForm = { title: "", description: "", category: "General", file: null };

const AdminGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/gallery");
      setPhotos(res.data.photos);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load gallery photos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.file) {
      setMessage("Please choose an image");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("image", form.file);

      await api.post("/gallery", formData);
      setMessage("Photo uploaded successfully");
      setForm(emptyForm);
      setShowForm(false);
      loadPhotos();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleToggleFeature = async (id) => {
    try {
      await api.patch(`/gallery/${id}/feature`);
      loadPhotos();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to toggle feature");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this photo?")) return;
    try {
      await api.delete(`/gallery/${id}`);
      loadPhotos();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to delete photo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Gallery</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Upload Photo"}
        </Button>
      </div>

      {message && <p className="text-sm">{message}</p>}

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleUpload} className="grid sm:grid-cols-2 gap-4">
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <Input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="sm:col-span-2"
              />
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                className="sm:col-span-2"
                required
              />
              <Button type="submit" disabled={uploading} className="sm:col-span-2">
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card key={photo._id} className="overflow-hidden">
              <div className="aspect-square">
                <img
                  src={resolveMediaUrl(photo.image)}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-medium truncate">{photo.title}</p>
                  {photo.isFeatured && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{photo.category}</p>
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleToggleFeature(photo._id)}
                  >
                    {photo.isFeatured ? "Unfeature" : "Feature"}
                  </Button>
                  <Button size="xs" variant="destructive" onClick={() => handleDelete(photo._id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {photos.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-6">
              No photos uploaded yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
