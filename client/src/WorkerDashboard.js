// src/WorkerDashboard.js
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from "date-fns";

const BASE_URL = "https://doable-ojum.onrender.com"; // adjust if needed
const TERMINAL_STATUSES = ["completed", "cancelled"];

const WorkerDashboard = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null); // for booking details view

  const [profile, setProfile] = useState({
    workerId: state?.workerId || state?.id,
    name: state?.name || "",
    profession: state?.profession || "",
    mobileNumber: state?.mobileNumber || "",
    pincode: state?.pincode || "",
    area: state?.area || "",
    city: state?.city || "",
    photoUrl: null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ ...profile, password: "" });
  const [newPhotoFile, setNewPhotoFile] = useState(null);

  // status update state
  const [statusUpdating, setStatusUpdating] = useState(false);
  // delete state
  const [deleting, setDeleting] = useState(false);

  // --- ENHANCEMENTS: booking tab only ---
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 5;
  const statusOptions = ["", "pending", "confirmed", "completed", "cancelled"];

  // --- photo upload state for booking details (kept for potential reuse) ---
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ---------------- AVAILABILITY STATE (minimal) ----------------
  // availDates will hold the blockedDates (NOT available dates) as 'YYYY-MM-DD' strings
  const [availDates, setAvailDates] = useState([]); // array of "YYYY-MM-DD"
  const [availSelected, setAvailSelected] = useState(null); // JS Date
  const [availLoading, setAvailLoading] = useState(false);
  const [availMsg, setAvailMsg] = useState("");

  const http = axios.create({ baseURL: BASE_URL });

  // load photo
  useEffect(() => {
    if (profile.workerId) {
      axios
        .get(`${BASE_URL}/api/workers/${profile.workerId}/photo`)
        .then((res) => {
          if (res.data?.success && res.data.photoUrl) {
            setProfile((p) => ({
              ...p,
              photoUrl: `${BASE_URL}${res.data.photoUrl}`,
            }));
          }
        })
        .catch((err) => console.error("Failed to load photo:", err));
    }
  }, [profile.workerId]);

  // load bookings (when booking tab selected)
  useEffect(() => {
    if (activeTab === "booking" && profile.workerId) {
      axios
        .get(`${BASE_URL}/api/bookings/worker/${profile.workerId}`)
        .then((res) => {
          if (res.data.success) setBookings(res.data.bookings || []);
        })
        .catch((err) => console.error("Failed to load bookings:", err));
    }
  }, [activeTab, profile.workerId]);

  // fetch availability when Availability tab opened or when workerId changes
  useEffect(() => {
    if (activeTab === "availability" && profile.workerId) {
      fetchAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profile.workerId]);

  // ---------- FETCH AVAILABILITY (blockedDates) ----------
  async function fetchAvailability() {
    setAvailLoading(true);
    try {
      // GET /api/workers/:id/availability should return { blockedDates, workingHours, ... }
      const res = await http.get(`/api/workers/${profile.workerId}/availability`);
      if (res.data?.success) {
        setAvailDates(res.data.blockedDates || []);
      } else {
        setAvailDates([]);
      }
    } catch (err) {
      console.error("Fetch availability error:", err);
      setAvailDates([]);
    } finally {
      setAvailLoading(false);
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const saveProfile = async () => {
    if (form.pincode && String(form.pincode).length !== 6) {
      alert("Pincode must be exactly 6 digits.");
      return;
    }
    if (form.mobileNumber && !/^\d{10}$/.test(form.mobileNumber)) {
      alert("Mobile number must be exactly 10 digits.");
      return;
    }

    try {
      // upload new photo if (newPhotoFile)
      if (newPhotoFile) {
        const fd = new FormData();
        fd.append("photo", newPhotoFile);
        const upRes = await axios.post(
          `${BASE_URL}/api/workers/${profile.workerId}/photo`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        if (upRes.data?.success && upRes.data.photoUrl) {
          setProfile((p) => ({ ...p, photoUrl: `${BASE_URL}${upRes.data.photoUrl}` }));
        }
      }
      // update fields
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const res = await axios.put(`${BASE_URL}/api/auth/profile/${profile.workerId}`, payload);
      if (res.data?.success) {
        setProfile((p) => ({ ...p, ...res.data.worker }));
        setIsEditing(false);
        setNewPhotoFile(null);
        setForm((f) => ({ ...f, password: "" }));
        alert("✅ Profile updated successfully.");
      } else {
        alert(res.data?.message || "Profile update failed.");
      }
    } catch (err) {
      console.error("Update failed:", err);
      alert(err.response?.data?.message || "Profile update failed.");
    }
  };

  // ---------- Booking status update handler ----------
  const handleChangeBookingStatus = async (newStatus) => {
    if (!selectedBooking) return;
    const bookingId = selectedBooking._id;

    // Prevent any change if booking is already in a terminal status
    if (TERMINAL_STATUSES.includes(selectedBooking.status) && selectedBooking.status !== newStatus) {
      alert(`This booking is already "${selectedBooking.status}" and cannot be changed.`);
      return;
    }

    // If no actual change, do nothing
    if (selectedBooking.status === newStatus) return;

    // optimistic update copy
    const prevBookings = bookings.slice();
    const prevSelected = { ...selectedBooking };

    try {
      setStatusUpdating(true);

      // optimistic UI: update selectedBooking and bookings state
      const updatedLocalBooking = { ...selectedBooking, status: newStatus };
      setSelectedBooking(updatedLocalBooking);
      setBookings((list) => list.map((b) => (b._id === bookingId ? { ...b, status: newStatus } : b)));

      // send request to backend
      const res = await axios.put(`${BASE_URL}/api/bookings/${bookingId}/status`, { status: newStatus });

      if (res.data?.success) {
        // ensure server canonical booking used
        const serverBooking = res.data.booking;

        // If server returned a terminal status, make sure UI reflects immutability
        setSelectedBooking(serverBooking);
        setBookings((list) => list.map((b) => (b._id === bookingId ? serverBooking : b)));
      } else {
        // revert if server reports failure
        setSelectedBooking(prevSelected);
        setBookings(prevBookings);
        alert(res.data?.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("Status update failed:", err);
      // revert optimistic UI
      setSelectedBooking(prevSelected);
      setBookings(prevBookings);
      alert(err.response?.data?.message || "Failed to update status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  // ---------- Worker upload a photo to booking ----------
  // kept for potential reuse
  const uploadPhotoToBooking = async (file) => {
    if (!selectedBooking) return;
    const bookingId = selectedBooking._id;
    if (!file) {
      alert("No file selected.");
      return;
    }

    try {
      setUploadingPhoto(true);
      setUploadProgress(0);

      const fd = new FormData();
      fd.append("photo", file);

      const res = await axios.post(`${BASE_URL}/api/bookings/${bookingId}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (ev.total) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setUploadProgress(pct);
          }
        },
      });

      if (res.data?.success && res.data.booking) {
        const updatedBooking = res.data.booking;
        // update selectedBooking and bookings list
        setSelectedBooking(updatedBooking);
        setBookings((list) => list.map((b) => (b._id === bookingId ? updatedBooking : b)));
        alert("✅ Photo uploaded and attached to booking.");
      } else {
        alert(res.data?.message || "Failed to upload booking photo.");
      }
    } catch (err) {
      console.error("Upload booking photo failed:", err);
      alert(err.response?.data?.message || "Failed to upload booking photo.");
    } finally {
      setUploadingPhoto(false);
      setUploadProgress(0);
    }
  };

  // ---------- Delete booking (only allowed after lock) ----------
  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;
    const bookingId = selectedBooking._id;
    if (!TERMINAL_STATUSES.includes(selectedBooking.status)) {
      alert("You can only delete bookings that are completed or cancelled.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this booking? This action cannot be undone for your dashboard (customer will still see it).")) {
      return;
    }

    const prevBookings = bookings.slice();
    // candidate endpoints to try (order matters)
    const candidates = [
      `${BASE_URL}/api/bookings/${bookingId}`, // most common
      `${BASE_URL}/api/bookings/delete/${bookingId}`, // some backends use this
      `${BASE_URL}/api/bookings/${bookingId}/delete`, // another possible pattern
    ];

    try {
      setDeleting(true);
      // optimistic remove from list and UI
      setBookings((list) => list.filter((b) => b._id !== bookingId));
      setSelectedBooking(null);
      setActiveTab("booking");
      let lastErr = null;

      for (const url of candidates) {
        console.log("Attempting DELETE:", url, "with x-worker-id:", profile?.workerId);
        try {
          const res = await axios.delete(url, {
            headers: {
              "x-worker-id": profile?.workerId,
            },
          });
          if (res.status === 200 || res.status === 204 || res.data?.success) {
            console.log("Delete success response:", res.data || res.status);
            alert("✅ Booking deleted from your dashboard (customer still sees it).");
            return;
          } else {
            console.warn("Unexpected delete response:", res.status, res.data);
            lastErr = new Error("Unexpected delete response: " + JSON.stringify(res.data || res.status));
            break;
          }
        } catch (err) {
          lastErr = err;
          console.warn(`DELETE ${url} failed. status:`, err.response?.status, "data:", err.response?.data, "message:", err.message);
          if (err.response?.status === 404) {
            continue;
          }
          break;
        }
      }

      setBookings(prevBookings);

      let friendly = "Delete failed.";
      if (lastErr) {
        if (lastErr.response && lastErr.response.data) {
          const data = lastErr.response.data;
          const serverMsg = typeof data === "string" ? data : data.message || JSON.stringify(data);
          friendly += ` Server response: ${serverMsg}`;
        } else if (lastErr.message) {
          friendly += ` ${lastErr.message}`;
        }
      }
      console.error("Delete attempts finished. Last error object:", lastErr);
      alert(friendly);
    } catch (err) {
      setBookings(prevBookings);
      console.error("Unexpected error in handleDeleteBooking:", err);
      alert("Delete failed: " + (err.message || err));
    } finally {
      setDeleting(false);
    }
  };

  // ---------------- enhanced booking tab helpers ----------------
  const filteredSortedBookings = useMemo(() => {
    let list = (bookings || []).slice();

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(
        (b) =>
          (b.clientName || "").toLowerCase().includes(q) ||
          (b.jobDetails || "").toLowerCase().includes(q) ||
          (String(b._id || "")).toLowerCase().includes(q)
      );
    }

    if (filterStatus) {
      list = list.filter((b) => b.status === filterStatus);
    }

    list.sort((a, b) => {
      const da = new Date(a.bookingDate).getTime();
      const db = new Date(b.bookingDate).getTime();
      if (sortBy === "date_asc") return da - db;
      if (sortBy === "date_desc") return db - da;
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      return db - da;
    });

    return list;
  }, [bookings, searchText, filterStatus, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredSortedBookings.length / PER_PAGE));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const pageBookings = filteredSortedBookings.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // helper to convert server photo path to absolute url
  const photoToUrl = (p) => {
    if (!p) return null;
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return p.startsWith("/") ? `${BASE_URL}${p}` : `${BASE_URL}/${p}`;
  };

  // ---------------- AVAILABILITY helpers (minimal) ----------------
  function formatDate(d) {
    if (!d) return null;
    return format(d, "yyyy-MM-dd");
  }

  // MARK a date as NOT available (blocked) -> adds to blockedDates on backend
  async function markNotAvailable() {
    const ds = formatDate(availSelected);
    if (!ds) {
      setAvailMsg("Pick a date first.");
      setTimeout(() => setAvailMsg(""), 2000);
      return;
    }

    // already blocked?
    if (availDates.includes(ds)) {
      setAvailMsg(`${ds} is already marked not available.`);
      setTimeout(() => setAvailMsg(""), 2000);
      return;
    }

    setAvailLoading(true);
    try {
      // use existing blocked-dates endpoint: action "add"
      const res = await http.post(`/api/workers/${profile.workerId}/blocked-dates`, { action: "add", dates: [ds] });
      if (res.data?.success) {
        // server returns updated blockedDates
        const updated = res.data.blockedDates || [];
        setAvailDates(updated);
        setAvailMsg(`Marked ${ds} as NOT available.`);
      } else {
        setAvailMsg(res.data?.message || "Mark failed.");
      }
    } catch (err) {
      console.error("Mark not available failed:", err);
      setAvailMsg(err.response?.data?.message || "Mark failed.");
    } finally {
      setAvailLoading(false);
      setTimeout(() => setAvailMsg(""), 2200);
    }
  }

  // UNBLOCK a date -> removes from blockedDates on backend
  async function unblockDate() {
    const ds = formatDate(availSelected);
    if (!ds) {
      setAvailMsg("Pick a date first.");
      setTimeout(() => setAvailMsg(""), 2000);
      return;
    }
    if (!availDates.includes(ds)) {
      setAvailMsg(`${ds} is not blocked.`);
      setTimeout(() => setAvailMsg(""), 2000);
      return;
    }

    if (!window.confirm(`Mark ${ds} as available again?`)) return;

    setAvailLoading(true);
    try {
      const res = await http.post(`/api/workers/${profile.workerId}/blocked-dates`, { action: "remove", dates: [ds] });
      if (res.data?.success) {
        const updated = res.data.blockedDates || [];
        setAvailDates(updated);
        setAvailMsg(`Unblocked ${ds}.`);
      } else {
        setAvailMsg(res.data?.message || "Unblock failed.");
      }
    } catch (err) {
      console.error("Unblock failed:", err);
      setAvailMsg(err.response?.data?.message || "Unblock failed.");
    } finally {
      setAvailLoading(false);
      setTimeout(() => setAvailMsg(""), 2200);
    }
  }

  const highlightDates = useMemo(() => {
    return (availDates || []).map(d => {
      try { return parseISO(d); } catch (e) { return null; }
    }).filter(Boolean);
  }, [availDates]);

  // ---------- NEW: helper to build worker address for display ----------
  const buildWorkerAddress = (booking) => {
    // booking may have workerId populated as object or may be an id string
    const workerObj = booking?.workerId && typeof booking.workerId === "object" ? booking.workerId : null;

    // priority 1: explicit address field on worker object
    if (workerObj && workerObj.address) {
      return String(workerObj.address).trim();
    }

    // priority 2: compose from workerObj fields (area, city, pincode)
    if (workerObj) {
      const parts = [];
      if (workerObj.area) parts.push(String(workerObj.area).trim());
      if (workerObj.city) parts.push(String(workerObj.city).trim());
      if (workerObj.pincode) parts.push(String(workerObj.pincode).trim());
      const composed = parts.join(", ");
      if (composed) return composed;
    }

    // priority 3: fall back to current logged-in profile fields (area/city/pincode)
    const parts = [];
    if (profile.area) parts.push(String(profile.area).trim());
    if (profile.city) parts.push(String(profile.city).trim());
    if (profile.pincode) parts.push(String(profile.pincode).trim());
    const fallback = parts.join(", ");
    if (fallback) return fallback;

    // nothing available
    return null;
  };

  // ---------- NEW: helper to retrieve customer phone robustly ----------
  const getCustomerPhone = (b) => {
    if (!b) return null;
    // check multiple possible field names commonly used
    return b.clientPhone || b.client_phone || b.phone || b.mobile || b.customerPhone || null;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #2c3e50, #3498db)",
        fontFamily: "Poppins, sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "950px",
          background: "#fff",
          borderRadius: "16px",
          padding: "30px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "30px", color: "#2c3e50" }}> 👷 Worker Dashboard </h1>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid #eee", marginBottom: "20px" }}>
          <button onClick={() => setActiveTab("profile")} style={tabStyle(activeTab === "profile")}>
            Profile
          </button>
          <button
            onClick={() => {
              setSelectedBooking(null);
              setActiveTab("booking");
            }}
            style={tabStyle(activeTab === "booking")}
          >
            My Bookings
          </button>
          <button
            onClick={() => {
              setActiveTab("availability");
              setSelectedBooking(null);
            }}
            style={tabStyle(activeTab === "availability")}
          >
            Availability
          </button>
          {selectedBooking && (
            <button onClick={() => setActiveTab("bookingDetails")} style={tabStyle(activeTab === "bookingDetails")}>
              Booking Details
            </button>
          )}
        </div>

        {/* PROFILE (left unchanged) */}
        {activeTab === "profile" && (
          <div style={{ padding: "20px" }}>
            {!isEditing ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
                <div style={{ flex: 1 }}>
                  <div style={cardStyle}>
                    <p><strong>ID:</strong> {profile.workerId}</p>
                    <p><strong>Name:</strong> {profile.name}</p>
                    <p><strong>Profession:</strong> {profile.profession || "N/A"}</p>
                    <p><strong>Mobile:</strong> {profile.mobileNumber || "N/A"}</p>
                    <p><strong>Pincode:</strong> {profile.pincode || "N/A"}</p>
                    <p><strong>Area:</strong> {profile.area || "N/A"}</p>
                    <p><strong>City:</strong> {profile.city || "N/A"}</p>
                  </div>
                  <button onClick={() => setIsEditing(true)} style={btnPrimary}> ✏️ Edit Profile </button>
                </div>

                <div style={{ textAlign: "center" }}>
                  {profile.photoUrl ? (
                    <img src={profile.photoUrl} alt="Worker" style={{ width: 180, height: 180, borderRadius: "12px", objectFit: "cover", border: "3px solid #3498db" }} />
                  ) : (
                    <div style={{ width: 180, height: 180, borderRadius: "12px", background: "#eee", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "14px", color: "#888" }}>
                      No Photo
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
                <div style={{ flex: 1 }}>
                  <div style={cardStyle}>
                    <h3>Edit Profile</h3>
                    <div style={{ display: "grid", gap: "12px" }}>
                      <input name="name" value={form.name} onChange={handleFormChange} style={inputStyle} placeholder="Name" />
                      <select name="profession" value={form.profession} onChange={handleFormChange} style={inputStyle}>
                        <option value="">-- Select Profession --</option>
                        <option>Plumber</option>
                        <option>Electrician</option>
                        <option>Carpenter</option>
                        <option>Painter</option>
                        <option>Mechanic</option>
                        <option>Cleaner</option>
                        <option>Gardener</option>
                      </select>
                      <input name="mobileNumber" value={form.mobileNumber} onChange={handleFormChange} style={inputStyle} placeholder="Mobile (10 digits)" />
                      <input name="pincode" value={form.pincode} onChange={handleFormChange} style={inputStyle} placeholder="Pincode (6 digits)" />
                      <input name="area" value={form.area} onChange={handleFormChange} style={inputStyle} placeholder="Area" />
                      <input name="city" value={form.city} onChange={handleFormChange} style={inputStyle} placeholder="City" />
                      <input type="password" name="password" value={form.password} onChange={handleFormChange} style={inputStyle} placeholder="New Password (optional)" />
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                      <button onClick={saveProfile} style={btnSuccess}>💾 Save</button>
                      <button onClick={() => setIsEditing(false)} style={btnCancel}>❌ Cancel</button>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  {profile.photoUrl ? (
                    <img src={profile.photoUrl} alt="Worker" style={{ width: 180, height: 180, borderRadius: "12px", objectFit: "cover", border: "3px solid #3498db", marginBottom: "10px" }} />
                  ) : (
                    <div style={{ width: 180, height: 180, borderRadius: "12px", background: "#eee", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "14px", color: "#888", marginBottom: "10px" }} >
                      No Photo
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => setNewPhotoFile(e.target.files[0])} />
                  {newPhotoFile && <small>📷 {newPhotoFile.name}</small>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- BOOKING TAB: (unchanged except customer phone shown) --- */}
        {activeTab === "booking" && (
          <div style={{ padding: "8px 0 0 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <h2 style={{ margin: 0, color: "#2c3e50" }}>My Bookings</h2>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search client, job or id..."
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid #e6eef8",
                    width: 420,
                    outline: "none",
                    fontSize: 14,
                  }}
                />

                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e6eef8",
                    minWidth: 160,
                    background: "#fff",
                    fontSize: 14,
                  }}
                >
                  <option value="">All statuses</option>
                  {statusOptions.filter(Boolean).map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e6eef8",
                    minWidth: 140,
                    fontSize: 14,
                  }}
                >
                  <option value="date_desc">Date ↓</option>
                  <option value="date_asc">Date ↑</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {pageBookings.length === 0 ? (
                <div style={{ padding: 28, color: "#6b7280", textAlign: "center", borderRadius: 12, background: "#fbfcfd" }}>
                  No bookings found.
                </div>
              ) : (
                pageBookings.map((b) => {
                  const customerPhone = getCustomerPhone(b);
                  return (
                    <div
                      key={b._id}
                      onClick={() => {
                        setSelectedBooking(b);
                        setActiveTab("bookingDetails");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "18px 20px",
                        borderRadius: 12,
                        background: "#fff",
                        boxShadow: "0 8px 22px rgba(2,6,23,0.06)",
                        border: "1px solid #f1f5f9",
                        cursor: "pointer",
                      }}
                    >
                      {/* left: avatar + details */}
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <AvatarSquare name={b.clientName} />
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <div style={{ fontWeight: 800, fontSize: 16, textTransform: "capitalize", color: "#0b2b4a" }}>
                            {b.clientName || "Unknown"}
                          </div>
                          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                            #{String(b._id).slice(-6)}
                          </div>

                          {/* show customer phone inline (if available) */}
                          {customerPhone && (
                            <div style={{ marginTop: 8, fontSize: 13, color: "#475569" }}>
                              📞 <a href={`tel:${customerPhone}`} style={{ color: "#0b2b4a", fontWeight: 700, textDecoration: "none" }}>{customerPhone}</a>
                            </div>
                          )}

                          <div style={{ marginTop: 10, color: "#344055" }}>{b.jobDetails || ""}</div>

                          {/* small photos preview line */}
                          {b.photos && b.photos.length > 0 && (
                            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                              {b.photos.slice(0, 4).map((p, i) => (
                                <img key={i} src={photoToUrl(p)} alt={`thumb-${i}`} style={{ width: 56, height: 40, objectFit: "cover", borderRadius: 8, border: "1px solid #eef2f7" }} />
                              ))}
                              {b.photos.length > 4 && (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 56, height: 40, borderRadius: 8, background: "#eef2f7", color: "#475569", fontWeight: 700 }}>
                                  +{b.photos.length - 4}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* right: date / status / click */}
                      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                        <div style={{ textAlign: "right", color: "#7b8794", fontSize: 13 }}>
                          {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : ""}
                        </div>
                        <div>
                          <StatusPill status={b.status} />
                        </div>
                        <div style={{ color: "#8b90a0", fontWeight: 700 }}>Click →</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* footer: showing X-Y of Z + pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
              <div style={{ color: "#6b7280" }}>
                Showing {filteredSortedBookings.length === 0 ? 0 : Math.min((currentPage - 1) * PER_PAGE + 1, filteredSortedBookings.length)}-
                {Math.min(currentPage * PER_PAGE, filteredSortedBookings.length)} of {filteredSortedBookings.length}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #e6eef8",
                    background: "#fff",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Prev
                </button>
                <div style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e6eef8", background: "#fbfcfd" }}>
                  <strong>{currentPage}</strong> / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #e6eef8",
                    background: "#fff",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AVAILABILITY TAB (minimal add/remove blocked days) */}
       {/* AVAILABILITY TAB (calendar only, blocked-dates panel removed) */}
{activeTab === "availability" && (
  <div style={{ padding: "8px 4px" }}>
    <h2 style={{ color: "#2c3e50", marginBottom: 12 }}>Availability</h2>

    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18, alignItems: "start" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 14, boxShadow: "0 6px 18px rgba(2,6,23,0.06)", border: "1px solid #eef2f7" }}>
        <DatePicker
          inline
          selected={availSelected}
          onChange={(d) => setAvailSelected(d)}
          highlightDates={highlightDates}
          minDate={new Date()}
          dayClassName={(date) => {
            const ds = formatDate(date);
            if (availDates.includes(ds)) return "blocked-day";
            if (availSelected && formatDate(availSelected) === ds) return "selected-day";
            return "";
          }}
        />

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
          <div style={{ flex: 1, color: "#344055", fontSize: 14 }}>
            <strong>Selected:</strong>{" "}
            {availSelected ? `${availSelected.toDateString()} (${formatDate(availSelected)})` : <em>None</em>}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={markNotAvailable}
              disabled={availLoading}
              style={{ ...primaryStyle, opacity: availLoading ? 0.7 : 1 }}
            >
              {availLoading ? "Saving…" : "Block"}
            </button>

            <button
              onClick={unblockDate}
              disabled={availLoading}
              style={{ ...dangerStyle, opacity: availLoading ? 0.7 : 1 }}
            >
              {availLoading ? "Saving…" : "Unblock"}
            </button>
          </div>
        </div>

        {availMsg && (
          <div style={{ marginTop: 10, color: "#0b2b4a", fontSize: 13 }}>
            {availMsg}
          </div>
        )}
      </div>
    </div>

    {/* small CSS for react-datepicker day decorations */}
    <style>{`
      .react-datepicker__day.blocked-day {
        background: #fde8ea !important;
        color: #b91c1c !important;
        border-radius: 0.6rem;
        border: 1px solid rgba(185, 28, 28, 0.12);
      }
      .react-datepicker__day.selected-day {
        box-shadow: 0 0 0 3px rgba(52,152,219,0.15);
        border-radius: 0.6rem;
      }
    `}</style>
  </div>
)}

        {/* BOOKING DETAILS (updated to show customer address and phone) */}
        {activeTab === "bookingDetails" && selectedBooking && (
          <div style={{ padding: "20px" }}>
            <h2 style={{ marginBottom: "15px", color: "#2c3e50" }}>Booking Details</h2>
            <div style={{ display: "grid", gap: 10 }}>
              <p><strong>Client:</strong> {selectedBooking.clientName}</p>
              {/* show customer phone if available */}
              {getCustomerPhone(selectedBooking) ? (
                <p>
                  <strong>Client Mobile:</strong>{" "}
                  <a href={`tel:${getCustomerPhone(selectedBooking)}`} style={{ color: "#0b2b4a", fontWeight: 700 }}>
                    {getCustomerPhone(selectedBooking)}
                  </a>
                </p>
              ) : null}
              <p><strong>Job Details:</strong> {selectedBooking.jobDetails}</p>
              <p><strong>Date:</strong> {new Date(selectedBooking.bookingDate).toLocaleDateString()}</p>

              {/* show customer address sent with booking (if any) */}
              {(() => {
                // Try common fields where address may be stored
                const customerAddress =
                  selectedBooking.address ||
                  selectedBooking.customerAddress ||
                  selectedBooking.clientAddress ||
                  null;

                if (customerAddress) {
                  return <p><strong>Customer Address:</strong> {customerAddress}</p>;
                }

                // if there's a location object, show lat/lng and optionally a maps link
                if (selectedBooking.location && (selectedBooking.location.latitude || selectedBooking.location.longitude)) {
                  const { latitude, longitude, googleMapsUrl } = selectedBooking.location;
                  return (
                    <p>
                      <strong>Customer Location:</strong>{" "}
                      {googleMapsUrl ? (
                        <a href={googleMapsUrl} target="_blank" rel="noreferrer">Open in Google Maps</a>
                      ) : (
                        `${latitude ? latitude.toFixed(5) : "N/A"}, ${longitude ? longitude.toFixed(5) : "N/A"}`
                      )}
                    </p>
                  );
                }

                return <p><strong>Customer Address:</strong> <em>Not provided</em></p>;
              })()}

              {/* also show worker address (if available) */}
              {/* {(() => {
                const workerAddress = buildWorkerAddress(selectedBooking);
                return workerAddress ? (
                  <p><strong>Worker Address:</strong> {workerAddress}</p>
                ) : (
                  <p><strong>Worker Address:</strong> <em>No address on file</em></p>
                );
              })()} */}

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ minWidth: 110 }}>
                  <strong>Status:</strong>
                </div>

                <select
                  value={selectedBooking.status}
                  onChange={(e) => handleChangeBookingStatus(e.target.value)}
                  disabled={statusUpdating || TERMINAL_STATUSES.includes(selectedBooking.status)}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {statusUpdating && <span style={{ color: "#888" }}>Updating…</span>}
                {TERMINAL_STATUSES.includes(selectedBooking.status) && (
                  <span style={{ marginLeft: 10, color: "#b03a2e", fontWeight: 600 }}>
                    {selectedBooking.status === "completed" ? "✅ Completed — locked" : "❌ Cancelled — locked"}
                  </span>
                )}
              </div>

              {/* Location */}
              {selectedBooking.location ? (
                <>
                  {selectedBooking.location.latitude && selectedBooking.location.longitude && (
                    <p>
                      <strong>Location:</strong>{" "}
                      {selectedBooking.location.latitude.toFixed(5)}, {selectedBooking.location.longitude.toFixed(5)}
                    </p>
                  )}
                  {selectedBooking.location.googleMapsUrl && (
                    <button onClick={() => window.open(selectedBooking.location.googleMapsUrl, "_blank")} style={btnPrimary}>
                      📍 View on Map
                    </button>
                  )}
                </>
              ) : (
                <p><em>No location shared</em></p>
              )}

              {/* Photos gallery (customer photos + worker-added photos) */}
              <div style={{ marginTop: 8 }}>
                <strong>Photos:</strong>
                {selectedBooking.photos && selectedBooking.photos.length > 0 ? (
                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {selectedBooking.photos.map((p, i) => (
                      <a key={i} href={photoToUrl(p)} target="_blank" rel="noreferrer" style={{ width: 140, height: 90, display: "block" }}>
                        <img src={photoToUrl(p)} alt={`booking-photo-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, border: "1px solid #eef2f7" }} />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 8, color: "#6b7280" }}>No photos attached to this booking.</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: 10 }}>
              <button onClick={() => setActiveTab("booking")} style={btnCancel}> ← Back to Bookings </button>
              {TERMINAL_STATUSES.includes(selectedBooking.status) && (
                <button onClick={handleDeleteBooking} disabled={deleting} style={{ ...btnDanger, width: "auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {deleting ? "Deleting…" : "🗑️ Delete Request"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Logout — show only on Profile tab */}
        {activeTab === "profile" && (
          <div style={{ marginTop: 12 }}>
            <button onClick={() => navigate("/")} style={btnDanger}>🚪 Logout</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles and helpers (unchanged)
const tabStyle = (isActive) => ({
  flex: 1,
  padding: "12px",
  background: isActive ? "#3498db" : "transparent",
  color: isActive ? "#fff" : "#2c3e50",
  border: "none",
  borderRadius: "8px 8px 0 0",
  fontWeight: "600",
  cursor: "pointer",
  transition: "0.3s",
});

const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "14px",
  outline: "none",
};

const cardStyle = {
  background: "#fdfdfd",
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  cursor: "pointer",
  transition: "0.3s",
};

const btnPrimary = {
  marginTop: "15px",
  padding: "12px",
  width: "100%",
  background: "linear-gradient(135deg,#3498db,#2980b9)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
};

const btnSuccess = {
  flex: 1,
  padding: "12px",
  background: "linear-gradient(135deg,#2ecc71,#27ae60)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
};

const btnCancel = {
  flex: 1,
  padding: "12px",
  background: "#ecf0f1",
  color: "#2c3e50",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
};

const btnDanger = {
  marginTop: "20px",
  width: "100%",
  padding: "12px",
  background: "linear-gradient(135deg,#e74c3c,#c0392b)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
};

// availability button styles
const primaryStyle = {
  padding: "10px 14px",
  background: "#06b6d4",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};
const dangerStyle = {
  padding: "10px 14px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const availHelpers = {
  formatDate: (d) => (d ? format(d, "yyyy-MM-dd") : null),
};

const StatusPill = ({ status }) => {
  const base = {
    padding: "8px 14px",
    borderRadius: 999,
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    textTransform: "capitalize",
    display: "inline-block",
    minWidth: 90,
    textAlign: "center",
  };
  const map = {
    pending: { background: "#f59e0b", color: "#fff" },
    confirmed: { background: "#06b6d4", color: "#fff" },
    completed: { background: "#10b981", color: "#fff" },
    cancelled: { background: "#ef4444", color: "#fff" },
  };
  return <span style={{ ...base, ...(map[status] || { background: "#94a3b8" }) }}>{status}</span>;
};

const AvatarSquare = ({ name }) => {
  const letter = name ? String(name).charAt(0).toUpperCase() : "?";
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 10,
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        color: "#0f172a",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
        fontSize: 20,
      }}
    >
      {letter}
    </div>
  );
};

export default WorkerDashboard;
