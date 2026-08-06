import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

const InquirySection = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreed) {
      setStatus({ type: "error", message: "Please agree to the terms to continue" });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      await api.post("/contact", form);
      setStatus({ type: "success", message: "Thanks! We'll get back to you within 24 hours." });
      setForm({ name: "", email: "", message: "" });
      setAgreed(false);
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.Error || err.response?.data?.message || "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        {/* LEFT IMAGE */}
        <div className="w-full">
          <div className="w-full h-75 sm:h-100 lg:h-125 rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=1000&fit=crop"
              alt="Students learning together at M Kai² Tech Academy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="w-full max-w-xl">
          {/* Heading */}
          <p className="text-sm mb-2">Inquiry</p>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start learning
          </h2>

          <p className="text-sm md:text-base mb-6">
            Fill out the form below and we will get back to you within 24 hours.
          </p>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm">Name</label>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm">Message</label>
              <Textarea
                placeholder="Tell us about your learning goals"
                className="min-h-30"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="terms"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
              />
              <label htmlFor="terms" className="text-sm">
                I agree to the terms
              </label>
            </div>

            {status.message && (
              <p className={status.type === "error" ? "text-sm text-destructive" : "text-sm"}>
                {status.message}
              </p>
            )}

            {/* Button */}
            <Button type="submit" className="rounded-full px-6" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default InquirySection;
