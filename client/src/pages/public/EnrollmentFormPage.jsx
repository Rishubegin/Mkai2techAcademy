import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";

const emptyForm = {
  // Personal Information
  name: "",
  fatherName: "",
  fatherOccupation: "",
  motherName: "",
  motherOccupation: "",
  dob: "",
  category: "General",
  gender: "Male",
  // Contact Information
  address: "",
  pincode: "",
  contactNo: "",
  alternateNo: "",
  branchName: "Sugamau",
  // Education
  educationLevel: "",
  schoolName: "",
  class: "",
  board: "",
  stream: "",
  universityName: "",
  universityCourse: "",
  specialization: "",
  passingYear: "",
  nextYearPlan: "",
};

// Must match SECTION_FIELDS in server/src/controllers/enrollmentApplication.js —
// a section save only sends its own fields so it can't overwrite the others.
const SECTION_FIELDS = {
  personal: [
    "name",
    "fatherName",
    "fatherOccupation",
    "motherName",
    "motherOccupation",
    "dob",
    "category",
    "gender",
  ],
  contact: ["address", "pincode", "contactNo", "alternateNo", "branchName"],
  education: [
    "educationLevel",
    "schoolName",
    "class",
    "board",
    "stream",
    "universityName",
    "universityCourse",
    "specialization",
    "passingYear",
    "nextYearPlan",
  ],
};

const BOARD_OPTIONS = ["UP Board", "CBSE Board", "ICSE Board"];

const selectClass = "border rounded-md px-3 py-2 text-sm bg-background w-full";

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const Field = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    {children}
  </label>
);

