import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

const SyllabusAccordion = ({ syllabus }) => {
  const [openFlags, setOpenFlags] = useState(() => syllabus.map(() => true));

  const toggle = (idx) =>
    setOpenFlags((flags) => flags.map((flag, i) => (i === idx ? !flag : flag)));

  return (
    <div className="space-y-3">
      {syllabus.map((mod, idx) => {
        const isOpen = openFlags[idx];
        return (
          <Card key={idx} className="overflow-hidden py-0">
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gold text-navy text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                {mod.title}
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                {mod.topics.length} episode{mod.topics.length === 1 ? "" : "s"}
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            {isOpen && (
              <div className="border-t divide-y">
                {mod.topics.map((topic, i) => (
                  <div key={i} className="px-4 py-3">
                    <span className="text-sm">{topic}</span>
                  </div>
                ))}
                {mod.topics.length === 0 && (
                  <p className="px-4 py-3 text-sm text-muted-foreground">
                    No episodes added yet.
                  </p>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [batches, setBatches] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewMessage, setReviewMessage] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [courseRes, batchesRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/batches`),
      ]);
      setCourse(courseRes.data.course);
      setBatches(batchesRes.data.batches);
    } catch (err) {
      setError(err.response?.data?.message || "Course not found");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user) {
      setMaterials([]);
      return;
    }
    api
      .get(`/materials/course/${courseId}`)
      .then((res) => setMaterials(res.data.materials))
      .catch(() => setMaterials([]));
  }, [user, courseId]);

  const loadReviews = useCallback(() => {
    api
      .get(`/reviews/course/${courseId}`)
      .then((res) => {
        setReviews(res.data.reviews);
        setReviewStats(res.data.stats);
      })
      .catch(() => {
        setReviews([]);
      });
  }, [courseId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const isEnrolledInThisCourse =
    user && batches.some((b) => b.students?.some((s) => (s.student?._id || s.student) === user._id));
  const hasReviewed = user && reviews.some((r) => r.student?._id === user._id);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewMessage("");
    try {
      await api.post("/reviews", { courseId, ...reviewForm });
      setReviewMessage("Review submitted, thank you!");
      setReviewForm({ rating: 5, comment: "" });
      loadReviews();
    } catch (err) {
      setReviewMessage(err.response?.data?.message || err.response?.data?.Error || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDownload = async (material) => {
    setDownloadingId(material._id);
    try {
      const res = await api.get(`/materials/${material._id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", material.originalFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setActionMessage("Failed to download material");
    } finally {
      setDownloadingId(null);
    }
  };

  // Navigates to the full-page enrolment form for a batch. The route itself
  // is wrapped in ProtectedRoute, which redirects an anonymous visitor to
  // login/signup with a `redirect` back to this exact URL, then continues
  // here automatically once they're authenticated.
  const handleOpenEnrollForm = (batchId) => {
    navigate(`/courses/${courseId}/enroll/${batchId}`);
  };

  const scrollToBatches = () => {
    document.getElementById("batches")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return <p className="text-center py-20 text-muted-foreground">Loading...</p>;
  }

  if (error || !course) {
    return <p className="text-center py-20 text-destructive">{error}</p>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header — full width, always first */}
      <div className="mb-8">
        <span className="text-xs font-medium bg-gold text-navy px-2 py-1 rounded-full">
          {course.category} · {course.mode}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold mt-3 text-navy dark:text-white">
          {course.title}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">{course.description}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Body — order-3 on mobile (after the enroll card), left column on desktop */}
        <div className="order-3 lg:order-1 lg:col-span-2 space-y-10">
          {/* Syllabus */}
          {course.syllabus?.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Syllabus</h2>
              <SyllabusAccordion syllabus={course.syllabus} />
            </div>
          )}

          {course.instructor && (
            <Card className="bg-light-blue border-light-blue dark:bg-accent dark:border-accent overflow-hidden py-0">
              <CardContent className="p-0 grid sm:grid-cols-[160px_1fr]">
                {course.instructor.photo ? (
                  <img
                    src={course.instructor.photo}
                    alt={course.instructor.user?.name || "Instructor"}
                    className="w-full h-40 sm:h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-40 sm:h-full bg-navy flex items-center justify-center text-white text-3xl font-semibold">
                    {course.instructor.user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-1 text-navy dark:text-white">
                    {course.instructor.user?.name || "Instructor"}
                  </h2>
                  <p className="text-sm">{course.instructor.qualification}</p>
                  {course.instructor.specialization?.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Specialization: {course.instructor.specialization.join(", ")}
                    </p>
                  )}
                  {course.instructor.bio && (
                    <p className="text-sm text-muted-foreground mt-2">{course.instructor.bio}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Materials (only visible to enrolled students / admin) */}
          {user && materials.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Course Materials</h2>
              <div className="space-y-2">
                {materials.map((material) => (
                  <Card key={material._id}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{material.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {material.module && `${material.module} · `}
                          {material.fileType?.toUpperCase()} ·{" "}
                          {(material.fileSize / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={downloadingId === material._id}
                        onClick={() => handleDownload(material)}
                      >
                        {downloadingId === material._id ? "Downloading..." : "Download"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Batches / Enrollment */}
          <div id="batches" className="scroll-mt-24">
            <h2 className="text-xl font-semibold mb-4">Available Batches</h2>

            {actionMessage && <p className="text-sm mb-4">{actionMessage}</p>}

            {batches.length === 0 && (
              <p className="text-sm text-muted-foreground">No batches scheduled yet.</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {batches.map((batch) => {
                const filled = batch.students?.length || 0;
                const isFull = filled >= batch.capacity;
                const alreadyEnrolled =
                  user && batch.students?.some((s) => (s.student?._id || s.student) === user._id);

                return (
                  <Card key={batch._id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{batch.batchName}</h3>
                        <span className="text-xs text-muted-foreground">{batch.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Seats: {filled}/{batch.capacity}
                      </p>

                      {user && user.role !== "student" ? null : alreadyEnrolled ? (
                        <Button size="sm" className="w-full" disabled>
                          Already Enrolled
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={isFull}
                          onClick={() => handleOpenEnrollForm(batch._id)}
                        >
                          {isFull ? "Batch Full" : "Enroll Now"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Student Reviews</h2>
              {reviewStats.totalReviews > 0 && (
                <span className="text-sm text-muted-foreground">
                  <span className="text-gold">★</span> {reviewStats.averageRating} (
                  {reviewStats.totalReviews} review
                  {reviewStats.totalReviews === 1 ? "" : "s"})
                </span>
              )}
            </div>

            {reviews.length === 0 && (
              <p className="text-sm text-muted-foreground mb-4">No reviews yet.</p>
            )}

            <div className="space-y-3 mb-6">
              {reviews.map((review) => (
                <Card key={review._id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{review.student?.name || "Student"}</p>
                      <span className="text-xs">
                        <span className="text-gold">{"★".repeat(review.rating)}</span>
                        <span className="text-muted-foreground">
                          {"☆".repeat(5 - review.rating)}
                        </span>
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {isEnrolledInThisCourse && !hasReviewed && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3">Leave a review</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                          aria-label={`Rate ${n} stars`}
                        >
                          <Star
                            size={20}
                            className={
                              n <= reviewForm.rating
                                ? "fill-gold text-gold"
                                : "text-medium-gray"
                            }
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      placeholder="Share your experience with this course (optional)"
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    />
                    {reviewMessage && <p className="text-sm">{reviewMessage}</p>}
                    <Button type="submit" size="sm" disabled={submittingReview}>
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Enroll card — order-2 on mobile (right after the heading), sticky right column on desktop */}
        <div className="order-2 lg:order-2 lg:sticky lg:top-24">
          <Card className="overflow-hidden py-0">
            {course.image ? (
              <img
                src={course.image}
                alt={course.title}
                className="w-full aspect-video object-cover"
              />
            ) : (
              <div className="w-full aspect-video bg-navy flex items-center justify-center">
                <span className="text-white/60 text-sm">No image yet</span>
              </div>
            )}
            <CardContent className="p-6 space-y-4">
              <Button size="lg" className="w-full" onClick={scrollToBatches}>
                Enroll Now
              </Button>

              {course.highlights?.length > 0 && (
                <ul className="space-y-2 pt-2">
                  {course.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 size={18} className="text-gold shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
