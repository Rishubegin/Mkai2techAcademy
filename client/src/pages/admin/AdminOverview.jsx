import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NoticeBanner from "@/components/common/NoticeBanner";
import api from "@/services/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const StatCard = ({ label, value }) => (
  <Card>
    <CardContent className="p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? "-"}</p>
    </CardContent>
  </Card>
);

const AdminOverview = () => {
  const [userCounts, setUserCounts] = useState(null);
  const [courseStats, setCourseStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/users/count"),
      api.get("/courses/stats"),
      api.get("/admin/analytics/enrollment-trend", { params: { days: 30 } }),
    ])
      .then(([usersRes, coursesRes, trendRes]) => {
        setUserCounts(usersRes.data);
        setCourseStats(coursesRes.data);
        setTrend(trendRes.data.trend);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load stats"));
  }, []);

  const handleExport = async () => {
    const res = await api.get("/admin/analytics/enrollments/export", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "enrollments.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  if (error) return <p className="text-destructive">{error}</p>;

  const courseModeData = courseStats
    ? [
        { name: "Offline", value: courseStats.offlineCourses },
        { name: "Online", value: courseStats.onlineCourses },
        { name: "Hybrid", value: courseStats.hybridCourses },
      ]
    : [];

  return (
    <div className="space-y-8">
      <NoticeBanner />

      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={handleExport}>
          Export Enrollments (CSV)
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Users</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Students" value={userCounts?.students} />
          <StatCard label="Teachers" value={userCounts?.teachers} />
          <StatCard label="Admins" value={userCounts?.admins} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Courses</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total" value={courseStats?.totalCourses} />
          <StatCard label="Featured" value={courseStats?.featuredCourses} />
          <StatCard label="Offline" value={courseStats?.offlineCourses} />
          <StatCard label="Online" value={courseStats?.onlineCourses} />
          <StatCard label="Hybrid" value={courseStats?.hybridCourses} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Enrollment Trend (last 30 days)</h3>
            {trend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No enrollments recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="var(--brand-gold)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Courses by Mode</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={courseModeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--brand-gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
