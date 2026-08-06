import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [helpfulClicked, setHelpfulClicked] = useState({});

  useEffect(() => {
    setLoading(true);
    api
      .get("/faqs", { params: category ? { category } : {} })
      .then((res) => setFaqs(res.data.faqs))
      .finally(() => setLoading(false));
  }, [category]);

  const categories = [...new Set(faqs.map((f) => f.category).filter(Boolean))];

  const markHelpful = async (id) => {
    if (helpfulClicked[id]) return;
    try {
      await api.post(`/faqs/${id}/helpful`);
      setHelpfulClicked({ ...helpfulClicked, [id]: true });
      setFaqs(faqs.map((f) => (f._id === id ? { ...f, helpful: f.helpful + 1 } : f)));
    } catch {
      // non-critical, ignore
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-muted-foreground">Answers to common questions about our courses.</p>
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            size="sm"
            variant={category === "" ? "default" : "outline"}
            onClick={() => setCategory("")}
          >
            All
          </Button>
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      )}

      {loading && <p className="text-center text-muted-foreground">Loading...</p>}
      {!loading && faqs.length === 0 && (
        <p className="text-center text-muted-foreground">No FAQs available yet.</p>
      )}

      <div className="space-y-4">
        {faqs.map((faq) => (
          <Card key={faq._id}>
            <CardContent className="p-5">
              <h3 className="font-medium mb-2">{faq.question}</h3>
              <p className="text-sm text-muted-foreground mb-3">{faq.answer}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <button
                  onClick={() => markHelpful(faq._id)}
                  disabled={helpfulClicked[faq._id]}
                  className="hover:underline disabled:no-underline disabled:opacity-60"
                >
                  {helpfulClicked[faq._id] ? "Thanks!" : "Helpful?"}
                </button>
                <span>({faq.helpful} found this helpful)</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FAQPage;
