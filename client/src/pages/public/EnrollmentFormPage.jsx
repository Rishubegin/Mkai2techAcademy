import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";

const emptyForm = {
  name: "",
  fatherName: "",
  fatherOccupation: "",
  motherName: "",
  motherOccupation: "",
  dob: "",
  category: "General",
  gender: "Male",
  address: "",
  pincode: "",
  class: "",
  board: "",
  stream: "",
  contactNo: "",
  alternateNo: "",
  branchName: "Sugamau",
  nextYearPlan: "",
};

const EnrollmentFormPage = () => {
  const { courseId, batchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState({ ...emptyForm, name: user?.name || "" });
  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);
  const [guardianSignature, setGuardianSignature] = useState(null);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [applicationId, setApplicationId] = useState(null);

  useEffect(() => {
    api
      .get(`/courses/${courseId}`)
      .then((res) => setCourse(res.data.course))
      .catch((err) => setLoadError(err.response?.data?.message || "Course not found"))
      .finally(() => setLoading(false));
  }, [courseId]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!photo) {
      setError("Please upload the candidate's photo");
      return;
    }
    if (!signature) {
      setError("Please upload the candidate's signature");
      return;
    }
    if (!declarationAccepted) {
      setError("You must accept the declaration to submit this form");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("batchId", batchId);
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      formData.append("appliedCourse", course?.title || "");
      formData.append("declarationAccepted", "true");
      formData.append("photo", photo);
      formData.append("signature", signature);
      if (guardianSignature) formData.append("guardianSignature", guardianSignature);

      const res = await api.post("/enrollment-applications", formData);
      setApplicationId(res.data.application._id);
    } catch (err) {
      setError(err.response?.data?.Error || err.response?.data?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
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

  if (loading) {
    return <p className="text-center py-20 text-muted-foreground">Loading...</p>;
  }

  if (loadError || !course) {
    return <p className="text-center py-20 text-destructive">{loadError}</p>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card>
        <CardContent className="p-6">
          {applicationId ? (
            <div className="text-center space-y-4 py-6">
              <h2 className="text-xl font-semibold">Application Submitted!</h2>
              <p className="text-muted-foreground">
                You're enrolled in <strong>{course.title}</strong>. You can download your
                enrolment form below.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={handleDownload}>Download Enrolment Form (PDF)</Button>
                <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>
                  Back to Course
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Link
                to={`/courses/${courseId}`}
                className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
              >
                ← Back to course
              </Link>
              <h2 className="text-xl font-semibold mb-1">Enrolment Form</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Applying for <strong>{course.title}</strong>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input placeholder="Name" value={form.name} onChange={set("name")} required />
                  <Input
                    placeholder="Father's Name"
                    value={form.fatherName}
                    onChange={set("fatherName")}
                  />
                  <Input
                    placeholder="Father's Occupation"
                    value={form.fatherOccupation}
                    onChange={set("fatherOccupation")}
                  />
                  <Input
                    placeholder="Mother's Name"
                    value={form.motherName}
                    onChange={set("motherName")}
                  />
                  <Input
                    placeholder="Mother's Occupation"
                    value={form.motherOccupation}
                    onChange={set("motherOccupation")}
                  />
                  <Input type="date" placeholder="Date of Birth" value={form.dob} onChange={set("dob")} />
                  <select
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={form.category}
                    onChange={set("category")}
                  >
                    <option value="General">Category: General</option>
                    <option value="OBC">Category: OBC</option>
                    <option value="SC">Category: SC</option>
                    <option value="ST">Category: ST</option>
                  </select>
                  <select
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={form.gender}
                    onChange={set("gender")}
                  >
                    <option value="Male">Gender: Male</option>
                    <option value="Female">Gender: Female</option>
                    <option value="Other">Gender: Other</option>
                  </select>
                </div>

                <Textarea placeholder="Address" value={form.address} onChange={set("address")} />
                <Input placeholder="Pin Code" value={form.pincode} onChange={set("pincode")} />

                <div className="grid sm:grid-cols-3 gap-3">
                  <Input placeholder="Class" value={form.class} onChange={set("class")} />
                  <Input placeholder="Board" value={form.board} onChange={set("board")} />
                  <Input placeholder="Stream" value={form.stream} onChange={set("stream")} />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Contact No."
                    value={form.contactNo}
                    onChange={set("contactNo")}
                    required
                  />
                  <Input
                    placeholder="Alternate No."
                    value={form.alternateNo}
                    onChange={set("alternateNo")}
                  />
                  <Input
                    placeholder="Branch Name"
                    value={form.branchName}
                    onChange={set("branchName")}
                  />
                  <Input
                    placeholder="Next Year Plan"
                    value={form.nextYearPlan}
                    onChange={set("nextYearPlan")}
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Candidate Photo
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhoto(e.target.files[0])}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Candidate Signature
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSignature(e.target.files[0])}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      Parent's/Guardian's Signature (optional)
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setGuardianSignature(e.target.files[0])}
                    />
                  </div>
                </div>

                <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Declaration by Applicant</p>
                  <p>
                    I hereby declare that I have read and understood the terms and conditions of
                    eligibility for this course. In the event any information is found incorrect
                    or misleading, my candidature shall be liable to cancellation by the
                    Organization, and I accept the rules of the Organization.
                  </p>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={declarationAccepted}
                      onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    />
                    <span>I accept the declaration above</span>
                  </label>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit & Enroll"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnrollmentFormPage;
