// src/CustomerDashboard.js
import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO } from "date-fns";

const BASE_URL = "http://localhost:3001"; // centralised base URL
const MAX_PHOTOS = 6; // maximum photos customer can attach
const MAX_PHOTO_MB = 6; // max size per photo

const CustomerDashboard = () => {
  const { state } = useLocation(); // customer info from login
  const navigate = useNavigate();

  // prefer an explicit activeTab coming from navigation state (e.g. after booking)
  const initialTab = state?.activeTab || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [pincode, setPincode] = useState("");
  const [profession, setProfession] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState(null);
  const [jobDetails, setJobDetails] = useState("");
  // bookingDate is a JS Date object for the DatePicker; we will normalise when sending
  const [bookingDate, setBookingDate] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);

  // photos for booking
  const [bookingPhotoFiles, setBookingPhotoFiles] = useState([]); // File[]
  const [bookingPhotoPreviews, setBookingPhotoPreviews] = useState([]); // { id, url, name }
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // whether to include address with booking. Options:
  // - useProfileAddress: include profileData.address (if present) - but editable in booking tab via bookingAddress
  // - useLiveLocation: include customerLocation (if captured)
  const [useProfileAddress, setUseProfileAddress] = useState(true);
  const [useLiveLocation, setUseLiveLocation] = useState(false);

  // booking address editable inside Book Worker tab (prefilled with profileData.address)
  const [bookingAddress, setBookingAddress] = useState("");

  // NEW: booking phone editable, prefills from profile/state
  const initialCustomerId =
    state?.customerId || state?.id || localStorage.getItem("customerId") || "";
  const initialName = state?.name || localStorage.getItem("customerName") || "";
  const initialEmail =
    state?.email || localStorage.getItem("customerEmail") || "";
  const initialPhone =
    state?.phone || localStorage.getItem("customerPhone") || "";
  const initialAddress =
    state?.address || localStorage.getItem("customerAddress") || "";

  const [bookingPhone, setBookingPhone] = useState(initialPhone || "");

  // track (global)
  const [trackingId, setTrackingId] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);

  // my bookings
  const [myBookings, setMyBookings] = useState([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);

  // selected booking (for Booking Info tab)
  const [selectedBooking, setSelectedBooking] = useState(null);

  // profile edit
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    id: initialCustomerId,
    name: initialName,
    email: initialEmail,
    phone: initialPhone,
    address: initialAddress,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // blockedDates (strings "YYYY-MM-DD") fetched from backend for selected worker
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  // Keep activeTab in sync with location.state if it changes
  useEffect(() => {
    if (state?.activeTab) setActiveTab(state.activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.activeTab]);

  // keep previews in sync with files
  useEffect(() => {
    // revoke any old preview URLs first
    bookingPhotoPreviews.forEach((p) => p && p.url && URL.revokeObjectURL(p.url));

    const previews = bookingPhotoFiles.map((f) => ({
      id: `${f.name}_${f.size}_${f.lastModified}`,
      url: URL.createObjectURL(f),
      name: f.name,
      size: f.size,
    }));

    setBookingPhotoPreviews(previews);

    // cleanup when unmount
    return () => previews.forEach((p) => p && p.url && URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingPhotoFiles]);

  /* ---------- Profile save ---------- */
  const handleSaveProfile = async () => {
    if (!profileData.name || !profileData.email) {
      alert("Please provide name and email.");
      return;
    }

    setSavingProfile(true);
    try {
      const customerId =
        profileData.id ||
        state?.customerId ||
        state?.id ||
        localStorage.getItem("customerId") ||
        "";

      if (!customerId) {
        alert("No customer ID found. Please login again.");
        setSavingProfile(false);
        return;
      }

      const res = await axios.put(
        `${BASE_URL}/api/customers/${customerId}`,
        {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address || "", // send address as well
        }
      );

      if (res.data?.success) {
        alert("✅ Profile updated successfully!");
        setEditMode(false);

        localStorage.setItem("customerId", customerId);
        localStorage.setItem("customerName", profileData.name);
        localStorage.setItem("customerEmail", profileData.email);
        localStorage.setItem("customerPhone", profileData.phone || "");
        localStorage.setItem("customerAddress", profileData.address || "");

        setProfileData((prev) => ({ ...prev, id: customerId }));
        // also update bookingPhone to reflect saved phone
        setBookingPhone(profileData.phone || "");
      } else {
        alert("❌ Failed to update profile.");
      }
    } catch (err) {
      console.error("Update profile error:", err);
      const msg = err.response?.data?.message || err.message || "Unknown error";
      alert("❌ Error while updating profile: " + msg);
    }
    setSavingProfile(false);
  };

  /* ---------- Change Password ---------- */
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }

    const customerId =
      profileData.id ||
      state?.customerId ||
      state?.id ||
      localStorage.getItem("customerId") ||
      "";

    if (!customerId) {
      alert("No customer ID found. Please login again.");
      return;
    }

    setChangingPassword(true);
    try {
      // Note: backend must expose POST /api/customers/:id/change-password
      const res = await axios.post(`${BASE_URL}/api/customers/${customerId}/change-password`, {
        currentPassword,
        newPassword,
      });

      if (res.data?.success) {
        alert("✅ Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const msg = res.data?.message || "Failed to change password.";
        alert("❌ " + msg);
      }
    } catch (err) {
      console.error("Change password error:", err);
      const msg = err.response?.data?.message || err.message || "Server error";
      alert("❌ Error changing password: " + msg);
    } finally {
      setChangingPassword(false);
    }
  };

  /* ---------- Search workers ---------- */
  const handleSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/workers/search`, {
        params: { pincode, profession },
      });
      setResults(response.data.success ? response.data.workers : []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      alert("Search failed. See console for details.");
    }
    setLoading(false);
  };

  /* ---------- Open booking tab ---------- */
  const handleBookingTab = (worker) => {
    setSelectedWorker(worker);
    setJobDetails("");
    setBookingDate(null);
    setCustomerLocation(null);
    setBookingPhotoFiles([]);
    setBookingPhotoPreviews([]);
    setUseProfileAddress(Boolean(profileData.address));
    setUseLiveLocation(false);
    setBookingAddress(profileData.address || "");
    // set the booking phone to the latest profile phone (editable)
    setBookingPhone(profileData.phone || state?.phone || initialPhone || "");
    setActiveTab("bookWorker");
  };

  /* ---------- When selectedWorker changes, fetch blockedDates ---------- */
  useEffect(() => {
    const fetchBlocked = async () => {
      if (!selectedWorker?._id) {
        setBlockedDates([]);
        return;
      }
      setBlockedLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/workers/${selectedWorker._id}/availability`);
        if (res.data?.success) {
          setBlockedDates(res.data.blockedDates || []);
        } else {
          setBlockedDates([]);
        }
      } catch (err) {
        console.error("Failed to load worker availability:", err);
        setBlockedDates([]);
      } finally {
        setBlockedLoading(false);
      }
    };

    if (activeTab === "bookWorker") {
      fetchBlocked();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorker, activeTab]);

  /* ---------- Photo helpers ---------- */
  const handleAddPhotos = (filesList) => {
    if (!filesList || filesList.length === 0) return;
    const incoming = Array.from(filesList);

    if (bookingPhotoFiles.length + incoming.length > MAX_PHOTOS) {
      alert(`You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }

    for (const f of incoming) {
      if (!f.type.startsWith("image/")) {
        alert("Only image files are allowed.");
        return;
      }
      if (f.size > MAX_PHOTO_MB * 1024 * 1024) {
        alert(`Each image must be <= ${MAX_PHOTO_MB} MB.`);
        return;
      }
    }

    setBookingPhotoFiles((prev) => [...prev, ...incoming]);
  };

  const removePhotoAt = (index) => {
    setBookingPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------- Helper: normalise booking date to YYYY-MM-DD ---------- */
  const normalizeDateToYYYYMMDD = (d) => {
    if (!d) return null;
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return null;
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  /* ---------- Confirm booking (multipart with photos) ---------- */
  const confirmBooking = async () => {
    if (!jobDetails || !bookingDate) {
      alert("❌ Please enter job details and select a date.");
      return;
    }

    if (!selectedWorker || !selectedWorker._id) {
      alert("❌ No worker selected.");
      return;
    }

    const dateStr = normalizeDateToYYYYMMDD(bookingDate);
    if (!dateStr) {
      alert("❌ Invalid booking date.");
      return;
    }

    // Double-check blockedDates
    try {
      const availRes = await axios.get(`${BASE_URL}/api/workers/${selectedWorker._id}/availability`);
      if (availRes.data?.success) {
        const serverBlocked = availRes.data.blockedDates || [];
        if (serverBlocked.includes(dateStr)) {
          alert(`❌ Worker "${selectedWorker.name}" is NOT available on ${dateStr}. Please pick another date or another worker.`);
          return;
        }
      } else {
        alert("❌ Could not verify worker availability. Please try again later.");
        return;
      }
    } catch (err) {
      console.error("Availability check failed:", err);
      alert("❌ Failed to verify worker availability. Please try again.");
      return;
    }

    if (useLiveLocation && !customerLocation) {
      alert("❌ You selected to send your live location but it's not captured yet. Please 'Share My Location' first or uncheck that option.");
      return;
    }

    if (useProfileAddress && !bookingAddress) {
      alert("❌ You selected to send an address but it's empty. Please fill the address or uncheck the option.");
      return;
    }

    // basic phone validation: if provided, prefer 10-digit numeric; ask for confirmation if it looks odd
    if (bookingPhone) {
      const raw = String(bookingPhone).trim();
      if (!/^\d{10}$/.test(raw)) {
        const cont = window.confirm("The phone number looks unusual (expected 10 digits). Continue anyway?");
        if (!cont) return;
      }
    }

    setBookingSubmitting(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append("workerId", selectedWorker._id);
      fd.append("clientName", state?.name || profileData.name || "");
      fd.append("jobDetails", jobDetails);
      fd.append("bookingDate", dateStr);

      // append client phone
      if (bookingPhone) fd.append("clientPhone", String(bookingPhone).trim());

      // address handling
      if (useLiveLocation && customerLocation) {
        fd.append("location", JSON.stringify(customerLocation));
        if (bookingAddress) fd.append("address", bookingAddress);
      } else if (useProfileAddress && bookingAddress) {
        fd.append("address", bookingAddress);
      }

      // append photos under 'photos'
      bookingPhotoFiles.forEach((file) => {
        fd.append("photos", file);
      });

      const res = await axios.post(`${BASE_URL}/api/bookings`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(pct);
          }
        },
      });

      if (res.data?.success) {
        alert(
          `✅ Booking successful! Tracking ID: ${
            res.data.trackingId || res.data.booking?.trackingId || "N/A"
          }`
        );
        // reset booking form
        setBookingPhotoFiles([]);
        setBookingPhotoPreviews([]);
        setJobDetails("");
        setBookingDate(null);
        setCustomerLocation(null);
        setUseLiveLocation(false);
        setUseProfileAddress(Boolean(profileData.address));
        setBookingAddress(profileData.address || "");
        // Note: keep bookingPhone as user might book multiple times

        setActiveTab("myBookings");
        await loadMyBookings();
      } else {
        console.warn("Booking response:", res.data);
        alert("❌ Booking failed. Try again.");
      }
    } catch (error) {
      console.error("Booking error:", error);
      if (error?.response?.data) {
        const serverMsg = error.response.data.message || JSON.stringify(error.response.data);
        alert("❌ Booking failed. Server: " + serverMsg);
      } else {
        alert("❌ Booking failed. Please try again.");
      }
    } finally {
      setBookingSubmitting(false);
      setUploadProgress(0);
    }
  };

  /* ---------- Track request (global) ---------- */
  const handleTrackRequest = async (e) => {
    e.preventDefault();
    if (!trackingId) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/bookings/track/${trackingId}`);
      setTrackingResult(res.data.success ? res.data.booking : null);
      if (!res.data.success) alert("No booking found for that tracking ID.");
    } catch (err) {
      console.error("Track error:", err);
      setTrackingResult(null);
      alert("Track failed. See console for details.");
    }
  };

  /* ---------- Booking Info: open (no tracking button) ---------- */
  const openBookingInfo = (bk) => {
    // bk might be an object (passed from list) or an id
    if (typeof bk === "string") {
      // if id provided, fetch booking (optional)
      (async () => {
        try {
          const res = await axios.get(`${BASE_URL}/api/bookings/${bk}`);
          if (res.data?.success && res.data.booking) {
            setSelectedBooking(res.data.booking);
            setActiveTab("bookingInfo");
          } else {
            alert("Failed to load booking details.");
          }
        } catch (err) {
          console.error("Failed to fetch booking by id:", err);
          alert("Failed to load booking details.");
        }
      })();
    } else {
      setSelectedBooking(bk);
      setActiveTab("bookingInfo");
    }
  };

  /* ---------- Load My Bookings ---------- */
  const loadMyBookings = async () => {
    const customerId =
      profileData.id ||
      state?.customerId ||
      state?.id ||
      localStorage.getItem("customerId") ||
      "";

    const nameFallback =
      profileData.name || state?.name || localStorage.getItem("customerName") || "";

    if (!customerId && !nameFallback) {
      alert("No customer identifier available for loading bookings. Please ensure you're logged in and your profile has a name.");
      return;
    }

    setMyBookingsLoading(true);
    try {
      let res;
      if (customerId) {
        res = await axios.get(`${BASE_URL}/api/bookings/customer/${customerId}`);
        if (res.data?.success) {
          setMyBookings(res.data.bookings || []);
        } else {
          const res2 = await axios.get(`${BASE_URL}/api/bookings/customer`, { params: { name: nameFallback } });
          setMyBookings(res2.data?.bookings || []);
        }
      } else {
        const res2 = await axios.get(`${BASE_URL}/api/bookings/customer`, { params: { name: nameFallback } });
        setMyBookings(res2.data?.bookings || []);
      }
    } catch (err) {
      console.error("Load my bookings error:", err);
      setMyBookings([]);
      alert("Failed to load your bookings. See console for details.");
    } finally {
      setMyBookingsLoading(false);
    }
  };

  /* ---------- Utility to expand upload URL to absolute ---------- */
  const toAbsoluteUrl = (url) => {
    if (!url) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return url.startsWith("/") ? `${BASE_URL}${url}` : `${BASE_URL}/${url}`;
  };

  // highlightDates for DatePicker (convert blockedDates strings to Date objects)
  const highlightDates = useMemo(() => {
    return (blockedDates || []).map((s) => {
      try {
        return parseISO(s);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
  }, [blockedDates]);

  // When user clicks a date in DatePicker we must prevent selecting blocked dates
  const onDateSelect = (date) => {
    const ds = normalizeDateToYYYYMMDD(date);
    if (blockedDates.includes(ds)) {
      alert(`Worker is NOT available on ${ds}. Please choose another date.`);
      return;
    }
    setBookingDate(date);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1f4037, #99f2c8)",
        fontFamily: "Poppins, sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px 10px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "980px",
          background: "#fff",
          borderRadius: "16px",
          padding: "30px",
          boxShadow: "0 10px 35px rgba(0,0,0,0.15)",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "20px", color: "#2c3e50" }}>
          👤 Customer Dashboard
        </h1>

        {/* Tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, borderBottom: "2px solid #eee", marginBottom: "20px" }}>
          {["profile", "search", "bookWorker", "track", "myBookings", "bookingInfo"].map(
            (tab) =>
              ((tab !== "bookWorker" || selectedWorker) && (tab !== "bookingInfo" || selectedBooking)) && (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === "myBookings") loadMyBookings();
                  }}
                  style={tabStyle(activeTab === tab)}
                >
                  {tab === "profile" && "Profile"}
                  {tab === "search" && "Search Worker"}
                  {tab === "bookWorker" && "Book Worker"}
                  {tab === "track" && "Track Request"}
                  {tab === "myBookings" && "My Bookings"}
                  {tab === "bookingInfo" && "Booking Info"}
                </button>
              )
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          {/* Profile */}
          {activeTab === "profile" && (
            <div>
              <h2 style={{ marginBottom: "12px", color: "#2c3e50" }}>📋 Profile Info</h2>
              {!editMode ? (
                <>
                  <p><strong>ID:</strong> {profileData.id || state?.id || "-"}</p>
                  <p><strong>Name:</strong> {profileData.name || state?.name || "-"}</p>
                  <p><strong>Email:</strong> {profileData.email || state?.email || "-"}</p>
                  <p><strong>Phone:</strong> {profileData.phone || state?.phone || "-"}</p>
                  <p><strong>Address:</strong> {profileData.address || state?.address || <em>- no address set -</em>}</p>
                  <button onClick={() => setEditMode(true)} style={btnPrimary}>✏️ Edit Profile</button>
                </>
              ) : (
                <>
                  <input value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} placeholder="Name" style={inputStyle} />
                  <input value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} placeholder="Email" style={inputStyle} />
                  <input value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} placeholder="Phone" style={inputStyle} />
                  <textarea value={profileData.address} onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} placeholder="Address (street, city, pincode, landmark)" style={{ ...inputStyle, minHeight: 80 }} />

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleSaveProfile} disabled={savingProfile} style={btnPrimary}>{savingProfile ? "Saving..." : "Save"}</button>
                    <button onClick={() => { setProfileData({ id: initialCustomerId, name: initialName, email: initialEmail, phone: initialPhone, address: initialAddress }); setEditMode(false); }} style={btnDanger}>Cancel</button>
                  </div>

                  {/* Divider */}
                  <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid #eee" }} />

                  {/* Change Password Section */}
                  <div style={{ marginTop: 8, padding: 12, border: "1px solid #f1f5f9", borderRadius: 8, background: "#fff" }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>🔒 Change Password</div>

                    <input
                      type="password"
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="password"
                      placeholder="New password (min 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={inputStyle}
                    />

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        style={{
                          ...btnPrimary,
                          backgroundColor: changingPassword ? "#93c5fd" : btnPrimary.backgroundColor,
                        }}
                      >
                        {changingPassword ? "Changing..." : "Change Password"}
                      </button>

                      <button
                        onClick={() => {
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        style={{
                          padding: "10px 14px",
                          backgroundColor: "#f3f4f6",
                          color: "#111827",
                          border: "none",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Search */}
          {activeTab === "search" && (
            <div>
              <h2 style={{ marginBottom: "12px", color: "#2c3e50" }}>🔎 Search for Workers</h2>
              <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input type="text" placeholder="Enter Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} style={inputStyle} />
                <select value={profession} onChange={(e) => setProfession(e.target.value)} style={inputStyle}>
                  <option value="">-- Profession (optional) --</option>
                  <option>Plumber</option>
                  <option>Electrician</option>
                  <option>Carpenter</option>
                  <option>Painter</option>
                  <option>Mechanic</option>
                  <option>Cleaner</option>
                  <option>Gardener</option>
                </select>
                <button type="submit" disabled={loading} style={btnPrimary}>{loading ? "Searching..." : "Search"}</button>
              </form>

              <div style={{ marginTop: 12 }}>
                {results.length === 0 ? <p>No workers found</p> : results.map((w) => (
                  <div key={w._id} style={cardStyle}>
                    <h3 style={{ margin: 0 }}>{w.name}</h3>
                    <p><strong>Profession:</strong> {w.profession}</p>
                    <p><strong>Pincode:</strong> {w.pincode}</p>
                    <p><strong>Phone:</strong> {w.mobileNumber}</p>
                    <button onClick={() => handleBookingTab(w)} style={btnSecondary}>📌 Book Worker</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Book Worker */}
          {activeTab === "bookWorker" && selectedWorker && (
            <div>
              <h2>Book Worker: {selectedWorker.name}</h2>
              <p><strong>Profession:</strong> {selectedWorker.profession}</p>
              <p><strong>Pincode:</strong> {selectedWorker.pincode}</p>
              <p><strong>Phone:</strong> {selectedWorker.mobileNumber}</p>

              <textarea placeholder="Enter job details (e.g., Fix leaking pipe)" value={jobDetails} onChange={(e) => setJobDetails(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc", marginTop: 10 }} />

              <div style={{ display: "flex", gap: 20, marginTop: 12, alignItems: "flex-start" }}>
                {/* Left column: fixed width calendar + share location */}
                <div style={{ width: 320 }}>
                  <div style={{ marginBottom: 8, fontWeight: 700 }}>Select booking date</div>
                  <div style={{ borderRadius: 8, overflow: "hidden" }}>
                    <DatePicker
                      inline
                      selected={bookingDate}
                      onChange={onDateSelect}
                      minDate={new Date()}
                      highlightDates={highlightDates}
                      dayClassName={(date) => {
                        const ds = normalizeDateToYYYYMMDD(date);
                        if (blockedDates.includes(ds)) return "blocked-day";
                        if (bookingDate && normalizeDateToYYYYMMDD(bookingDate) === ds) return "selected-day";
                        return "";
                      }}
                    />
                  </div>

                  {blockedLoading && <div style={{ marginTop: 8, color: "#666" }}>Loading availability…</div>}
                  {!blockedLoading && blockedDates.length > 0 && (
                    <div style={{ marginTop: 8, color: "#9b1c1c" }}>
                      ⚠️ Red dates are NOT available for this worker.
                    </div>
                  )}

                  {/* Move Share My Location under the calendar */}
                  <div style={{ marginTop: 12 }}>
                    <button onClick={() => {
                      if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
                      navigator.geolocation.getCurrentPosition((pos) => {
                        setCustomerLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                        setUseLiveLocation(true);
                        alert("✅ Location captured successfully! Live location will be sent with booking (if selected).");
                      }, (err) => {
                        console.error(err);
                        alert("❌ Unable to fetch location. Please allow location access.");
                      });
                    }} style={{ padding: "10px 14px", borderRadius: 8, background: "#6b7280", color: "#fff", border: "none", cursor: "pointer", width: "100%" }}>
                      Share My Location
                    </button>

                    {customerLocation && <div style={{ marginTop: 8, color: "#475569" }}>Location captured: {customerLocation.latitude.toFixed(5)}, {customerLocation.longitude.toFixed(5)}</div>}
                  </div>
                </div>

                {/* Right column: address, phone, photos, buttons */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginTop: 4 }}>
                    {/* Address options + editable booking address */}
                    <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 8, boxSizing: "border-box", overflow: "hidden" }}>
                      {useProfileAddress && (
                        <div style={{ marginLeft: 0 }}>
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>Address to send with booking (editable)</div>
                          <textarea
                            value={bookingAddress}
                            onChange={(e) => setBookingAddress(e.target.value)}
                            placeholder="Address for worker (you can edit this before sending)"
                            style={{
                              width: "100%",
                              padding: 10,
                              borderRadius: 8,
                              border: "1px solid #ccc",
                              minHeight: 120,
                              maxHeight: 220,
                              boxSizing: "border-box",
                              resize: "vertical",
                            }}
                          />

                          {/* NEW: phone input */}
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Mobile number to send with booking</div>
                            <input
                              type="tel"
                              value={bookingPhone}
                              onChange={(e) => setBookingPhone(e.target.value)}
                              placeholder="Your mobile number (10 digits)"
                              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}
                            />
                            <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
                              This number will be sent to the worker along with the booking.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photo attachments */}
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontWeight: 700 }}>Attach photos (optional):</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => handleAddPhotos(e.target.files)} style={{ display: "block", marginTop: 8 }} />
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {bookingPhotoPreviews.map((p, i) => (
                        <div key={p.id} style={{ width: 140, borderRadius: 8, overflow: "hidden", border: "1px solid #e6e9ee", position: "relative" }}>
                          <img src={p.url} alt={p.name} style={{ width: "100%", height: 100, objectFit: "cover" }} />
                          <button onClick={() => removePhotoAt(i)} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 6px", cursor: "pointer" }}>X</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, color: "#6b7280" }}>{bookingPhotoFiles.length}/{MAX_PHOTOS} photos attached</div>
                  </div>

                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button onClick={confirmBooking} disabled={bookingSubmitting} style={{ padding: 12, borderRadius: 8, background: "#10b981", color: "#fff", border: "none", fontWeight: 700 }}>
                      {bookingSubmitting ? `Submitting... ${uploadProgress}%` : "Confirm Booking"}
                    </button>
                    <button onClick={() => { setActiveTab("search"); setSelectedWorker(null); }} style={{ padding: 12, borderRadius: 8, background: "#ef4444", color: "#fff", border: "none", fontWeight: 700 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              <style>{`
                /* Style for blocked (not available) days in the DatePicker */
                .blocked-day {
                  background: #fecaca !important; /* light red */
                  color: #9b1c1c !important;      /* darker red text */
                  border-radius: 6px;
                  font-weight: 700;
                }
                /* custom selected day style */
                .selected-day {
                  background: #34d399 !important; /* green */
                  color: #ffffff !important;
                  border-radius: 6px;
                  font-weight: 700;
                }
                /* ensure datepicker doesn't overflow its container */
                .react-datepicker {
                  box-sizing: border-box;
                }
              `}</style>
            </div>
          )}

          {/* Track */}
          {activeTab === "track" && (
            <div>
              <h2>📍 Track Your Request</h2>
              <form onSubmit={handleTrackRequest} style={{ display: "flex", gap: 10 }}>
                <input type="text" placeholder="Enter Tracking ID" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} style={inputStyle} />
                <button type="submit" style={btnPrimary}>Track</button>
              </form>

              {trackingResult ? (
                <div style={cardStyle}>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 12,
                        fontWeight: 600,
                        color: "#fff",
                        backgroundColor:
                          trackingResult.status === "pending"
                            ? "#f39c12"
                            : trackingResult.status === "confirmed"
                            ? "#3498db"
                            : trackingResult.status === "completed"
                            ? "#2ecc71"
                            : "#e74c3c",
                      }}
                    >
                      {String(trackingResult.status).charAt(0).toUpperCase() + String(trackingResult.status).slice(1)}
                    </span>
                  </p>

                  <p><strong>Job:</strong> {trackingResult.jobDetails}</p>
                  <p><strong>Date:</strong> {new Date(trackingResult.bookingDate).toLocaleDateString()}</p>

                  {trackingResult.address && <p><strong>Address:</strong> {trackingResult.address}</p>}

                  {trackingResult.photos && trackingResult.photos.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 700 }}>Photos</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        {trackingResult.photos.map((u, i) => (
                          <a key={i} href={toAbsoluteUrl(u)} target="_blank" rel="noreferrer" style={{ width: 120, height: 80 }}>
                            <img src={toAbsoluteUrl(u)} alt={`photo-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                trackingId && <p>No booking found with this ID.</p>
              )}
            </div>
          )}

          {/* My Bookings — Vertical Compact Card with Icons */}
          {activeTab === "myBookings" && (
            <div>
              <h2 style={{ marginBottom: "15px", color: "#1e293b" }}>📚 My Bookings</h2>

              {myBookingsLoading && <p style={{ color: "#64748b" }}>Loading your bookings…</p>}

              {!myBookingsLoading && myBookings.length === 0 && (
                <p style={{ color: "#64748b" }}>No bookings found for your account yet.</p>
              )}

              {!myBookingsLoading && myBookings.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "center" }}>
                  {myBookings.map((bk) => {
                    const worker = bk.workerId && typeof bk.workerId === "object" ? bk.workerId : {};
                    const workerName = worker.name || bk.workerName || "Unknown";
                    const workerProfession = worker.profession || bk.profession || "-";
                    const workerPhone = worker.mobileNumber || worker.mobile || bk.phone || "-";
                    const workerPhoto = worker.photo ? toAbsoluteUrl(worker.photo) : null;
                    const key = bk._id || bk.trackingId;

                    return (
                      <div
                        key={key}
                        style={{
                          width: "85%",
                          background: "#fff",
                          borderRadius: "12px",
                          padding: "16px",
                          boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                          border: "1px solid #f1f5f9",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {/* Worker Info */}
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: "6px 0" }}>
                              <strong>👷 Worker:</strong> {workerName}
                            </p>
                            <p style={{ margin: "6px 0" }}>
                              <strong>🛠 Profession:</strong> {workerProfession}
                            </p>
                            <p style={{ margin: "6px 0" }}>
                              <strong>📞 Phone:</strong> {workerPhone}
                            </p>
                          </div>

                          {/* Worker Photo */}
                          {workerPhoto && (
                            <img
                              src={workerPhoto}
                              alt={workerName}
                              style={{
                                width: 80,
                                height: 80,
                                objectFit: "cover",
                                borderRadius: "10px",
                                border: "2px solid #e2e8f0",
                              }}
                            />
                          )}
                        </div>

                        <hr style={{ margin: "12px 0", border: "none", borderTop: "1px solid #e5e7eb" }} />

                        {/* Booking Info */}
                        <p style={{ margin: "6px 0" }}>
                          <strong>🔖 Tracking Code:</strong> {bk.trackingId}
                        </p>
                        <p style={{ margin: "6px 0" }}>
                          <strong>📋 Job:</strong> {bk.jobDetails}
                        </p>
                        <p style={{ margin: "6px 0" }}>
                          <strong>📅 Date:</strong>{" "}
                          {bk.bookingDate ? new Date(bk.bookingDate).toLocaleDateString() : "-"}
                        </p>

                        <div style={{ marginTop: 12 }}>
                          <button
                            onClick={() => openBookingInfo(bk)}
                            style={{
                              padding: "8px 14px",
                              border: "none",
                              borderRadius: 6,
                              background: "#2563eb",
                              color: "#fff",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Booking Info */}
          {activeTab === "bookingInfo" && selectedBooking && (
            <div>
              <h2>Booking Info</h2>

              {/* worker info */}
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {selectedBooking.workerId && typeof selectedBooking.workerId === "object" && selectedBooking.workerId.photo && (
                  <img src={toAbsoluteUrl(selectedBooking.workerId.photo)} alt="worker" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }} />
                )}
                <div>
                  <p><strong>Worker:</strong> {selectedBooking.workerId && typeof selectedBooking.workerId === "object" ? selectedBooking.workerId.name : (selectedBooking.workerName || "Unknown")}</p>
                  <p><strong>Profession:</strong> {selectedBooking.workerId && typeof selectedBooking.workerId === "object" ? selectedBooking.workerId.profession : (selectedBooking.profession || "-")}</p>
                  <p><strong>Phone:</strong> {selectedBooking.workerId && typeof selectedBooking.workerId === "object" ? (selectedBooking.workerId.mobileNumber || "-") : (selectedBooking.phone || "-")}</p>
                  <p><strong>Pincode:</strong> {selectedBooking.workerId && typeof selectedBooking.workerId === "object" ? (selectedBooking.workerId.pincode || "-") : (selectedBooking.pincode || "-")}</p>
                </div>
              </div>

              <hr style={{ margin: "12px 0", border: "none", borderTop: "1px solid #eee" }} />

              <p><strong>Tracking ID:</strong> {selectedBooking.trackingId}</p>
              <p><strong>Client Phone:</strong> {selectedBooking.clientPhone || <em>Not provided</em>}</p>
              <p><strong>Job Details:</strong> {selectedBooking.jobDetails}</p>
              {/* show only date (no time) */}
              <p><strong>Booking Date:</strong> {selectedBooking.bookingDate ? new Date(selectedBooking.bookingDate).toLocaleDateString() : "-"}</p>

              {selectedBooking.location && selectedBooking.location.latitude && selectedBooking.location.longitude && (
                <p>
                  <strong>Location:</strong>{" "}
                  <a href={selectedBooking.location.googleMapsUrl || toAbsoluteUrl(selectedBooking.location)} target="_blank" rel="noreferrer">Open in Google Maps</a>
                </p>
              )}

              {selectedBooking.address && (
                <p><strong>Address:</strong> {selectedBooking.address}</p>
              )}

              {/* booking photos */}
              {selectedBooking.photos && selectedBooking.photos.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 700 }}>Booking Photos</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    {selectedBooking.photos.map((u, i) => (
                      <a key={i} href={toAbsoluteUrl(u)} target="_blank" rel="noreferrer" style={{ width: 120, height: 80 }}>
                        <img src={toAbsoluteUrl(u)} alt={`bk-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button onClick={() => setActiveTab("myBookings")} style={btnSecondary}>Back to My Bookings</button>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        {activeTab === "profile" && (
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => {
                localStorage.removeItem("customerId");
                localStorage.removeItem("customerName");
                localStorage.removeItem("customerEmail");
                localStorage.removeItem("customerPhone");
                localStorage.removeItem("customerAddress");
                navigate("/");
              }}
              style={btnDanger}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- Styles ---------- */
const tabStyle = (isActive) => ({
  flex: 1,
  padding: "10px 12px",
  minWidth: 120,
  background: isActive ? "#3498db" : "transparent",
  color: isActive ? "#fff" : "#2c3e50",
  border: "none",
  borderRadius: "8px 8px 0 0",
  fontWeight: "600",
  cursor: "pointer",
});

const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "14px",
  marginBottom: "10px",
  width: "100%",
  boxSizing: "border-box",
};

const btnPrimary = {
  padding: "10px 14px",
  backgroundColor: "#3498db",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
  marginTop: "10px",
};

const btnSecondary = {
  padding: "10px 14px",
  backgroundColor: "#2ecc71",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
  marginTop: "10px",
};

const btnDanger = {
  marginTop: "20px",
  width: "100%",
  padding: "12px",
  backgroundColor: "#e74c3c",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
};

const cardStyle = {
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "20px",
  background: "#f9f9f9",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

/* ---------- Helper: normalize date -> YYYY-MM-DD (used elsewhere too) ---------- */
function normalizeDateToYYYYMMDD(d) {
  if (!d) return null;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return null;
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default CustomerDashboard;
