import { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/services/api";

const FacultyPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/teacher-profiles")
      .then((res) => setTeachers(res.data.profiles || []))
      .catch((err) => setError(err.response?.data?.message || "Failed to load faculty"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-navy dark:text-white">Our Faculty</h1>
        <p className="text-muted-foreground mt-2">
          Meet the mentors guiding every batch at M Kai² Tech Academy
        </p>
      </div>

      {loading && <p className="text-center text-muted-foreground">Loading...</p>}
      {error && <p className="text-center text-destructive">{error}</p>}
      {!loading && !error && teachers.length === 0 && (
        <p className="text-center text-muted-foreground">No faculty profiles yet.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teachers.map((teacher) => (
          <Card key={teacher._id} className="h-full">
            <CardContent className="p-6 text-center space-y-3">
              <Avatar
                src={teacher.photo || undefined}
                alt={teacher.user?.name}
                sx={{
                  width: 96,
                  height: 96,
                  mx: "auto",
                  bgcolor: "var(--brand-navy)",
                  color: "var(--brand-gold)",
                  fontSize: 34,
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
                <div className="flex flex-wrap justify-center gap-1.5">
                  {teacher.specialization.map((spec) => (
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

              {teacher.bio && (
                <p className="text-sm text-muted-foreground text-left pt-1">{teacher.bio}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FacultyPage;
