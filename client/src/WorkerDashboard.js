// src/WorkerDashboard.js
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import { Feedback, useConfirmation } from "./Feedback";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from "date-fns";

import {
  DashboardShell,
  Field,
  Icon,
  Avatar,
  Empty,
  Status,
  BookingSummary,
  professions,
} from "./SiteUI";

const BASE_URL = "https://doable-ojum.onrender.com"; // adjust if needed
const TERMINAL_STATUSES = ["completed", "cancelled"];

const WorkerDashboard = () => {
  const [feedback, setFeedback] = useState("");
  const { ask, dialog } = useConfirmation();
  const { state } = useLocation();

  const [activeTab, setActiveTab] = useState("profile");
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
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
      setBookingsLoading(true);
      setBookingsError("");
      axios
        .get(`${BASE_URL}/api/bookings/worker/${profile.workerId}`)
        .then((res) => {
          if (res.data.success) setBookings(res.data.bookings || []);
        })
        .catch(() =>
          setBookingsError("Could not load requests. Please try again."),
        )
        .finally(() => setBookingsLoading(false));
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
      const res = await http.get(
        `/api/workers/${profile.workerId}/availability`,
      );
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
      setFeedback("Pincode must be exactly 6 digits.");
      return;
    }
    if (form.mobileNumber && !/^\d{10}$/.test(form.mobileNumber)) {
      setFeedback("Mobile number must be exactly 10 digits.");
      return;
    }

    setProfileSaving(true);
    try {
      // upload new photo if (newPhotoFile)
      if (newPhotoFile) {
        const fd = new FormData();
        fd.append("photo", newPhotoFile);
        const upRes = await axios.post(
          `${BASE_URL}/api/workers/${profile.workerId}/photo`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        if (upRes.data?.success && upRes.data.photoUrl) {
          setProfile((p) => ({
            ...p,
            photoUrl: `${BASE_URL}${upRes.data.photoUrl}`,
          }));
        }
      }
      // update fields
      const payload = { ...form };
      if (!payload.password || state?.demo) delete payload.password;
      const res = await axios.put(
        `${BASE_URL}/api/auth/profile/${profile.workerId}`,
        payload,
      );
      if (res.data?.success) {
        setProfile((p) => ({ ...p, ...res.data.worker }));
        setIsEditing(false);
        setNewPhotoFile(null);
        setForm((f) => ({ ...f, password: "" }));
        setFeedback("✅ Profile updated successfully.");
      } else {
        setFeedback(res.data?.message || "Profile update failed.");
      }
    } catch (err) {
      console.error("Update failed:", err);
      setFeedback(err.response?.data?.message || "Profile update failed.");
    } finally {
      setProfileSaving(false);
    }
  };

  // ---------- Booking status update handler ----------
  const handleChangeBookingStatus = async (newStatus) => {
    if (!selectedBooking) return;
    const bookingId = selectedBooking._id;

    // Prevent any change if booking is already in a terminal status
    if (
      TERMINAL_STATUSES.includes(selectedBooking.status) &&
      selectedBooking.status !== newStatus
    ) {
      setFeedback(
        `This booking is already "${selectedBooking.status}" and cannot be changed.`,
      );
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
      setBookings((list) =>
        list.map((b) =>
          b._id === bookingId ? { ...b, status: newStatus } : b,
        ),
      );

      // send request to backend
      const res = await axios.put(
        `${BASE_URL}/api/bookings/${bookingId}/status`,
        { status: newStatus },
      );

      if (res.data?.success) {
        // ensure server canonical booking used
        const serverBooking = res.data.booking;

        // If server returned a terminal status, make sure UI reflects immutability
        setSelectedBooking(serverBooking);
        setBookings((list) =>
          list.map((b) => (b._id === bookingId ? serverBooking : b)),
        );
      } else {
        // revert if server reports failure
        setSelectedBooking(prevSelected);
        setBookings(prevBookings);
        setFeedback(res.data?.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("Status update failed:", err);
      // revert optimistic UI
      setSelectedBooking(prevSelected);
      setBookings(prevBookings);
      setFeedback(err.response?.data?.message || "Failed to update status.");
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
      setFeedback("No file selected.");
      return;
    }

    try {
      setUploadingPhoto(true);
      setUploadProgress(0);

      const fd = new FormData();
      fd.append("photo", file);

      const res = await axios.post(
        `${BASE_URL}/api/bookings/${bookingId}/photo`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (ev) => {
            if (ev.total) {
              const pct = Math.round((ev.loaded / ev.total) * 100);
              setUploadProgress(pct);
            }
          },
        },
      );

      if (res.data?.success && res.data.booking) {
        const updatedBooking = res.data.booking;
        // update selectedBooking and bookings list
        setSelectedBooking(updatedBooking);
        setBookings((list) =>
          list.map((b) => (b._id === bookingId ? updatedBooking : b)),
        );
        setFeedback("✅ Photo uploaded and attached to booking.");
      } else {
        setFeedback(res.data?.message || "Failed to upload booking photo.");
      }
    } catch (err) {
      console.error("Upload booking photo failed:", err);
      setFeedback(
        err.response?.data?.message || "Failed to upload booking photo.",
      );
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
      setFeedback(
        "You can only delete bookings that are completed or cancelled.",
      );
      return;
    }
    if (
      !(await ask(
        "Hide this booking from your dashboard? The customer will keep their booking record.",
      ))
    ) {
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
        console.log(
          "Attempting DELETE:",
          url,
          "with x-worker-id:",
          profile?.workerId,
        );
        try {
          const res = await axios.delete(url, {
            headers: {
              "x-worker-id": profile?.workerId,
            },
          });
          if (res.status === 200 || res.status === 204 || res.data?.success) {
            console.log("Delete success response:", res.data || res.status);
            setFeedback(
              "✅ Booking hidden from your dashboard. The customer keeps their record.",
            );
            return;
          } else {
            console.warn("Unexpected delete response:", res.status, res.data);
            lastErr = new Error(
              "Unexpected delete response: " +
                JSON.stringify(res.data || res.status),
            );
            break;
          }
        } catch (err) {
          lastErr = err;
          console.warn(
            `DELETE ${url} failed. status:`,
            err.response?.status,
            "data:",
            err.response?.data,
            "message:",
            err.message,
          );
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
          const serverMsg =
            typeof data === "string"
              ? data
              : data.message || JSON.stringify(data);
          friendly += ` Server response: ${serverMsg}`;
        } else if (lastErr.message) {
          friendly += ` ${lastErr.message}`;
        }
      }
      console.error("Delete attempts finished. Last error object:", lastErr);
      setFeedback(friendly);
    } catch (err) {
      setBookings(prevBookings);
      console.error("Unexpected error in handleDeleteBooking:", err);
      setFeedback("Delete failed: " + (err.message || err));
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
          (b.trackingId || "").toLowerCase().includes(q) ||
          String(b._id || "")
            .toLowerCase()
            .includes(q),
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
      if (sortBy === "status")
        return (a.status || "").localeCompare(b.status || "");
      return db - da;
    });

    return list;
  }, [bookings, searchText, filterStatus, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSortedBookings.length / PER_PAGE),
  );
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const pageBookings = filteredSortedBookings.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  // helper to convert server photo path to absolute url
  const photoToUrl = (p) => {
    if (!p) return null;
    if (/^(https?:|data:|blob:)/.test(p)) return p;
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
      const res = await http.post(
        `/api/workers/${profile.workerId}/blocked-dates`,
        { action: "add", dates: [ds] },
      );
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

    if (!(await ask(`Mark ${ds} as available again?`))) return;

    setAvailLoading(true);
    try {
      const res = await http.post(
        `/api/workers/${profile.workerId}/blocked-dates`,
        { action: "remove", dates: [ds] },
      );
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
    return (availDates || [])
      .map((d) => {
        try {
          return parseISO(d);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  }, [availDates]);

  // ---------- NEW: helper to retrieve customer phone robustly ----------
  const getCustomerPhone = (b) => {
    if (!b) return null;
    // check multiple possible field names commonly used
    return (
      b.clientPhone ||
      b.client_phone ||
      b.phone ||
      b.mobile ||
      b.customerPhone ||
      null
    );
  };

  if (!profile.workerId) return <Navigate to="/login?role=worker" replace />;
  const tabs = [
    ["profile", "My profile", "user"],
    ["booking", "My bookings", "tool"],
    ["availability", "Availability", "calendar"],
  ];
  if (selectedBooking)
    tabs.push(["bookingDetails", "Booking details", "calendar"]);
  return (
    <DashboardShell
      role="Professional"
      name={profile.name}
      demo={state?.demo}
      activeTab={activeTab}
      tabs={tabs}
      onTab={setActiveTab}
    >
      {dialog}
      <Feedback message={feedback} onDismiss={() => setFeedback("")} />
      {activeTab === "profile" && (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">YOUR PROFESSIONAL PROFILE</span>
              <h2>My profile</h2>
              <p>Help customers get to know the person behind the work.</p>
            </div>
            {!isEditing && (
              <button
                className="button button-outline"
                onClick={() => {
                  setForm({ ...profile, password: "" });
                  setIsEditing(true);
                }}
              >
                Edit profile <Icon />
              </button>
            )}
          </div>
          {!isEditing ? (
            <>
              <div className="person-header">
                <Avatar large name={profile.name} src={profile.photoUrl} />
                <div>
                  <span className="eyebrow">{profile.profession}</span>
                  <h2>{profile.name}</h2>
                  <p>
                    {profile.area}, {profile.city}
                  </p>
                </div>
              </div>
              <dl className="detail-grid">
                <div>
                  <dt>Mobile number</dt>
                  <dd>{profile.mobileNumber || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Service pincode</dt>
                  <dd>{profile.pincode || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Area</dt>
                  <dd>{profile.area || "Not provided"}</dd>
                </div>
                <div>
                  <dt>City</dt>
                  <dd>{profile.city || "Not provided"}</dd>
                </div>
              </dl>
              <div className="profile-bottom">
                Professional ID: {profile.workerId}
              </div>
            </>
          ) : (
            <>
              <div className="form-grid">
                {[
                  ["name", "Full name"],
                  ["mobileNumber", "Mobile number"],
                  ["pincode", "Service pincode"],
                  ["area", "Area"],
                  ["city", "City"],
                ].map(([key, label]) => (
                  <Field label={label} key={key}>
                    <input
                      name={key}
                      value={form[key] || ""}
                      onChange={handleFormChange}
                    />
                  </Field>
                ))}
                <Field label="Profession">
                  <select
                    name="profession"
                    value={form.profession}
                    onChange={handleFormChange}
                  >
                    <option value="">Choose service</option>
                    {professions.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <hr />
              {state?.demo ? (
                <p className="notice">
                  Profile photos and password changes are unavailable in the
                  local demo. You can edit your name, service and contact
                  details.
                </p>
              ) : (
                <div className="form-grid">
                  <Field
                    label="New password (optional)"
                    hint="Leave empty to keep your current password."
                  >
                    <input
                      type="password"
                      name="password"
                      autoComplete="new-password"
                      value={form.password || ""}
                      onChange={handleFormChange}
                    />
                  </Field>
                  <Field label="Profile photo (optional)">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setNewPhotoFile(e.target.files[0] || null)
                      }
                    />
                  </Field>
                </div>
              )}
              <div className="actions">
                <button
                  className="button"
                  onClick={saveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving ? "Saving…" : "Save changes"}
                </button>
                <button
                  className="button button-outline"
                  onClick={() => {
                    setIsEditing(false);
                    setNewPhotoFile(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {activeTab === "booking" && (
        <>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">GOOD WORK STARTS HERE</span>
              <h2>My bookings</h2>
              <p>Keep an eye on your upcoming jobs and customer requests.</p>
            </div>
          </div>
          <div className="toolbar">
            <Field label="Search requests">
              <input
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Customer, job or tracking code"
              />
            </Field>
            <Field label="Status">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s ? s[0].toUpperCase() + s.slice(1) : "All statuses"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sort by">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date_desc">Newest date first</option>
                <option value="date_asc">Oldest date first</option>
                <option value="status">Status</option>
              </select>
            </Field>
          </div>
          {bookingsError && (
            <p role="alert" className="notice notice-error">
              {bookingsError}
            </p>
          )}
          {bookingsLoading ? (
            <Empty title="Loading your requests…" />
          ) : !pageBookings.length ? (
            <Empty title="No bookings to show">
              New requests from customers will appear here. Try adjusting your
              filters if you expected to see a booking.
            </Empty>
          ) : (
            <div className="booking-list">
              {pageBookings.map((b) => (
                <button
                  className="booking-row"
                  key={b._id}
                  onClick={() => {
                    setSelectedBooking(b);
                    setActiveTab("bookingDetails");
                  }}
                >
                  <Avatar name={b.clientName} />
                  <div className="booking-row-main">
                    <h3>{b.clientName || "Customer"}</h3>
                    <p>{b.jobDetails}</p>
                    <small>
                      {b.trackingId || `#${String(b._id).slice(-6)}`}{" "}
                      {getCustomerPhone(b) && `· ${getCustomerPhone(b)}`}
                    </small>
                    {b.photos?.length > 0 && (
                      <span className="booking-thumbnails">
                        {b.photos.slice(0, 4).map((photo, i) => (
                          <img
                            key={i}
                            src={photoToUrl(photo)}
                            alt={`Job preview ${i + 1}`}
                          />
                        ))}
                        {b.photos.length > 4 && (
                          <span>+{b.photos.length - 4}</span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="booking-row-side">
                    <Status status={b.status} />
                    <span>
                      {b.bookingDate
                        ? new Date(b.bookingDate).toLocaleDateString()
                        : ""}{" "}
                      ↗
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="pagination">
            <span>
              {filteredSortedBookings.length} request
              {filteredSortedBookings.length !== 1 ? "s" : ""} · Page{" "}
              {currentPage} of {totalPages}
            </span>
            <div>
              <button
                className="button button-outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ← Previous
              </button>
              <button
                className="button button-outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
      {activeTab === "availability" && (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">MAKE TIME FOR WHAT MATTERS</span>
              <h2>Your availability</h2>
              <p>
                Block the days you’re away so customers can plan their requests.
              </p>
            </div>
          </div>
          <div className="availability-grid">
            <div className="calendar-area">
              <DatePicker
                inline
                selected={availSelected}
                onChange={setAvailSelected}
                highlightDates={highlightDates}
                minDate={new Date()}
                dayClassName={(d) =>
                  availDates.includes(formatDate(d)) ? "blocked-day" : ""
                }
              />
              <p className="small muted" style={{ marginTop: 14 }}>
                Red dates are blocked. Select a date to update it.
              </p>
            </div>
            <div className="availability-info">
              <span className="eyebrow">SELECTED DATE</span>
              <h3>
                {availSelected
                  ? availSelected.toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Choose a day"}
              </h3>
              <p>
                {availSelected
                  ? availDates.includes(formatDate(availSelected))
                    ? "You are unavailable on this date."
                    : "This date is open for booking requests."
                  : "Your schedule, your call. Select a day on the calendar to block or unblock it."}
              </p>
              <div className="actions">
                <button
                  className="button"
                  onClick={markNotAvailable}
                  disabled={availLoading || !availSelected}
                >
                  Block date
                </button>
                <button
                  className="button button-outline"
                  onClick={unblockDate}
                  disabled={availLoading || !availSelected}
                >
                  Unblock
                </button>
              </div>
              {availMsg && (
                <p role="status" className="notice" style={{ marginTop: 18 }}>
                  {availMsg}
                </p>
              )}
            </div>
          </div>
          {availDates.length > 0 && (
            <>
              <h3 className="form-section-title">Blocked dates</h3>
              <div className="date-tags">
                {availDates
                  .slice()
                  .sort()
                  .map((d) => (
                    <span key={d}>{d}</span>
                  ))}
              </div>
            </>
          )}
        </div>
      )}
      {activeTab === "bookingDetails" && selectedBooking && (
        <>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">YOUR NEXT JOB</span>
              <h2>Booking details</h2>
            </div>
            <button
              className="text-link"
              onClick={() => setActiveTab("booking")}
            >
              ← My bookings
            </button>
          </div>
          <BookingSummary booking={selectedBooking}>
            <hr />
            <div className="form-grid">
              <Field label="Request status">
                <select
                  value={selectedBooking.status}
                  onChange={(e) => handleChangeBookingStatus(e.target.value)}
                  disabled={
                    statusUpdating ||
                    TERMINAL_STATUSES.includes(selectedBooking.status)
                  }
                >
                  {statusOptions.filter(Boolean).map((s) => (
                    <option key={s} value={s}>
                      {s[0].toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="field">
                <span>Customer contact</span>
                {getCustomerPhone(selectedBooking) ? (
                  <a
                    className="button button-outline"
                    href={`tel:${getCustomerPhone(selectedBooking)}`}
                  >
                    Call {getCustomerPhone(selectedBooking)}
                  </a>
                ) : (
                  <p className="small">No phone number provided.</p>
                )}
              </div>
            </div>
            {TERMINAL_STATUSES.includes(selectedBooking.status) && (
              <p className="small muted" style={{ marginTop: 14 }}>
                This request is {selectedBooking.status}. Its status can no
                longer be changed here.
              </p>
            )}
            {selectedBooking.location?.latitude &&
            selectedBooking.location?.longitude ? (
              <div className="actions">
                <a
                  className="button button-outline"
                  target="_blank"
                  rel="noreferrer"
                  href={
                    selectedBooking.location.googleMapsUrl ||
                    `https://www.google.com/maps?q=${selectedBooking.location.latitude},${selectedBooking.location.longitude}`
                  }
                >
                  <Icon name="pin" />
                  View shared location
                </a>
              </div>
            ) : (
              <p className="small muted" style={{ marginTop: 22 }}>
                No location pin was shared with this request.
              </p>
            )}
            <h3 className="form-section-title">Job photos</h3>
            {selectedBooking.photos?.length ? (
              <div className="booking-gallery">
                {selectedBooking.photos.map((p, i) => (
                  <a
                    key={i}
                    href={photoToUrl(p)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src={photoToUrl(p)} alt={`Job attachment ${i + 1}`} />
                  </a>
                ))}
              </div>
            ) : (
              <p className="small muted">No photos attached to this request.</p>
            )}
            {state?.demo ? (
              <p className="small muted" style={{ marginTop: 15 }}>
                Adding professional job photos is unavailable in the local demo.
              </p>
            ) : (
              <div style={{ marginTop: 20 }}>
                <Field label="Add a job photo">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingPhoto}
                    onChange={(e) => uploadPhotoToBooking(e.target.files[0])}
                  />
                </Field>
                {uploadingPhoto && (
                  <p className="small">Uploading… {uploadProgress}%</p>
                )}
              </div>
            )}
            {TERMINAL_STATUSES.includes(selectedBooking.status) && (
              <div className="actions">
                <button
                  className="button button-danger"
                  disabled={deleting}
                  onClick={handleDeleteBooking}
                >
                  {deleting ? "Hiding…" : "Hide from my bookings"}
                </button>
                <span className="small muted">
                  The customer keeps their booking record.
                </span>
              </div>
            )}
          </BookingSummary>
        </>
      )}
    </DashboardShell>
  );
};
export default WorkerDashboard;
