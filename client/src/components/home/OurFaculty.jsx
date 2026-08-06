import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

// Same fallback-less pattern as GalleryPreview: faculty profiles are real
// admin-managed data with no meaningful hardcoded placeholder, so the
// section simply doesn't render until at least one teacher profile exists.
const OurFaculty = () => {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    api
      .get("/teacher-profiles")
      .then((res) => setTeachers(res.data.profiles?.slice(0, 4) || []))
      .catch(() => {});
  }, []);

  if (teachers.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold text-navy dark:text-white">
          Our Faculty
        </h2>
        <p className="text-sm text-muted-foreground">
          Learn from mentors who've been where you're headed
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {teachers.map((teacher) => (
          <div
            key={teacher._id}
            className="rounded-2xl border border-gold/30 bg-card p-6 text-center space-y-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-lg"
          >
            <Avatar
              src={teacher.photo || undefined}
              alt={teacher.user?.name}
              sx={{
                width: 88,
                height: 88,
                mx: "auto",
                bgcolor: "var(--brand-navy)",
                color: "var(--brand-gold)",
                fontSize: 32,
                fontWeight: 600,
              }}
            >
              {teacher.user?.name?.[0]?.toUpperCase()}
            </Avatar>

            <div>
              <p className="font-semibold text-navy dark:text-white">{teacher.user?.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{teacher.qualification}</p>
              {teacher.experience && (
                <p className="text-xs text-muted-foreground">{teacher.experience} experience</p>
              )}
            </div>

            {teacher.specialization?.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {teacher.specialization.slice(0, 3).map((spec) => (
                  <Chip
                    key={spec}
                    label={spec}
                    size="small"
                    sx={{
                      bgcolor: "var(--brand-light-gold)",
                      color: "var(--brand-navy)",
                      fontWeight: 500,
                      fontSize: "0.7rem",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Button asChild variant="outline">
          <Link to="/faculty">View All Faculty</Link>
        </Button>
      </div>
    </section>
  );
};

export default OurFaculty;
