import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/services/api";

const StudentRow = ({ batchId, entry, onChanged }) => {
  const [paymentForm, setPaymentForm] = useState({
    paymentStatus: entry.paymentStatus || "unpaid",
    amountPaid: entry.amountPaid || 0,
    discountApplied: entry.discountApplied || 0,
    discountCode: entry.discountCode || "",
    paymentNotes: entry.paymentNotes || "",
  });
  const [progress, setProgress] = useState(entry.progressPercent ?? 0);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const isComplete = (entry.progressPercent ?? 0) >= 100;

  const savePayment = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.patch(`/batches/${batchId}/students/${entry.student._id}/payment`, paymentForm);
      setMessage("Payment saved");
      onChanged();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to save payment");
    } finally {
      setSaving(false);
    }
  };

  const saveProgress = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.patch(`/batches/${batchId}/students/${entry.student._id}/progress`, {
        progressPercent: Number(progress),
      });
      setMessage("Progress saved");
      onChanged();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to save progress");
    } finally {
      setSaving(false);
    }
  };

  const issueCertificate = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.post(`/certificates/${batchId}/${entry.student._id}`);
      setMessage("Certificate issued");
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to issue certificate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{entry.student?.name}</p>
          <p className="text-xs text-muted-foreground">{entry.student?.email}</p>
        </div>
        {isComplete && (
          <Button size="xs" variant="outline" onClick={issueCertificate} disabled={saving}>
            Issue Certificate
          </Button>
        )}
      </div>

      <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-center">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            className="h-8 w-20"
          />
          <span className="text-xs text-muted-foreground">% progress</span>
        </div>
        <Button size="xs" variant="outline" onClick={saveProgress} disabled={saving}>
          Save Progress
        </Button>
      </div>

      <div className="grid sm:grid-cols-5 gap-2">
        <select
          className="border rounded-md px-2 py-1 text-xs bg-background"
          value={paymentForm.paymentStatus}
          onChange={(e) => setPaymentForm({ ...paymentForm, paymentStatus: e.target.value })}
        >
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
        <Input
          type="number"
          placeholder="Amount paid"
          value={paymentForm.amountPaid}
          onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          type="number"
          placeholder="Discount ₹"
          value={paymentForm.discountApplied}
          onChange={(e) => setPaymentForm({ ...paymentForm, discountApplied: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          placeholder="Discount code"
          value={paymentForm.discountCode}
          onChange={(e) => setPaymentForm({ ...paymentForm, discountCode: e.target.value })}
          className="h-8 text-xs"
        />
        <Input
          placeholder="Notes / receipt #"
          value={paymentForm.paymentNotes}
          onChange={(e) => setPaymentForm({ ...paymentForm, paymentNotes: e.target.value })}
          className="h-8 text-xs"
        />
      </div>
      <Button size="xs" onClick={savePayment} disabled={saving}>
        Save Payment
      </Button>

      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
};

const BatchRosterPanel = ({ batchId }) => {
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/batches/${batchId}`);
      setBatch(res.data.batch);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load roster");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-sm text-muted-foreground mt-3">Loading roster...</p>;
  if (error) return <p className="text-sm text-destructive mt-3">{error}</p>;
  if (!batch?.students?.length) {
    return <p className="text-sm text-muted-foreground mt-3">No students enrolled yet.</p>;
  }

  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      {batch.students.map((entry) => (
        <StudentRow key={entry._id} batchId={batchId} entry={entry} onChanged={load} />
      ))}
    </div>
  );
};

export default BatchRosterPanel;
