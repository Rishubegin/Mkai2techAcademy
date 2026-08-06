import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/services/api";
import { resolveMediaUrl, COURSE_PLACEHOLDER_IMAGE } from "@/lib/utils";

const CoursesPage = () => {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [mode, setMode] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/courses/categories")
      .then((res) => setCategories(res.data.categories))
      .catch(() => setCategories([]));
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (keyword.trim()) {
        const res = await api.get("/courses/search", { params: { keyword } });
        setCourses(res.data.courses);
      } else {
        const params = {};
        if (category) params.category = category;
        if (mode) params.mode = mode;
        const res = await api.get("/courses", { params });
        setCourses(res.data.courses);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [category, mode, keyword]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Explore Our Courses</h1>
        <p className="text-muted-foreground">
          School academics, competitive exams, computer skills, and programming.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Input
          type="text"
          placeholder="Search courses..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="sm:max-w-xs"
        />

        <select
          className="border rounded-md px-3 py-2 text-sm bg-background"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="border rounded-md px-3 py-2 text-sm bg-background"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="">All Modes</option>
          <option value="Offline">Offline</option>
          <option value="Online">Online</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>

      {loading && <p className="text-center text-muted-foreground">Loading courses...</p>}
      {error && <p className="text-center text-destructive">{error}</p>}

      {!loading && !error && courses.length === 0 && (
        <p className="text-center text-muted-foreground">No courses found.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card
            key={course._id}
            className="group flex flex-col gap-0 overflow-hidden rounded-2xl border-gold/30 py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-xl"
          >
            <div className="h-44 w-full shrink-0 overflow-hidden">
              <img
                src={resolveMediaUrl(course.image) || COURSE_PLACEHOLDER_IMAGE}
                alt={course.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            </div>

            <CardContent className="flex flex-1 flex-col justify-between gap-4 p-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium bg-gold text-navy px-2 py-1 rounded-full">
                    {course.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{course.mode}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-navy dark:text-white">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {course.description}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-maroon dark:text-primary">
                  ₹{course.fees}
                </span>
                <Button asChild variant="outline">
                  <Link to={`/courses/${course._id}`}>View Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;
