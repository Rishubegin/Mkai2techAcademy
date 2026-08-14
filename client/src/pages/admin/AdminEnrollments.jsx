import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/services/api";

const editableFields = [
  "name",
  "fatherName",
  "fatherOccupation",
  "motherName",
  "motherOccupation",
  "dob",
  "category",
  "gender",
  "address",
  "pincode",
  "class",
  "board",
  "stream",
  "contactNo",
  "alternateNo",
  "branchName",
  "nextYearPlan",
];

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

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
            <h3 className="font-medium">{application.student?.name}</h3>
            <p className="text-xs text-muted-foreground">{application.student?.email}</p>
            <p className="text-xs text-muted-foreground">
              {application.course?.title} · Submitted{" "}
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
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder="Father's Name"
                value={form.fatherName}
                onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
              />
              <Input
                placeholder="Father's Occupation"
                value={form.fatherOccupation}
                onChange={(e) => setForm({ ...form, fatherOccupation: e.target.value })}
              />
              <Input
                placeholder="Mother's Name"
                value={form.motherName}
                onChange={(e) => setForm({ ...form, motherName: e.target.value })}
              />
              <Input
                placeholder="Mother's Occupation"
                value={form.motherOccupation}
                onChange={(e) => setForm({ ...form, motherOccupation: e.target.value })}
              />
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Category</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <Textarea
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />

            <div className="grid sm:grid-cols-3 gap-3">
              <Input
                placeholder="Pin Code"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              />
              <Input
                placeholder="Class"
                value={form.class}
                onChange={(e) => setForm({ ...form, class: e.target.value })}
              />
              <Input
                placeholder="Board"
                value={form.board}
                onChange={(e) => setForm({ ...form, board: e.target.value })}
              />
              <Input
                placeholder="Stream"
                value={form.stream}
                onChange={(e) => setForm({ ...form, stream: e.target.value })}
              />
              <Input
                placeholder="Contact No."
                value={form.contactNo}
                onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
              />
              <Input
                placeholder="Alternate No."
                value={form.alternateNo}
                onChange={(e) => setForm({ ...form, alternateNo: e.target.value })}
              />
              <Input
                placeholder="Branch Name"
                value={form.branchName}
                onChange={(e) => setForm({ ...form, branchName: e.target.value })}
              />
              <Input
                placeholder="Next Year Plan"
                value={form.nextYearPlan}
                onChange={(e) => setForm({ ...form, nextYearPlan: e.target.value })}
                className="sm:col-span-2"
              />
            </div>

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/enrollment-applications");
      setApplications(res.data.applications);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load enrolment forms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Enrolment Forms</h2>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4">
          {applications.map((application) => (
            <ApplicationRow
              key={application._id}
              application={application}
              onChanged={loadApplications}
            />
          ))}
          {applications.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No enrolment forms yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminEnrollments;
