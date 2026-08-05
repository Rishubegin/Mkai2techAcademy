import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { resolveMediaUrl } from "@/lib/utils";

// Same fallback-less pattern as before: gallery photos are real
// admin-managed data with no meaningful hardcoded placeholder, so the
// section simply doesn't render until real photos exist.
const GalleryCarousel = () => {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    api
      .get("/gallery/featured")
      .then((res) => {
        if (res.data.photos?.length > 0) {
          setPhotos(res.data.photos);
          return;
        }
        // Fall back to the general gallery if nothing's been marked
        // featured yet, so the section isn't empty the moment any photo exists.
        return api.get("/gallery", { params: { limit: 12 } }).then((r) => setPhotos(r.data.photos));
      })
      .catch(() => {});
  }, []);

  if (photos.length === 0) return null;

  // Duplicated so the strip can loop seamlessly at exactly -50% translation.
  const track = [...photos, ...photos];

  return (
    <section className="py-16 bg-light-blue/20 dark:bg-white/5">
      <div className="max-w-6xl mx-auto px-4 text-center space-y-3 mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-navy dark:text-white">
          Life at M Kai² Tech Academy
        </h2>
        <p className="text-sm text-muted-foreground">
          A glimpse into our classrooms, workshops, and events
        </p>
      </div>

      <div className="overflow-hidden group">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
          {track.map((photo, i) => (
            <div
              key={`${photo._id}-${i}`}
              className="w-56 sm:w-64 aspect-square mx-2 shrink-0 overflow-hidden rounded-xl border border-light-gold/40"
            >
              <img
                src={resolveMediaUrl(photo.image)}
                alt={photo.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-10">
        <Button asChild variant="outline">
          <Link to="/gallery">View Full Gallery</Link>
        </Button>
      </div>
    </section>
  );
};

export default GalleryCarousel;
