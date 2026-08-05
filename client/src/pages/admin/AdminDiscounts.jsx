import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/services/api";

const emptyForm = { code: "", type: "percent", value: "", description: "", expiresAt: "" };

const AdminDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/discounts");
      setDiscounts(res.data.discounts);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load discount codes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/discounts", { ...form, value: Number(form.value) });
      setMessage("Discount code created successfully");
      setForm(emptyForm);
      setShowForm(false);
      loadDiscounts();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to create discount code");
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.patch(`/discounts/${id}`, { isActive });
      loadDiscounts();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to update discount code");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this discount code?")) return;
    try {
      await api.delete(`/discounts/${id}`);
      loadDiscounts();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to delete discount code");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Discount Codes</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Discount Code"}
        </Button>
      </div>

      {message && <p className="text-sm">{message}</p>}

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
              <Input
                placeholder="Code (e.g. EARLYBIRD)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="percent">Percent off</option>
                <option value="flat">Flat amount off</option>
              </select>
              <Input
                type="number"
                placeholder={form.type === "percent" ? "Percent (e.g. 20)" : "Amount (₹)"}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                required
              />
              <Input
                type="date"
                placeholder="Expires (optional)"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
              <Input
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="sm:col-span-2"
              />
              <Button type="submit" className="sm:col-span-2">
                Create Discount Code
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4">
          {discounts.map((d) => (
            <Card key={d._id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono font-medium">{d.code}</h3>
                    <span className="text-xs bg-gold text-navy px-2 py-0.5 rounded-full">
                      {d.type === "percent" ? `${d.value}% off` : `₹${d.value} off`}
                    </span>
                    {!d.isActive && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  {d.description && (
                    <p className="text-sm text-muted-foreground mt-1">{d.description}</p>
                  )}
                  {d.expiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(d.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleToggleActive(d._id, !d.isActive)}
                  >
                    {d.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="xs" variant="destructive" onClick={() => handleDelete(d._id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {discounts.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No discount codes yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDiscounts;
