import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/services/api";

const faqs = [
  {
    q: "What is the batch duration?",
    a: "Most batches run for 8-12 weeks depending on the course, with sessions a few times a week.",
  },
  {
    q: "Can I switch batches after enrolling?",
    a: "Yes, reach out to us and we'll help you move to a batch that fits your schedule, subject to seat availability.",
  },
  {
    q: "Do you offer trial classes?",
    a: "Contact us using the form below and we'll set up a trial session for your course of interest.",
  },
];

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      await api.post("/contact", form);
      setStatus({ type: "success", message: "Thanks! We'll get back to you within 24 hours." });
      setForm({ name: "", email: "", phone: "", message: "" });
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
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-muted-foreground">
          Have questions about courses or admissions? We're here to help.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Info */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-2">
              <h3 className="font-semibold">Email</h3>
              <p className="text-sm text-muted-foreground">mkai2techacademy@gmail.com</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-2">
              <h3 className="font-semibold">Phone</h3>
              <p className="text-sm text-muted-foreground">+91 8881439401</p>
              <p className="text-sm text-muted-foreground">+91 9608439401</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-2">
              <h3 className="font-semibold">Office</h3>
              <p className="text-sm text-muted-foreground">
                M kai² Tech Academy, Shop No-24, Bhola Market Sugamau Road, Near CIS,
                Indira Nagar, Lucknow-226016
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            name="phone"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={handleChange}
          />
          <Textarea
            name="message"
            placeholder="Tell us about your learning goals"
            className="min-h-32"
            value={form.message}
            onChange={handleChange}
            required
          />

          {status.message && (
            <p className={status.type === "error" ? "text-sm text-destructive" : "text-sm"}>
              {status.message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xl font-semibold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4 max-w-2xl mx-auto">
          {faqs.map((faq, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <h3 className="font-medium mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
