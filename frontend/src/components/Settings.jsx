// src/components/Settings.jsx
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { getCurrentUser, setCurrentUser } from "../utils/storage";

export default function Settings() {
  const user = getCurrentUser() || {};

  // Parse first / last from the stored full name
  const nameParts   = (user.name || "Dummy Driver").split(" ");
  const storedFirst = nameParts.slice(0, -1).join(" ") || nameParts[0] || "";
  const storedLast  = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const storedEmail = user.email || "driver@routelog.com";

  // ── Profile state ────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(storedFirst);
  const [lastName,  setLastName]  = useState(storedLast);
  const [phone,     setPhone]     = useState(user.phone || "");
  const [profileMsg, setProfileMsg] = useState("");

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "DR";
  const displayName = `${firstName} ${lastName}`.trim() || user.name || "Driver";

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    setCurrentUser({ ...user, name: fullName, phone: phone.trim() });
    setProfileMsg("Profile updated successfully!");
    setTimeout(() => setProfileMsg(""), 3000);
  };

  // ── Password state ────────────────────────────────────────────────────────
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [pwMsg,      setPwMsg]      = useState("");
  const [pwError,    setPwError]    = useState("");

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setPwMsg(""); setPwError("");
    if (!currentPw) { setPwError("Enter your current password."); return; }
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    setPwMsg("Password updated!");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwMsg(""), 3000);
  };

  // ── Email state ───────────────────────────────────────────────────────────
  const [newEmail,   setNewEmail]   = useState(storedEmail);
  const [emailPw,    setEmailPw]    = useState("");
  const [emailMsg,   setEmailMsg]   = useState("");
  const [emailError, setEmailError] = useState("");

  const handleUpdateEmail = (e) => {
    e.preventDefault();
    setEmailMsg(""); setEmailError("");
    if (!newEmail.includes("@")) { setEmailError("Enter a valid email address."); return; }
    if (!emailPw) { setEmailError("Enter your password to verify."); return; }
    setCurrentUser({ ...user, email: newEmail.trim().toLowerCase() });
    setEmailMsg("Email updated successfully!");
    setEmailPw("");
    setTimeout(() => setEmailMsg(""), 3000);
  };

  // ── shared input class ────────────────────────────────────────────────────
  const inputCls =
    "w-full rounded-xl bg-slate-50/50 border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all";
  const btnCls =
    "bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-8 py-2.5 rounded-xl shadow-sm shadow-blue-600/20 transition-all border-none focus:outline-none";

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span>Dashboard</span>
        <ChevronRight size={14} />
        <span className="text-slate-800 font-semibold">Settings</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Update your account details, security, and preferences.</p>
      </div>

      <div className="space-y-8">

        {/* ══════════════════ My Profile ══════════════════ */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-1">My Profile</h3>
          <p className="text-sm text-slate-400 mb-6">Update your personal information</p>

          {/* Avatar row */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-50">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">{displayName}</p>
              <p className="text-xs text-slate-500">{storedEmail}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile}>
            {/* First & Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 03185005791"
                className={inputCls}
              />
            </div>

            {profileMsg && (
              <p className="text-sm text-emerald-600 font-medium mb-3">{profileMsg}</p>
            )}

            <div className="flex justify-end">
              <button type="submit" className={btnCls}>Save Changes</button>
            </div>
          </form>
        </div>

        {/* ══════════════════ Change Password ══════════════════ */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Change Password</h3>
          <p className="text-sm text-slate-400 mb-6">Update your password to keep your account secure</p>

          <form onSubmit={handleUpdatePassword}>
            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Enter your new password (min 8 characters)"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {pwError && <p className="text-sm text-red-500 font-medium mb-3">{pwError}</p>}
            {pwMsg   && <p className="text-sm text-emerald-600 font-medium mb-3">{pwMsg}</p>}

            <div className="flex justify-end">
              <button type="submit" className={btnCls}>Update Password</button>
            </div>
          </form>
        </div>

        {/* ══════════════════ Change Email ══════════════════ */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Change Email</h3>
          <p className="text-sm text-slate-400 mb-6">Update your email address (verification required)</p>

          <form onSubmit={handleUpdateEmail}>
            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password (for verification)</label>
                <input
                  type="password"
                  placeholder="**************"
                  value={emailPw}
                  onChange={(e) => setEmailPw(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {emailError && <p className="text-sm text-red-500 font-medium mb-3">{emailError}</p>}
            {emailMsg   && <p className="text-sm text-emerald-600 font-medium mb-3">{emailMsg}</p>}

            <div className="flex justify-end">
              <button type="submit" className={btnCls}>Update Email</button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}