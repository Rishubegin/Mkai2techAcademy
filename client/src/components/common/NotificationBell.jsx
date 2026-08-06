import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

const NotificationBell = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    api
      .get("/notices")
      .then((res) => setNotices(res.data.notices))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notices"
        className="relative text-navy dark:text-white hover:text-gold transition-colors cursor-pointer p-1"
      >
        <Bell size={20} />
        {notices.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-maroon dark:bg-primary" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border bg-background shadow-lg z-50">
          <div className="p-3 border-b">
            <p className="text-sm font-medium">Notices</p>
          </div>
          {notices.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No notices right now.</p>
          ) : (
            <div className="divide-y">
              {notices.map((notice) => (
                <div key={notice._id} className="p-3">
                  <p className="text-sm font-medium">{notice.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notice.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
