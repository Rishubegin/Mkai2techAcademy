import { lazy, Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HomePage from "@/pages/public/HomePage";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";

// Everything below the layout shell and the homepage is route-gated, so it's a
// natural code-split boundary: the homepage's first paint only pulls in the
// layout shell, not the admin section (recharts) or every secondary page.
const LoginSignUpPage = lazy(() => import("@/pages/auth/LoginSignUpPage"));

const CoursesPage = lazy(() => import("@/pages/public/CoursesPage"));
const CourseDetailPage = lazy(() => import("@/pages/public/CourseDetailPage"));
const EnrollmentFormPage = lazy(() => import("@/pages/public/EnrollmentFormPage"));
const AboutPage = lazy(() => import("@/pages/public/AboutPage"));
const ContactPage = lazy(() => import("@/pages/public/ContactPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/public/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("@/pages/public/TermsPage"));
const NotFoundPage = lazy(() => import("@/pages/public/NotFoundPage"));
const FAQPage = lazy(() => import("@/pages/public/FAQPage"));
const GalleryPage = lazy(() => import("@/pages/public/GalleryPage"));
const FacultyPage = lazy(() => import("@/pages/public/FacultyPage"));
const EventsPage = lazy(() => import("@/pages/public/EventsPage"));
const EventDetailPage = lazy(() => import("@/pages/public/EventDetailPage"));
const VerifyCertificatePage = lazy(() => import("@/pages/public/VerifyCertificatePage"));

const StudentDashboard = lazy(() => import("@/pages/student/StudentDashboard"));
const ProfilePage = lazy(() => import("@/pages/student/ProfilePage"));

const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import("@/pages/admin/AdminOverview"));
const AdminStudents = lazy(() => import("@/pages/admin/AdminStudents"));
const AdminTeachers = lazy(() => import("@/pages/admin/AdminTeachers"));
const AdminCourses = lazy(() => import("@/pages/admin/AdminCourses"));
const AdminBatches = lazy(() => import("@/pages/admin/AdminBatches"));
const AdminEnrollments = lazy(() => import("@/pages/admin/AdminEnrollments"));
const AdminDiscounts = lazy(() => import("@/pages/admin/AdminDiscounts"));
const AdminContactForms = lazy(() => import("@/pages/admin/AdminContactForms"));
const AdminTestimonials = lazy(() => import("@/pages/admin/AdminTestimonials"));
const AdminFAQs = lazy(() => import("@/pages/admin/AdminFAQs"));
const AdminGallery = lazy(() => import("@/pages/admin/AdminGallery"));
const AdminEvents = lazy(() => import("@/pages/admin/AdminEvents"));
const AdminNotices = lazy(() => import("@/pages/admin/AdminNotices"));

const RouteFallback = () => (
  <div className="flex justify-center py-24">
    <p className="text-muted-foreground text-sm">Loading...</p>
  </div>
);

// Layout
// flex-col + flex-1 on <main> is the standard sticky-footer pattern: short
// pages still fill the full viewport height (footer never floats mid-page),
// while taller pages grow past it exactly as before.
const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  const appRouter = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { path: "/", element: <HomePage /> },
        { path: "/courses", element: <CoursesPage /> },
        { path: "/courses/:courseId", element: <CourseDetailPage /> },
        { path: "/about", element: <AboutPage /> },
        { path: "/contact", element: <ContactPage /> },
        { path: "/privacy", element: <PrivacyPolicyPage /> },
        { path: "/terms", element: <TermsPage /> },
        { path: "/faq", element: <FAQPage /> },
        { path: "/gallery", element: <GalleryPage /> },
        { path: "/faculty", element: <FacultyPage /> },
        { path: "/events", element: <EventsPage /> },
        { path: "/events/:eventId", element: <EventDetailPage /> },
        { path: "/verify-certificate/:certificateId", element: <VerifyCertificatePage /> },
        {
          element: <ProtectedRoute allowedRoles={["student"]} />,
          children: [
            { path: "/dashboard", element: <StudentDashboard /> },
            { path: "/profile", element: <ProfilePage /> },
            {
              path: "/courses/:courseId/enroll/:batchId",
              element: <EnrollmentFormPage />,
            },
          ],
        },
        {
          path: "/admin",
          element: <ProtectedRoute allowedRoles={["admin"]} />,
          children: [
            {
              element: <AdminLayout />,
              children: [
                { index: true, element: <AdminOverview /> },
                { path: "students", element: <AdminStudents /> },
                { path: "teachers", element: <AdminTeachers /> },
                { path: "courses", element: <AdminCourses /> },
                { path: "batches", element: <AdminBatches /> },
                { path: "enrollments", element: <AdminEnrollments /> },
                { path: "discounts", element: <AdminDiscounts /> },
                { path: "testimonials", element: <AdminTestimonials /> },
                { path: "faqs", element: <AdminFAQs /> },
                { path: "gallery", element: <AdminGallery /> },
                { path: "events", element: <AdminEvents /> },
                { path: "notices", element: <AdminNotices /> },
                { path: "contact", element: <AdminContactForms /> },
              ],
            },
          ],
        },
        { path: "*", element: <NotFoundPage /> },
      ],
    },
    {
      path: "/loginSignUp",
      element: (
        <Suspense fallback={<RouteFallback />}>
          <LoginSignUpPage />
        </Suspense>
      ),
    },
  ]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={appRouter} />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
