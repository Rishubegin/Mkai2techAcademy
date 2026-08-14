import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import NoticeBanner from "@/components/common/NoticeBanner";
import api from "@/services/api";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [testimonialText, setTestimonialText] = useState("");
  const [testimonialMessage, setTestimonialMessage] = useState("");
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);

  const [certificates, setCertificates] = useState([]);
  const [applications, setApplications] = useState([]);

  const loadEnrollments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`/students/${user._id}/enrollments`);
      setEnrollments(res.data.enrollments);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your courses");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  useEffect(() => {
    api
      .get("/certificates/my")
      .then((res) => setCertificates(res.data.certificates))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get("/enrollment-applications/my")
      .then((res) => setApplications(res.data.applications))
      .catch(() => {});
  }, []);

  const handleDownloadApplication = async (applicationId) => {
    const res = await api.get(`/enrollment-applications/${applicationId}/download`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `enrolment-form-${applicationId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadCertificate = async (certificateId) => {
    const res = await api.get(`/certificates/${certificateId}/download`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${certificateId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmitTestimonial = async (e) => {
    e.preventDefault();
    setSubmittingTestimonial(true);
    setTestimonialMessage("");
    try {
      await api.post("/testimonials", { testimonial: testimonialText });
      setTestimonialMessage("Thanks for sharing! It'll appear on our homepage once approved.");
      setTestimonialText("");
    } catch (err) {
      setTestimonialMessage(err.response?.data?.Error || "Failed to submit");
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <NoticeBanner />

      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.name?.split(" ")[0]}</h1>
        <p className="text-muted-foreground">
          {user?.email} · {user?.phone || "No phone on file"}
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">My Courses</h2>

        {loading && <p className="text-muted-foreground">Loading...</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && enrollments.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-muted-foreground">
                You're not enrolled in any courses yet.
              </p>
              <Button asChild>
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {enrollments.map((enrollment) => (
            <Card key={enrollment._id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{enrollment.course?.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {enrollment.progressPercent}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {enrollment.course?.category} ({enrollment.course?.mode})
                </p>
                {enrollment.enrolledAt && (
                  <p className="text-xs text-muted-foreground">
                    Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </p>
                )}
                <div className="flex gap-2">
                  {enrollment.course?._id && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/courses/${enrollment.course._id}`}>View Course</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {certificates.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Certificates</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {certificates.map((cert) => (
              <Card key={cert._id}>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-medium">{cert.course?.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Completed {new Date(cert.completionDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">ID: {cert.certificateId}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadCertificate(cert.certificateId)}
                  >
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {applications.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Enrolment Forms</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {applications.map((app) => (
              <Card key={app._id}>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-medium">{app.course?.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {app.status === "draft"
                      ? `Not submitted yet · saved ${new Date(app.updatedAt).toLocaleDateString()}`
                      : `Submitted ${new Date(app.createdAt).toLocaleDateString()}`}
                  </p>
                  {app.status === "draft" ? (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/courses/${app.course?._id}/enroll`}>Continue Form</Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadApplication(app._id)}
                    >
                      Download Form (PDF)
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Share Your Story</h2>
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmitTestimonial} className="space-y-3">
              <Textarea
                placeholder="Tell future students about your experience..."
                value={testimonialText}
                onChange={(e) => setTestimonialText(e.target.value)}
                required
                minLength={10}
              />
              {testimonialMessage && <p className="text-sm">{testimonialMessage}</p>}
              <Button type="submit" size="sm" disabled={submittingTestimonial}>
                {submittingTestimonial ? "Submitting..." : "Submit Testimonial"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
