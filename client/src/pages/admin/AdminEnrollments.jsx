import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Pagination from "@/components/common/Pagination";
import api from "@/services/api";

const editableFields = [
  // Personal Information
  "name",
  "fatherName",
  "fatherOccupation",
  "motherName",
  "motherOccupation",
  "dob",
  "category",
  "gender",
  // Contact Information
  "address",
  "pincode",
  "contactNo",
  "alternateNo",
  "branchName",
  // Education
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
];

const BOARD_OPTIONS = ["UP Board", "CBSE Board", "ICSE Board"];

const selectClass = "border rounded-md px-3 py-2 text-sm bg-background w-full";

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const Field = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    {children}
  </label>
);

const SectionHeading = ({ children }) => (
  <h4 className="text-sm font-medium pt-1">{children}</h4>
);

const ApplicationRow = ({ application, onChanged }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => {
    const initial = {};
    editableFields.forEach((key) => {
      initial[key] = key === "dob" ? toDateInput(application.dob) : application[key] || "";
    });
    return initial;
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  // A board outside the dropdown was entered through the "Other" option.
  const [boardIsOther, setBoardIsOther] = useState(
    () => Boolean(application.board) && !BOARD_OPTIONS.includes(application.board),
  );

  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const handleBoardChange = (e) => {
    const value = e.target.value;
    const isOther = value === "Other";
    setBoardIsOther(isOther);
    setForm((current) => ({ ...current, board: isOther ? "" : value }));
  };

  const isDraft = application.status === "draft";

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.patch(`/enrollment-applications/${application._id}`, form);
      setEditing(false);
      onChanged();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${application.student?.name}'s enrolment form?`)) return;
    try {
      await api.delete(`/enrollment-applications/${application._id}`);
      onChanged();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to delete");
    }
  };

  const handleDownload = async () => {
    const res = await api.get(`/enrollment-applications/${application._id}/download`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `enrolment-form-${application._id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              {application.student?.name}
              {isDraft && (
                <span className="text-[10px] uppercase tracking-wide border rounded px-1.5 py-0.5 text-muted-foreground">
                  Draft
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">{application.student?.email}</p>
            <p className="text-xs text-muted-foreground">
              {application.course?.title} · {isDraft ? "Started" : "Submitted"}{" "}
              {new Date(application.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="xs" variant="outline" onClick={() => setEditing(!editing)}>
              {editing ? "Hide" : "View / Edit"}
            </Button>
            <Button size="xs" variant="outline" onClick={handleDownload}>
              Download PDF
            </Button>
            <Button size="xs" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>

        {editing && (
          <div className="pt-3 border-t space-y-3">
            <SectionHeading>Personal Information</SectionHeading>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Name">
                <Input value={form.name} onChange={update("name")} />
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={form.dob} onChange={update("dob")} />
              </Field>
              <Field label="Father's Name">
                <Input value={form.fatherName} onChange={update("fatherName")} />
              </Field>
              <Field label="Father's Occupation">
                <Input value={form.fatherOccupation} onChange={update("fatherOccupation")} />
              </Field>
              <Field label="Mother's Name">
                <Input value={form.motherName} onChange={update("motherName")} />
              </Field>
              <Field label="Mother's Occupation">
                <Input value={form.motherOccupation} onChange={update("motherOccupation")} />
              </Field>
              <Field label="Category">
                <select className={selectClass} value={form.category} onChange={update("category")}>
                  <option value="">Not set</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </Field>
              <Field label="Gender">
                <select className={selectClass} value={form.gender} onChange={update("gender")}>
                  <option value="">Not set</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>

            <SectionHeading>Contact Information</SectionHeading>
            <Field label="Address">
              <Textarea value={form.address} onChange={update("address")} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Pin Code">
                <Input value={form.pincode} onChange={update("pincode")} />
              </Field>
              <Field label="Contact No.">
                <Input value={form.contactNo} onChange={update("contactNo")} />
              </Field>
              <Field label="Alternate No.">
                <Input value={form.alternateNo} onChange={update("alternateNo")} />
              </Field>
              <Field label="Branch Name">
                <Input value={form.branchName} onChange={update("branchName")} />
              </Field>
            </div>

            <SectionHeading>Education</SectionHeading>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Studying at">
                <select
                  className={selectClass}
                  value={form.educationLevel}
                  onChange={update("educationLevel")}
                >
                  <option value="">Not set</option>
                  <option value="School">School</option>
                  <option value="University">University / College</option>
                </select>
              </Field>

              {form.educationLevel === "School" && (
                <>
                  <Field label="School Name">
                    <Input value={form.schoolName} onChange={update("schoolName")} />
                  </Field>
                  <Field label="Class">
                    <Input value={form.class} onChange={update("class")} />
                  </Field>
                  <Field label="Board">
                    <select
                      className={selectClass}
                      value={boardIsOther ? "Other" : form.board}
                      onChange={handleBoardChange}
                    >
                      <option value="">Not set</option>
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
                      <Input value={form.board} onChange={update("board")} />
                    </Field>
                  )}
                  <Field label="Stream">
                    <Input value={form.stream} onChange={update("stream")} />
                  </Field>
                </>
              )}

              {form.educationLevel === "University" && (
                <>
                  <Field label="University Name">
                    <Input value={form.universityName} onChange={update("universityName")} />
                  </Field>
                  <Field label="Course">
                    <Input value={form.universityCourse} onChange={update("universityCourse")} />
                  </Field>
                  <Field label="Specialization">
                    <Input value={form.specialization} onChange={update("specialization")} />
                  </Field>
                  <Field label="Year / Passout">
                    <Input value={form.passingYear} onChange={update("passingYear")} />
                  </Field>
                </>
              )}

              <Field label="Next Year Plan">
                <Input value={form.nextYearPlan} onChange={update("nextYearPlan")} />
              </Field>
            </div>

            <SectionHeading>Documents</SectionHeading>
            <div className="flex gap-3 items-center">
              {application.photo && (
                <img
                  src={application.photo}
                  alt="Candidate"
                  className="w-16 h-16 object-cover rounded-md border"
                />
              )}
              {application.signature && (
                <img
                  src={application.signature}
                  alt="Signature"
                  className="h-12 object-contain border rounded-md px-2"
                />
              )}
              {application.guardianSignature && (
                <img
                  src={application.guardianSignature}
                  alt="Guardian signature"
                  className="h-12 object-contain border rounded-md px-2"
                />
              )}
            </div>

            {message && <p className="text-sm text-destructive">{message}</p>}
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AdminEnrollments = () => {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  // Debounced copy of `search` — matching happens server-side so it covers
  // every form, not just the page currently on screen.
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/enrollment-applications", {
        params: { page, limit: 10, ...(searchTerm ? { search: searchTerm } : {}) },
      });
      setApplications(res.data.applications);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load enrolment forms");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(search);
      // A new search starts from the first page of its own results.
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Deleting the last form on a page would otherwise leave the admin staring at
  // an empty page that no longer exists.
  const handleChanged = () => {
    if (applications.length === 1 && page > 1) {
      setPage(page - 1);
      return;
    }
    loadApplications();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <h2 className="text-lg font-semibold">Enrolment Forms</h2>
        <Input
          placeholder="Search by name, email, phone or course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4">
          {applications.map((application) => (
            <ApplicationRow
              key={application._id}
              application={application}
              onChanged={handleChanged}
            />
          ))}
          {applications.length === 0 && (
            <p className="text-center text-muted-foreground py-6">
              {searchTerm ? `No enrolment forms match "${searchTerm}".` : "No enrolment forms yet."}
            </p>
          )}

          <Pagination pagination={pagination} onPageChange={setPage} label="forms" />
        </div>
      )}
    </div>
  );
};

export default AdminEnrollments;
