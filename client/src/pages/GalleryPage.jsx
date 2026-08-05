import { useEffect, useState } from "react";
import api from "@/services/api";
import { resolveMediaUrl } from "@/lib/utils";

const GalleryPage = () => {
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  useEffect(() => {
    api.get("/gallery/categories").then((res) => setCategories(res.data.categories));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get("/gallery", { params: category ? { category } : {} })
      .then((res) => setPhotos(res.data.photos))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Gallery</h1>
        <p className="text-muted-foreground">
          Moments from our classrooms, workshops, and events.
        </p>
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setCategory("")}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              category === ""
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input hover:bg-muted"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                category === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-center text-muted-foreground">Loading...</p>}
      {!loading && photos.length === 0 && (
        <p className="text-center text-muted-foreground">No photos in the gallery yet.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo) => (
          <button
            key={photo._id}
            onClick={() => setLightboxPhoto(photo)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-light-gold/40 hover:border-gold transition-colors cursor-pointer"
          >
            <img
              src={resolveMediaUrl(photo.image)}
              alt={photo.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <span className="absolute inset-x-0 bottom-0 bg-navy/70 text-white text-xs px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {photo.title}
            </span>
          </button>
        ))}
      </div>

      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="max-w-3xl w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={resolveMediaUrl(lightboxPhoto.image)}
              alt={lightboxPhoto.title}
              className="w-full max-h-[75vh] object-contain rounded-lg"
            />
            <div className="text-white text-center">
              <p className="font-medium">{lightboxPhoto.title}</p>
              {lightboxPhoto.description && (
                <p className="text-sm text-white/70">{lightboxPhoto.description}</p>
              )}
            </div>
            <button
              onClick={() => setLightboxPhoto(null)}
              className="block mx-auto text-white/80 hover:text-white text-sm underline cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