const FormSection = ({ title, description, state, onSave, children }) => (
  <div className="border rounded-lg p-4 space-y-3">
    <div>
      <h3 className="font-medium">{title}</h3>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>

    {children}

    <div className="flex items-center gap-3 pt-1">
      <Button type="button" size="sm" variant="outline" onClick={onSave} disabled={state?.saving}>
        {state?.saving ? "Saving..." : "Save"}
      </Button>
      {state?.message && <span className="text-xs text-muted-foreground">{state.message}</span>}
      {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
    </div>
  </div>
);

const EnrollmentFormPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState({ ...emptyForm, name: user?.name || "" });
  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);
  const [guardianSignature, setGuardianSignature] = useState(null);
  // Documents already uploaded by a previous "Save" on the Documents section.
  const [savedDocs, setSavedDocs] = useState({ photo: "", signature: "", guardianSignature: "" });
  // Remounts the file inputs after a save so they don't keep showing a filename
  // for a file that has already been uploaded.
  const [docsKey, setDocsKey] = useState(0);
  // "Other" isn't stored — a board outside the dropdown is saved under its own
  // name, so a saved value that isn't a known option means "Other" was picked.
  const [boardIsOther, setBoardIsOther] = useState(false);
  const [sectionState, setSectionState] = useState({});

  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [applicationId, setApplicationId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get(`/courses/${courseId}`),
      // A saved draft is optional — a first-time applicant simply has none.
      api.get(`/enrollment-applications/my/${courseId}`).catch(() => null),
    ])
      .then(([courseRes, savedRes]) => {
        if (cancelled) return;
        setCourse(courseRes.data.course);

        const saved = savedRes?.data?.application;
        if (!saved) return;

        const prefilled = { ...emptyForm };
        Object.keys(emptyForm).forEach((key) => {
          if (saved[key] === undefined || saved[key] === null) return;
          prefilled[key] = key === "dob" ? toDateInput(saved.dob) : saved[key];
        });
        prefilled.name = prefilled.name || user?.name || "";

        setForm(prefilled);
        setBoardIsOther(Boolean(saved.board) && !BOARD_OPTIONS.includes(saved.board));
        setSavedDocs({
          photo: saved.photo || "",
          signature: saved.signature || "",
          guardianSignature: saved.guardianSignature || "",
        });
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.response?.data?.message || "Course not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // user is only used to seed an empty name field, so it isn't a reload trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const setSection = (key, value) =>
    setSectionState((current) => ({ ...current, [key]: { ...current[key], ...value } }));

  const handleBoardChange = (e) => {
    const value = e.target.value;
    const isOther = value === "Other";
    setBoardIsOther(isOther);
    setForm((current) => ({ ...current, board: isOther ? "" : value }));
  };

  const educationError = () => {
    if (!form.educationLevel) {
      return "Please choose whether you are studying in a school or a university";
    }
    const required =
      form.educationLevel === "School"
        ? { schoolName: "school name", class: "class", board: "board" }
        : {
            universityName: "university name",
            universityCourse: "course",
            passingYear: "year/passout",
          };

    const missing = Object.entries(required).find(([field]) => !form[field]);
    return missing ? `Please fill in your ${missing[1]}` : "";
  };

  const saveSection = async (key) => {
    setSection(key, { saving: true, message: "", error: "" });

    const formData = new FormData();
    formData.append("courseId", courseId);

    if (key === "documents") {
      if (!photo && !signature && !guardianSignature) {
        setSection(key, { saving: false, error: "Choose a file before saving" });
        return;
      }
      if (photo) formData.append("photo", photo);
      if (signature) formData.append("signature", signature);
      if (guardianSignature) formData.append("guardianSignature", guardianSignature);
    } else {
      SECTION_FIELDS[key].forEach((field) => formData.append(field, form[field] ?? ""));
    }

    try {
      const res = await api.post("/enrollment-applications/draft", formData);
      const saved = res.data.application;

      if (key === "documents") {
        setSavedDocs({
          photo: saved.photo || "",
          signature: saved.signature || "",
          guardianSignature: saved.guardianSignature || "",
        });
        // Uploaded now, so the final submit doesn't have to send them again.
        setPhoto(null);
        setSignature(null);
        setGuardianSignature(null);
        setDocsKey((current) => current + 1);
      }

      setSection(key, { saving: false, message: "Saved" });
    } catch (err) {
      setSection(key, {
        saving: false,
        error: err.response?.data?.Error || "Failed to save this section",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const educationMessage = educationError();
    if (educationMessage) {
      setError(educationMessage);
      return;
    }
    if (!photo && !savedDocs.photo) {
      setError("Please upload the candidate's photo");
      return;
    }
    if (!signature && !savedDocs.signature) {
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
      formData.append("courseId", courseId);
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      formData.append("appliedCourse", course?.title || "");
      formData.append("declarationAccepted", "true");
      // Only send files that haven't already been uploaded by a section save.
      if (photo) formData.append("photo", photo);
      if (signature) formData.append("signature", signature);
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
                Applying for <strong>{course.title}</strong>. Save each section as you go — you
                can come back and finish later.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <FormSection
                  title="Personal Information"
                  state={sectionState.personal}
                  onSave={() => saveSection("personal")}
                >
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Name">
                      <Input value={form.name} onChange={set("name")} required />
                    </Field>
                    <Field label="Date of Birth">
                      <Input type="date" value={form.dob} onChange={set("dob")} />
                    </Field>
                    <Field label="Father's Name">
                      <Input value={form.fatherName} onChange={set("fatherName")} />
                    </Field>
                    <Field label="Father's Occupation">
                      <Input value={form.fatherOccupation} onChange={set("fatherOccupation")} />
                    </Field>
                    <Field label="Mother's Name">
                      <Input value={form.motherName} onChange={set("motherName")} />
                    </Field>
                    <Field label="Mother's Occupation">
                      <Input value={form.motherOccupation} onChange={set("motherOccupation")} />
                    </Field>
                    <Field label="Category">
                      <select className={selectClass} value={form.category} onChange={set("category")}>
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                      </select>
                    </Field>
                    <Field label="Gender">
                      <select className={selectClass} value={form.gender} onChange={set("gender")}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </Field>
                  </div>
                </FormSection>

                <FormSection
                  title="Contact Information"
                  state={sectionState.contact}
                  onSave={() => saveSection("contact")}
                >
                  <Field label="Address">
                    <Textarea value={form.address} onChange={set("address")} />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Pin Code">
                      <Input value={form.pincode} onChange={set("pincode")} />
                    </Field>
                    <Field label="Contact No.">
                      <Input value={form.contactNo} onChange={set("contactNo")} required />
                    </Field>
                    <Field label="Alternate No.">
                      <Input value={form.alternateNo} onChange={set("alternateNo")} />
                    </Field>
                    <Field label="Branch Name">
                      <Input value={form.branchName} onChange={set("branchName")} />
                    </Field>
                  </div>
                </FormSection>

                <FormSection
                  title="Education"
                  description="Tell us where you are studying right now."
                  state={sectionState.education}
                  onSave={() => saveSection("education")}
                >
                  <Field label="Are you studying in a school or a university?">
                    <select
                      className={selectClass}
                      value={form.educationLevel}
                      onChange={set("educationLevel")}
                    >
                      <option value="">Select...</option>
                      <option value="School">School</option>
                      <option value="University">University / College</option>
                    </select>
                  </Field>

                  {form.educationLevel === "School" && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="School Name">
                        <Input value={form.schoolName} onChange={set("schoolName")} />
                      </Field>
                      <Field label="Class">
                        <Input value={form.class} onChange={set("class")} />
                      </Field>
                      <Field label="Board">
                        <select
                          className={selectClass}
                          value={boardIsOther ? "Other" : form.board}
                          onChange={handleBoardChange}
                        >
                          <option value="">Select board...</option>
                          {BOARD_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                      </Field>
                      {boardIsOther && (
                        <Field label="Board Name">
                          <Input
                            placeholder="Enter your board"
                            value={form.board}
                            onChange={set("board")}
                          />
                        </Field>
                      )}
                      <Field label="Stream (optional)">
                        <Input value={form.stream} onChange={set("stream")} />
                      </Field>
                    </div>
                  )}

                  {form.educationLevel === "University" && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="University Name">
                        <Input value={form.universityName} onChange={set("universityName")} />
                      </Field>
                      <Field label="Course">
                        <Input value={form.universityCourse} onChange={set("universityCourse")} />
                      </Field>
                      <Field label="Specialization (optional)">
                        <Input value={form.specialization} onChange={set("specialization")} />
                      </Field>
                      <Field label="Year / Passout">
                        <Input
                          placeholder="e.g. 2nd Year or 2024"
                          value={form.passingYear}
                          onChange={set("passingYear")}
                        />
                      </Field>
                    </div>
                  )}

                  <Field label="Next Year Plan">
                    <Input value={form.nextYearPlan} onChange={set("nextYearPlan")} />
                  </Field>
                </FormSection>

                <FormSection
                  title="Documents"
                  description="Upload a clear photo and signature."
                  state={sectionState.documents}
                  onSave={() => saveSection("documents")}
                >
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Field label="Candidate Photo">
                      <Input
                        key={`photo-${docsKey}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhoto(e.target.files[0])}
                      />
                      {savedDocs.photo && (
                        <img
                          src={savedDocs.photo}
                          alt="Saved candidate"
                          className="mt-2 w-16 h-16 object-cover rounded-md border"
                        />
                      )}
                    </Field>
                    <Field label="Candidate Signature">
                      <Input
                        key={`signature-${docsKey}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSignature(e.target.files[0])}
                      />
                      {savedDocs.signature && (
                        <img
                          src={savedDocs.signature}
                          alt="Saved signature"
                          className="mt-2 h-12 object-contain border rounded-md px-2"
                        />
                      )}
                    </Field>
                    <Field label="Parent's/Guardian's Signature (optional)">
                      <Input
                        key={`guardian-${docsKey}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setGuardianSignature(e.target.files[0])}
                      />
                      {savedDocs.guardianSignature && (
                        <img
                          src={savedDocs.guardianSignature}
                          alt="Saved guardian signature"
                          className="mt-2 h-12 object-contain border rounded-md px-2"
                        />
                      )}
                    </Field>
                  </div>
                </FormSection>

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
