import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/services/api";

// Progress and payment share one endpoint (PATCH .../enrollments/:studentId),
// so the row saves both together rather than having two separate buttons.
const EnrollmentRow = ({ courseId, enrollment, onChanged }) => {
  const student = enrollment.student;
  const [form, setForm] = useState({
    progressPercent: enrollment.progressPercent ?? 0,
    paymentStatus: enrollment.paymentStatus || "unpaid",
    amountPaid: enrollment.amountPaid || 0,
    discountApplied: enrollment.discountApplied || 0,
    discountCode: enrollment.discountCode || "",
    paymentNotes: enrollment.paymentNotes || "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const isComplete = (enrollment.progressPercent ?? 0) >= 100;

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.patch(`/courses/${courseId}/enrollments/${student._id}`, {
        progressPercent: Number(form.progressPercent) || 0,
        paymentStatus: form.paymentStatus,
        amountPaid: Number(form.amountPaid) || 0,
        discountApplied: Number(form.discountApplied) || 0,
        discountCode: form.discountCode,
        paymentNotes: form.paymentNotes,
      });
      setMessage("Saved");
      onChanged();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleIssueCertificate = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await api.post(`/certificates/${courseId}/${student._id}`);
      setMessage(res.data.message || "Certificate issued");
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to issue certificate");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (
      !window.confirm(
        `Remove ${student?.name || "this student"} from this course? Their enrollment record, progress and payment history will be deleted.`,
      )
    ) {
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await api.delete(`/courses/${courseId}/enrollments/${student._id}`);
      onChanged();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to remove enrollment");
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{student?.name || "Unknown student"}</p>
          <p className="text-xs text-muted-foreground truncate">{student?.email}</p>
          {enrollment.enrolledAt && (
            <p className="text-xs text-muted-foreground">
              Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {isComplete && (
            <Button size="xs" variant="outline" onClick={handleIssueCertificate} disabled={saving}>
              Issue Certificate
            </Button>
          )}
          <Button size="xs" variant="destructive" onClick={handleRemove} disabled={saving}>
            Remove
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="0"
          max="100"
          value={form.progressPercent}
          onChange={(e) => setForm({ ...form, progressPercent: e.target.value })}
          className="h-8 w-20 text-xs"
        />
        <span className="text-xs text-muted-foreground">% progress (100 enables certificate)</span>
      </div>

      <div className="grid sm:grid-cols-5 gap-2">
        <select
          className="border rounded-md px-2 py-1 text-xs bg-background"
          value={form.paymentStatus}
          onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
        >
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
        <Input
          type="number"
          placeholder="Amount paid"
          value={form.amountPaid}
          onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          type="number"
          placeholder="Discount ₹"
          value={form.discountApplied}
          onChange={(e) => setForm({ ...form, discountApplied: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          placeholder="Discount code"
          value={form.discountCode}
          onChange={(e) => setForm({ ...form, discountCode: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          placeholder="Notes / receipt #"
          value={form.paymentNotes}
          onChange={(e) => setForm({ ...form, paymentNotes: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button size="xs" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
};

const CourseRosterPanel = ({ courseId }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/courses/${courseId}/enrollments`);
      setEnrollments(res.data.enrollments);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load roster");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-sm text-muted-foreground mt-3">Loading roster...</p>;
  if (error) return <p className="text-sm text-destructive mt-3">{error}</p>;
  if (enrollments.length === 0) {
    return <p className="text-sm text-muted-foreground mt-3">No students enrolled yet.</p>;
  }

  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      <p className="text-xs text-muted-foreground">
        {enrollments.length} student{enrollments.length === 1 ? "" : "s"} enrolled
      </p>
      {enrollments.map((enrollment) => (
        <EnrollmentRow
          key={enrollment._id}
          courseId={courseId}
          enrollment={enrollment}
          onChanged={load}
        />
      ))}
    </div>
  );
};

export default CourseRosterPanel;
