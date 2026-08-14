import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Pagination from "@/components/common/Pagination";
import api from "@/services/api";
import CourseRosterPanel from "./CourseRosterPanel";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  mode: "Offline",
  fees: "",
  instructor: "",
};

const CourseMaterialsPanel = ({ courseId }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [uploadForm, setUploadForm] = useState({ title: "", module: "", file: null });
  const [uploading, setUploading] = useState(false);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/materials/course/${courseId}`);
      setMaterials(res.data.materials);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load materials");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      setMessage("Please choose a file");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("courseId", courseId);
      formData.append("title", uploadForm.title);
      formData.append("module", uploadForm.module);
      formData.append("file", uploadForm.file);

      await api.post("/materials", formData);
      setMessage("Material uploaded successfully");
      setUploadForm({ title: "", module: "", file: null });
      loadMaterials();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to upload material");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm("Delete this material?")) return;
    try {
      await api.delete(`/materials/${materialId}`);
      loadMaterials();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to delete material");
    }
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-4">
      <form onSubmit={handleUpload} className="grid sm:grid-cols-3 gap-3">
        <Input
          placeholder="Title"
          value={uploadForm.title}
          onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
          required
        />
        <Input
          placeholder="Module (optional)"
          value={uploadForm.module}
          onChange={(e) => setUploadForm({ ...uploadForm, module: e.target.value })}
        />
        <Input
          type="file"
          onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
        />
        <Button type="submit" size="sm" disabled={uploading} className="sm:col-span-3 w-fit">
          {uploading ? "Uploading..." : "Upload Material"}
        </Button>
      </form>

      {message && <p className="text-sm">{message}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading materials...</p>}

      {!loading && materials.length === 0 && (
        <p className="text-sm text-muted-foreground">No materials uploaded yet.</p>
      )}

      <div className="space-y-2">
        {materials.map((material) => (
          <div
            key={material._id}
            className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2"
          >
            <span>
              {material.title} {material.module && `(${material.module})`} ·{" "}
              {material.fileType?.toUpperCase()}
            </span>
            <Button size="xs" variant="destructive" onClick={() => handleDelete(material._id)}>
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const CourseContentPanel = ({ course, onChanged }) => {
  const [syllabus, setSyllabus] = useState(
    (course.syllabus || []).map((mod) => ({ title: mod.title, topics: [...mod.topics] })),
  );
  const [highlights, setHighlights] = useState([...(course.highlights || [])]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const addModule = () => setSyllabus([...syllabus, { title: "", topics: [] }]);
  const removeModule = (idx) => setSyllabus(syllabus.filter((_, i) => i !== idx));
  const updateModuleTitle = (idx, title) =>
    setSyllabus(syllabus.map((mod, i) => (i === idx ? { ...mod, title } : mod)));
  const addTopic = (idx) =>
    setSyllabus(
      syllabus.map((mod, i) => (i === idx ? { ...mod, topics: [...mod.topics, ""] } : mod)),
    );
  const updateTopic = (modIdx, topicIdx, value) =>
    setSyllabus(
      syllabus.map((mod, i) =>
        i === modIdx
          ? { ...mod, topics: mod.topics.map((t, j) => (j === topicIdx ? value : t)) }
          : mod,
      ),
    );
  const removeTopic = (modIdx, topicIdx) =>
    setSyllabus(
      syllabus.map((mod, i) =>
        i === modIdx ? { ...mod, topics: mod.topics.filter((_, j) => j !== topicIdx) } : mod,
      ),
    );

  const addHighlight = () => setHighlights([...highlights, ""]);
  const updateHighlight = (idx, value) =>
    setHighlights(highlights.map((h, i) => (i === idx ? value : h)));
  const removeHighlight = (idx) => setHighlights(highlights.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const cleanSyllabus = syllabus
        .map((mod) => ({
          title: mod.title.trim(),
          topics: mod.topics.map((t) => t.trim()).filter(Boolean),
        }))
        .filter((mod) => mod.title);
      const cleanHighlights = highlights.map((h) => h.trim()).filter(Boolean);

      await api.patch(`/courses/${course._id}`, {
        syllabus: cleanSyllabus,
        highlights: cleanHighlights,
      });
      setMessage("Saved successfully");
      onChanged();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-6">
      <div>
        <h4 className="font-medium text-sm mb-2">Highlights (shown next to Enroll button)</h4>
        <div className="space-y-2">
          {highlights.map((h, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                placeholder="e.g. 30+ hours of video content"
                value={h}
                onChange={(e) => updateHighlight(idx, e.target.value)}
                className="h-8 text-sm"
              />
              <Button size="xs" variant="destructive" onClick={() => removeHighlight(idx)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button size="xs" variant="outline" className="mt-2" onClick={addHighlight}>
          Add Highlight
        </Button>
      </div>

      <div>
        <h4 className="font-medium text-sm mb-2">Syllabus</h4>
        <div className="space-y-4">
          {syllabus.map((mod, modIdx) => (
            <div key={modIdx} className="border rounded-md p-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Season / Module title (e.g. Season 1)"
                  value={mod.title}
                  onChange={(e) => updateModuleTitle(modIdx, e.target.value)}
                  className="h-8 text-sm"
                />
                <Button size="xs" variant="destructive" onClick={() => removeModule(modIdx)}>
                  Remove Season
                </Button>
              </div>
              <div className="pl-4 space-y-2">
                {mod.topics.map((topic, topicIdx) => (
                  <div key={topicIdx} className="flex gap-2">
                    <Input
                      placeholder="Episode title"
                      value={topic}
                      onChange={(e) => updateTopic(modIdx, topicIdx, e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => removeTopic(modIdx, topicIdx)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button size="xs" variant="outline" onClick={() => addTopic(modIdx)}>
                  Add Episode
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button size="xs" variant="outline" className="mt-3" onClick={addModule}>
          Add Season
        </Button>
      </div>

      {message && <p className="text-sm">{message}</p>}
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Content"}
      </Button>
    </div>
  );
};

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [materialsOpenId, setMaterialsOpenId] = useState(null);
  const [rosterOpenId, setRosterOpenId] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [contentOpenId, setContentOpenId] = useState(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, teachersRes] = await Promise.all([
        api.get("/courses", { params: { page, limit: 10 } }),
        api.get("/teacher-profiles"),
      ]);
      setCourses(coursesRes.data.courses);
      setPagination(coursesRes.data.pagination);
      setTeachers(teachersRes.data.profiles);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await api.post("/courses", {
        ...form,
        fees: Number(form.fees),
        instructor: form.instructor || undefined,
      });

      // The image endpoint takes a file, so it can only run once the course
      // has an id — hence the second request rather than one combined create.
      if (newImage) {
        const imageData = new FormData();
        imageData.append("image", newImage);
        await api.patch(`/courses/${res.data.course._id}/image`, imageData);
      }

      setMessage("Course created successfully");
      setForm(emptyForm);
      setNewImage(null);
      setShowForm(false);
      loadCourses();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to create course");
    }
  };

  const startEdit = (course) => {
    setEditingId(course._id);
    setEditForm({
      title: course.title,
      description: course.description || "",
      category: course.category,
      mode: course.mode,
      fees: course.fees,
      image: course.image || "",
      instructor: course.instructor?._id || "",
    });
  };

  const handleUpdate = async (id) => {
    setMessage("");
    try {
      await api.patch(`/courses/${id}`, {
        ...editForm,
        fees: Number(editForm.fees),
        instructor: editForm.instructor || undefined,
      });

      if (editImage) {
        const imageData = new FormData();
        imageData.append("image", editImage);
        await api.patch(`/courses/${id}/image`, imageData);
      }

      setEditImage(null);
      setEditingId(null);
      loadCourses();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to update course");
    }
  };

  const handleToggleFeature = async (id) => {
    try {
      await api.patch(`/courses/${id}/feature`);
      loadCourses();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to toggle feature");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course? This cannot be undone.")) return;
    try {
      await api.delete(`/courses/${id}`);
      // Removing the only row on the last page would otherwise strand the admin
      // on a page that no longer exists.
      if (courses.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadCourses();
      }
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to delete course");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Courses</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Course"}
        </Button>
      </div>

      {message && <p className="text-sm">{message}</p>}

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <Input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              />
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
              >
                <option value="Offline">Offline</option>
                <option value="Online">Online</option>
                <option value="Hybrid">Hybrid</option>
              </select>
              <Input
                type="number"
                placeholder="Fees"
                value={form.fees}
                onChange={(e) => setForm({ ...form, fees: e.target.value })}
                required
              />
              <select
                className="border rounded-md px-3 py-2 text-sm bg-background"
                value={form.instructor}
                onChange={(e) => setForm({ ...form, instructor: e.target.value })}
              >
                <option value="">-- Select Instructor (optional) --</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.user?.name} — {t.qualification}
                  </option>
                ))}
              </select>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-muted-foreground">Course image (optional)</label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setNewImage(e.target.files?.[0] || null)}
                />
              </div>
              <Textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="sm:col-span-2"
              />
              <Button type="submit" className="sm:col-span-2">
                Create Course
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4">
          {courses.map((course) =>
            editingId === course._id ? (
              <Card key={course._id}>
                <CardContent className="p-4 grid sm:grid-cols-2 gap-3">
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                  <Input
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  />
                  <select
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={editForm.mode}
                    onChange={(e) => setEditForm({ ...editForm, mode: e.target.value })}
                  >
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                  <Input
                    type="number"
                    value={editForm.fees}
                    onChange={(e) => setEditForm({ ...editForm, fees: e.target.value })}
                  />
                  <select
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                    value={editForm.instructor}
                    onChange={(e) => setEditForm({ ...editForm, instructor: e.target.value })}
                  >
                    <option value="">-- Select Instructor (optional) --</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.user?.name} — {t.qualification}
                      </option>
                    ))}
                  </select>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Course image — pick a file to replace it
                    </label>
                    <div className="flex items-center gap-3">
                      {editForm.image && (
                        <img
                          src={editForm.image}
                          alt=""
                          className="h-12 w-20 object-cover rounded border shrink-0"
                        />
                      )}
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="sm:col-span-2"
                  />
                  <div className="sm:col-span-2 flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(course._id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditImage(null); }}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card key={course._id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{course.title}</h3>
                        {course.isFeatured && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {course.category} · {course.mode} · ₹{course.fees}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="xs" variant="outline" onClick={() => handleToggleFeature(course._id)}>
                        {course.isFeatured ? "Unfeature" : "Feature"}
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => startEdit(course)}>
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          setContentOpenId(contentOpenId === course._id ? null : course._id)
                        }
                      >
                        {contentOpenId === course._id ? "Hide Syllabus" : "Syllabus & Highlights"}
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          setMaterialsOpenId(materialsOpenId === course._id ? null : course._id)
                        }
                      >
                        {materialsOpenId === course._id ? "Hide Materials" : "Materials"}
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          setRosterOpenId(rosterOpenId === course._id ? null : course._id)
                        }
                      >
                        {rosterOpenId === course._id ? "Hide Students" : "Students"}
                      </Button>
                      <Button size="xs" variant="destructive" onClick={() => handleDelete(course._id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  {contentOpenId === course._id && (
                    <CourseContentPanel course={course} onChanged={loadCourses} />
                  )}
                  {materialsOpenId === course._id && (
                    <CourseMaterialsPanel courseId={course._id} />
                  )}
                  {rosterOpenId === course._id && (
                    <CourseRosterPanel courseId={course._id} />
                  )}
                </CardContent>
              </Card>
            ),
          )}
          {courses.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No courses yet.</p>
          )}

          <Pagination pagination={pagination} onPageChange={setPage} label="courses" />
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
