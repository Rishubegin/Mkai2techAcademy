import { lazy, Suspense } from "react";
import Header from "./Header";
import Body from "./components/Body";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";

// Everything below Header/Footer/Body is route-gated, so it's a natural
// code-split boundary: the homepage's first paint only pulls in the layout
// shell, not the admin section (recharts) or every secondary page.
const LoginSignUp = lazy(() => import("./components/LoginSignUp"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"));
const EnrollmentFormPage = lazy(() => import("./pages/EnrollmentFormPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const FacultyPage = lazy(() => import("./pages/FacultyPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const ProfilePage = lazy(() => import("./pages/student/ProfilePage"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminStudents = lazy(() => import("./pages/admin/AdminStudents"));
const AdminTeachers = lazy(() => import("./pages/admin/AdminTeachers"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));
const AdminBatches = lazy(() => import("./pages/admin/AdminBatches"));
const AdminEnrollments = lazy(() => import("./pages/admin/AdminEnrollments"));
const AdminDiscounts = lazy(() => import("./pages/admin/AdminDiscounts"));
const AdminContactForms = lazy(() => import("./pages/admin/AdminContactForms"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminFAQs = lazy(() => import("./pages/admin/AdminFAQs"));
const AdminGallery = lazy(() => import("./pages/admin/AdminGallery"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminNotices = lazy(() => import("./pages/admin/AdminNotices"));
const VerifyCertificatePage = lazy(() => import("./pages/VerifyCertificatePage"));

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
        { path: "/", element: <Body /> },
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
          <LoginSignUp />
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
