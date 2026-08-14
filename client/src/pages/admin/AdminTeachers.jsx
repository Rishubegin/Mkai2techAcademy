import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/services/api";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  qualification: "",
  experience: "",
  experienceYears: "",
  specialization: "",
  bio: "",
};

const initialOf = (name) => name?.trim()?.[0]?.toUpperCase() || "?";

const TeacherRow = ({ profile, onChanged }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    qualification: profile.qualification || "",
    experience: profile.experience || "",
    experienceYears: profile.experienceYears ?? "",
    specialization: (profile.specialization || []).join(", "),
    bio: profile.bio || "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePhotoPick = (file) => {
    setPhotoFile(file || null);
    // Object URLs are revoked on unmount/replace so the blob isn't retained.
    setPhotoPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : "";
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.patch(`/teacher-profiles/${profile._id}`, {
        qualification: form.qualification,
        experience: form.experience,
        experienceYears: Number(form.experienceYears) || 0,
        specialization: form.specialization
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        bio: form.bio,
      });

      if (photoFile) {
        const photoData = new FormData();
        photoData.append("photo", photoFile);
        await api.patch(`/teacher-profiles/${profile._id}/photo`, photoData);
      }

      handlePhotoPick(null);
      setEditing(false);
      onChanged();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${profile.user?.name}'s teacher profile?`)) return;
    try {
      await api.delete(`/teacher-profiles/${profile._id}`);
      onChanged();
    } catch (err) {
      setMessage(err.response?.data?.Error || "Failed to delete profile");
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar size="lg">
              <AvatarImage src={profile.photo || undefined} alt={profile.user?.name} />
              <AvatarFallback>{initialOf(profile.user?.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-medium truncate">{profile.user?.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{profile.user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button size="xs" onClick={handleSave} disabled={saving}>
                  Save
                </Button>
                <Button size="xs" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="xs" variant="outline" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button size="xs" variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div className="grid sm:grid-cols-2 gap-2">
            <Input
              placeholder="Qualification"
              value={form.qualification}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Experience (e.g. 8 Years)"
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              className="h-8 text-xs"
            />
            <Input
              type="number"
              placeholder="Experience (years, numeric)"
              value={form.experienceYears}
              onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Specialization (comma separated)"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              className="h-8 text-xs"
            />
            <Textarea
              placeholder="Bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="sm:col-span-2 text-xs"
            />
            <div className="sm:col-span-2 flex items-center gap-2">
              <Avatar size="lg">
                <AvatarImage src={photoPreview || profile.photo || undefined} alt="Photo preview" />
                <AvatarFallback>{initialOf(profile.user?.name)}</AvatarFallback>
              </Avatar>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handlePhotoPick(e.target.files?.[0])}
                className="h-8 text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Qualification:</span>{" "}
              {profile.qualification || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Experience:</span>{" "}
              {profile.experience || "-"}
              {profile.experienceYears != null && ` (${profile.experienceYears} yrs)`}
            </p>
            <p>
              <span className="text-muted-foreground">Specialization:</span>{" "}
              {(profile.specialization || []).join(", ") || "-"}
            </p>
            {profile.bio && <p className="text-muted-foreground text-xs">{profile.bio}</p>}
          </div>
        )}

        {message && <p className="text-xs text-destructive">{message}</p>}
      </CardContent>
    </Card>
  );
};

const AdminTeachers = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [newPhoto, setNewPhoto] = useState(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/teacher-profiles");
      setProfiles(res.data.profiles);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load teacher profiles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const userRes = await api.post("/admin/users", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: "teacher",
      });

      const profileRes = await api.post("/teacher-profiles", {
        user: userRes.data.user._id,
        qualification: form.qualification,
        experience: form.experience,
        experienceYears: Number(form.experienceYears) || 0,
        specialization: form.specialization
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        bio: form.bio,
      });

      // The photo endpoint takes a file, so it can only run once the profile
      // has an id — hence the second request rather than one combined create.
      if (newPhoto) {
        const photoData = new FormData();
        photoData.append("photo", newPhoto);
        await api.patch(`/teacher-profiles/${profileRes.data.profile._id}/photo`, photoData);
      }

      setMessage("Teacher created successfully");
      setForm(emptyForm);
      setNewPhoto(null);
      setShowForm(false);
      loadProfiles();
    } catch (err) {
      setMessage(err.response?.data?.Error || err.response?.data?.message || "Failed to create teacher");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Teachers</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Teacher"}
        </Button>
      </div>

      {message && <p className="text-sm">{message}</p>}

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
              <Input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Temporary Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Input
                placeholder="Qualification (e.g. M.Sc Physics)"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              />
              <Input
                placeholder="Experience (e.g. 8 Years)"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Experience (years, numeric)"
                value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
              />
              <Input
                placeholder="Specialization (comma separated)"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              />
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-muted-foreground">Photo (optional)</label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setNewPhoto(e.target.files?.[0] || null)}
                />
              </div>
              <Textarea
                placeholder="Bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="sm:col-span-2"
              />
              <Button type="submit" className="sm:col-span-2">
                Create Teacher
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {profiles.map((profile) => (
            <TeacherRow key={profile._id} profile={profile} onChanged={loadProfiles} />
          ))}
          {profiles.length === 0 && (
            <p className="text-center text-muted-foreground py-6 sm:col-span-2">
              No teacher profiles yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTeachers;
