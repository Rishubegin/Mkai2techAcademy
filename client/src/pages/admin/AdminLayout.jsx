import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/students", label: "Students" },
  { to: "/admin/teachers", label: "Teachers" },
  { to: "/admin/courses", label: "Courses" },
  { to: "/admin/batches", label: "Batches" },
  { to: "/admin/enrollments", label: "Enrolment Forms" },
  { to: "/admin/discounts", label: "Discounts" },
  { to: "/admin/testimonials", label: "Testimonials" },
  { to: "/admin/faqs", label: "FAQs" },
  { to: "/admin/gallery", label: "Gallery" },
  { to: "/admin/events", label: "Events" },
  { to: "/admin/notices", label: "Notices" },
  { to: "/admin/contact", label: "Inquiries" },
];

const navLinkClass = ({ isActive }) =>
  cn(
    "block px-4 py-2.5 text-sm rounded-md transition-colors",
    isActive
      ? "bg-sidebar-accent text-sidebar-primary font-medium"
      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
  );

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="lg:flex">
      {/* Mobile top bar */}
      <div className="flex items-center gap-3 bg-sidebar px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open admin menu"
          className="cursor-pointer text-sidebar-foreground"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-bold text-sidebar-foreground">Admin Dashboard</h1>
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-sidebar lg:hidden">
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
              <span className="font-semibold text-sidebar-foreground">Admin Menu</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close admin menu"
                className="cursor-pointer text-sidebar-foreground"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="space-y-1 p-3">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={navLinkClass}
                  onClick={() => setSidebarOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden shrink-0 bg-sidebar lg:block lg:w-64">
        <div className="px-4 py-6">
          <h1 className="mb-4 text-xl font-bold text-sidebar-foreground">Admin Dashboard</h1>
          <nav className="space-y-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1 px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
