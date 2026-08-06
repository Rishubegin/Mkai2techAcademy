import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

const DISMISSED_KEY = "dismissedNotices";

const getDismissed = () => {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY)) || [];
  } catch {
    return [];
  }
};

// Dismissible notice banner for dashboards. Dismissal is per-browser
// (localStorage), matching the app's existing theme-preference pattern —
// no backend "read" state exists for notices, so re-visiting on another
// device will show it again. Acceptable for an announcements feature.
const NoticeBanner = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [dismissed, setDismissed] = useState(getDismissed);

  useEffect(() => {
    if (!user) return;
    api
      .get("/notices")
      .then((res) => setNotices(res.data.notices))
      .catch(() => {});
  }, [user]);

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
  };

  const visible = notices.filter((n) => !dismissed.includes(n._id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((notice) => (
        <div
          key={notice._id}
          className="flex items-start justify-between gap-3 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-navy dark:text-gold">{notice.title}</p>
            <p className="text-sm text-muted-foreground">{notice.message}</p>
          </div>
          <button
            onClick={() => dismiss(notice._id)}
            aria-label="Dismiss notice"
            className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NoticeBanner;
