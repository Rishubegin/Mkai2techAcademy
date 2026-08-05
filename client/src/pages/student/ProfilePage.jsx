import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { resolveMediaUrl } from "@/lib/utils";

const ProfilePage = () => {
  const { user, refresh } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    try {
      await api.patch(`/users/${user._id}`, profileForm);
      setProfileMessage("Profile updated successfully");
      refresh();
    } catch (err) {
      setProfileMessage(err.response?.data?.Error || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordMessage("");
    try {
      await api.post("/users/verify-password", { password: passwordForm.currentPassword });
      await api.patch("/users/change-password", { newPassword: passwordForm.newPassword });
      setPasswordMessage("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPasswordMessage(err.response?.data?.Error || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarUploading(true);
    setAvatarMessage("");
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await api.patch(`/users/${user._id}/profile-image/upload`, formData);
      setAvatarMessage("Profile picture updated");
      refresh();
    } catch (err) {
      setAvatarMessage(err.response?.data?.Error || "Failed to upload picture");
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold">My Profile</h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold">Profile Picture</h2>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user?.profileImage ? resolveMediaUrl(user.profileImage) : undefined}
              />
              <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <Input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={avatarUploading} />
              {avatarMessage && <p className="text-sm mt-1">{avatarMessage}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold">Personal Information</h2>
          <form onSubmit={handleProfileSave} className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Name</label>
              <Input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Email</label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Phone</label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
            {profileMessage && <p className="text-sm">{profileMessage}</p>}
            <Button type="submit" size="sm" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <Input
              type="password"
              placeholder="Current password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              required
            />
            <Input
              type="password"
              placeholder="New password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
            />
            {passwordMessage && <p className="text-sm">{passwordMessage}</p>}
            <Button type="submit" size="sm" disabled={changingPassword}>
              {changingPassword ? "Updating..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
