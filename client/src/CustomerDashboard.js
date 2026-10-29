// src/CustomerDashboard.js
import React, { useEffect, useState, useMemo } from "react";
import { useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import { Feedback, useConfirmation } from "./Feedback";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO } from "date-fns";

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

const BASE_URL = "https://doable-ojum.onrender.com"; // centralised base URL
const MAX_PHOTOS = 6; // maximum photos customer can attach
const MAX_PHOTO_MB = 6; // max size per photo

const CustomerDashboard = () => {
  const [feedback, setFeedback] = useState("");
  const { ask, dialog } = useConfirmation();
  const { state } = useLocation(); // customer info from login

  const profileStorage = state?.demo ? sessionStorage : localStorage;

  // prefer an explicit activeTab coming from navigation state (e.g. after booking)
  const initialTab = state?.activeTab || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [pincode, setPincode] = useState("");
  const [profession, setProfession] = useState("");
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState(
    state?.selectedWorker || null,
  );
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
  const [bookingAddress, setBookingAddress] = useState(
    state?.address || profileStorage.getItem("customerAddress") || "",
  );

  // NEW: booking phone editable, prefills from profile/state
  const initialCustomerId =
    state?.customerId ||
    state?.id ||
    profileStorage.getItem("customerId") ||
    "";
  const initialName =
    state?.name || profileStorage.getItem("customerName") || "";
  const initialEmail =
    state?.email || profileStorage.getItem("customerEmail") || "";
  const initialPhone =
    state?.phone || profileStorage.getItem("customerPhone") || "";
  const initialAddress =
    state?.address || profileStorage.getItem("customerAddress") || "";

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
  const [savedProfile, setSavedProfile] = useState(null);
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
    bookingPhotoPreviews.forEach(
      (p) => p && p.url && URL.revokeObjectURL(p.url),
    );

    const previews = bookingPhotoFiles.map((f) => ({
      id: `${f.name}_${f.size}_${f.lastModified}`,
      url: URL.createObjectURL(f),
      name: f.name,
      size: f.size,
    }));

    setBookingPhotoPreviews(previews);

    // cleanup when unmount
    return () =>
      previews.forEach((p) => p && p.url && URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingPhotoFiles]);

  /* ---------- Profile save ---------- */
  const handleSaveProfile = async () => {
    if (!profileData.name || !profileData.email) {
      setFeedback("Please provide name and email.");
      return;
    }

    setSavingProfile(true);
    try {
      const customerId =
        profileData.id ||
        state?.customerId ||
        state?.id ||
        profileStorage.getItem("customerId") ||
        "";

      if (!customerId) {
        setFeedback("No customer ID found. Please login again.");
        setSavingProfile(false);
        return;
      }

      const res = await axios.put(`${BASE_URL}/api/customers/${customerId}`, {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address || "", // send address as well
      });

      if (res.data?.success) {
        setFeedback("✅ Profile updated successfully!");
        setEditMode(false);

        profileStorage.setItem("customerId", customerId);
        profileStorage.setItem("customerName", profileData.name);
        profileStorage.setItem("customerEmail", profileData.email);
        profileStorage.setItem("customerPhone", profileData.phone || "");
        profileStorage.setItem("customerAddress", profileData.address || "");

        setProfileData((prev) => ({ ...prev, id: customerId }));
        // also update bookingPhone to reflect saved phone
        setBookingPhone(profileData.phone || "");
      } else {
        setFeedback("❌ Failed to update profile.");
      }
    } catch (err) {
      console.error("Update profile error:", err);
      const msg = err.response?.data?.message || err.message || "Unknown error";
      setFeedback("❌ Error while updating profile: " + msg);
    }
    setSavingProfile(false);
  };

  /* ---------- Change Password ---------- */
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setFeedback("Please fill all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setFeedback("New password must be at least 6 characters.");
      return;
    }

    const customerId =
      profileData.id ||
      state?.customerId ||
      state?.id ||
      profileStorage.getItem("customerId") ||
      "";

    if (!customerId) {
      setFeedback("No customer ID found. Please login again.");
      return;
    }

    setChangingPassword(true);
    try {
      // Note: backend must expose POST /api/customers/:id/change-password
      const res = await axios.post(
        `${BASE_URL}/api/customers/${customerId}/change-password`,
        {
          currentPassword,
          newPassword,
        },
      );

      if (res.data?.success) {
        setFeedback("✅ Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const msg = res.data?.message || "Failed to change password.";
        setFeedback("❌ " + msg);
      }
    } catch (err) {
      console.error("Change password error:", err);
      const msg = err.response?.data?.message || err.message || "Server error";
      setFeedback("❌ Error changing password: " + msg);
    } finally {
      setChangingPassword(false);
    }
  };

  /* ---------- Search workers ---------- */
  const handleSearch = async (e) => {
    e?.preventDefault();
    setHasSearched(true);
    setSearchError("");
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/workers/search`, {
        params: { pincode, profession },
      });
      setResults(response.data.success ? response.data.workers : []);
      if (!response.data.success)
        setSearchError(
          response.data.message ||
            "We couldn’t load professionals. Please try your search again.",
        );
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      setSearchError(
        "We couldn’t load professionals. Please try your search again.",
      );
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
        const res = await axios.get(
          `${BASE_URL}/api/workers/${selectedWorker._id}/availability`,
        );
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
      setFeedback(`You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }

    for (const f of incoming) {
      if (!f.type.startsWith("image/")) {
        setFeedback("Only image files are allowed.");
        return;
      }
      if (f.size > MAX_PHOTO_MB * 1024 * 1024) {
        setFeedback(`Each image must be <= ${MAX_PHOTO_MB} MB.`);
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
      setFeedback("❌ Please enter job details and select a date.");
      return;
    }

    if (!selectedWorker || !selectedWorker._id) {
      setFeedback("❌ No worker selected.");
      return;
    }

    const dateStr = normalizeDateToYYYYMMDD(bookingDate);
    if (!dateStr) {
      setFeedback("❌ Invalid booking date.");
      return;
    }

    // Double-check blockedDates
    try {
      const availRes = await axios.get(
        `${BASE_URL}/api/workers/${selectedWorker._id}/availability`,
      );
      if (availRes.data?.success) {
        const serverBlocked = availRes.data.blockedDates || [];
        if (serverBlocked.includes(dateStr)) {
          setFeedback(
            `❌ Worker "${selectedWorker.name}" is NOT available on ${dateStr}. Please pick another date or another worker.`,
          );
          return;
        }
      } else {
        setFeedback(
          "❌ Could not verify worker availability. Please try again later.",
        );
        return;
      }
    } catch (err) {
      console.error("Availability check failed:", err);
      setFeedback("❌ Failed to verify worker availability. Please try again.");
      return;
    }

    if (useLiveLocation && !customerLocation) {
      setFeedback(
        "❌ You selected to send your live location but it's not captured yet. Please 'Share My Location' first or uncheck that option.",
      );
      return;
    }

    if (useProfileAddress && !bookingAddress) {
      setFeedback(
        "❌ You selected to send an address but it's empty. Please fill the address or uncheck the option.",
      );
      return;
    }

    // basic phone validation: if provided, prefer 10-digit numeric; ask for confirmation if it looks odd
    if (bookingPhone) {
      const raw = String(bookingPhone).trim();
      if (!/^\d{10}$/.test(raw)) {
        const cont = await ask(
          "The phone number looks unusual (expected 10 digits). Continue anyway?",
        );
        if (!cont) return;
      }
    }

    setBookingSubmitting(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append("workerId", selectedWorker._id);
      fd.append("clientName", profileData.name || state?.name || "");
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
            const pct = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100,
            );
            setUploadProgress(pct);
          }
        },
      });

      if (res.data?.success) {
        setFeedback(
          `✅ Booking successful! Tracking ID: ${
            res.data.trackingId || res.data.booking?.trackingId || "N/A"
          }`,
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
        setFeedback("❌ Booking failed. Try again.");
      }
    } catch (error) {
      console.error("Booking error:", error);
      if (error?.response?.data) {
        const serverMsg =
          error.response.data.message || JSON.stringify(error.response.data);
        setFeedback("❌ Booking failed. Server: " + serverMsg);
      } else {
        setFeedback("❌ Booking failed. Please try again.");
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
      const res = await axios.get(
        `${BASE_URL}/api/bookings/track/${trackingId}`,
      );
      setTrackingResult(res.data.success ? res.data.booking : null);
      if (!res.data.success)
        setFeedback("No booking found for that tracking ID.");
    } catch (err) {
      console.error("Track error:", err);
      setTrackingResult(null);
      setFeedback("Track failed. See console for details.");
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
            setFeedback("Failed to load booking details.");
          }
        } catch (err) {
          console.error("Failed to fetch booking by id:", err);
          setFeedback("Failed to load booking details.");
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
      profileStorage.getItem("customerId") ||
      "";

    const nameFallback =
      profileData.name ||
      state?.name ||
      profileStorage.getItem("customerName") ||
      "";

    if (!customerId && !nameFallback) {
      setFeedback(
        "No customer identifier available for loading bookings. Please ensure you're logged in and your profile has a name.",
      );
      return;
    }

    setMyBookingsLoading(true);
    try {
      let res;
      if (customerId) {
        res = await axios.get(
          `${BASE_URL}/api/bookings/customer/${customerId}`,
        );
        if (res.data?.success) {
          setMyBookings(res.data.bookings || []);
        } else {
          const res2 = await axios.get(`${BASE_URL}/api/bookings/customer`, {
            params: { name: nameFallback },
          });
          setMyBookings(res2.data?.bookings || []);
        }
      } else {
        const res2 = await axios.get(`${BASE_URL}/api/bookings/customer`, {
          params: { name: nameFallback },
        });
        setMyBookings(res2.data?.bookings || []);
      }
    } catch (err) {
      console.error("Load my bookings error:", err);
      setMyBookings([]);
      setFeedback("Failed to load your bookings. See console for details.");
    } finally {
      setMyBookingsLoading(false);
    }
  };

  /* ---------- Utility to expand upload URL to absolute ---------- */
  const toAbsoluteUrl = (url) => {
    if (!url) return url;
    if (/^(https?:|data:|blob:)/.test(url)) return url;
    return url.startsWith("/") ? `${BASE_URL}${url}` : `${BASE_URL}/${url}`;
  };

  // highlightDates for DatePicker (convert blockedDates strings to Date objects)
  const highlightDates = useMemo(() => {
    return (blockedDates || [])
      .map((s) => {
        try {
          return parseISO(s);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  }, [blockedDates]);

  // When user clicks a date in DatePicker we must prevent selecting blocked dates
  const onDateSelect = (date) => {
    const ds = normalizeDateToYYYYMMDD(date);
    if (blockedDates.includes(ds)) {
      setFeedback(
        `Worker is NOT available on ${ds}. Please choose another date.`,
      );
      return;
    }
    setBookingDate(date);
  };

  if (!initialCustomerId) return <Navigate to="/login?role=customer" replace />;
  const tabs = [
    ["profile", "My profile", "user"],
    ["search", "Find a professional", "search"],
    ["myBookings", "My bookings", "calendar"],
    ["track", "Track a request", "pin"],
  ];
  if (selectedWorker) tabs.push(["bookWorker", "New booking", "tool"]);
  if (selectedBooking)
    tabs.push(["bookingInfo", "Booking details", "calendar"]);
  const changeTab = (tab) => {
    setActiveTab(tab);
    if (tab === "myBookings") loadMyBookings();
  };
  const bookingMedia = (booking) => (
    <>
      {booking.location?.latitude && booking.location?.longitude && (
        <p className="small" style={{ marginTop: 20 }}>
          <a
            className="text-link accent"
            href={
              booking.location.googleMapsUrl ||
              `https://www.google.com/maps?q=${booking.location.latitude},${booking.location.longitude}`
            }
            target="_blank"
            rel="noreferrer"
          >
            View shared location ↗
          </a>
        </p>
      )}
      {booking.photos?.length > 0 && (
        <div className="booking-gallery">
          {booking.photos.map((u, i) => (
            <a key={i} href={toAbsoluteUrl(u)} target="_blank" rel="noreferrer">
              <img src={toAbsoluteUrl(u)} alt={`Job attachment ${i + 1}`} />
            </a>
          ))}
        </div>
      )}
    </>
  );
  return (
    <DashboardShell
      role="Customer"
      name={profileData.name}
      demo={state?.demo}
      activeTab={activeTab}
      tabs={tabs}
      onTab={changeTab}
    >
      {state?.demoSelectionReset && (
        <p className="notice" style={{ marginBottom: 22 }}>
          The local demo uses a sample professional. Search Plumber in 110001 to
          try a booking. Your selected professional is available through a
          normal customer login.
        </p>
      )}
      {dialog}
      <Feedback message={feedback} onDismiss={() => setFeedback("")} />
      {activeTab === "profile" && (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">THE ESSENTIALS</span>
              <h2>My profile</h2>
              <p>Your details help your professional reach you.</p>
            </div>
            {!editMode && (
              <button
                className="button button-outline"
                onClick={() => {
                  setSavedProfile({ ...profileData });
                  setEditMode(true);
                }}
              >
                Edit profile <Icon />
              </button>
            )}
          </div>
          {!editMode ? (
            <>
              <div className="person-header">
                <Avatar large name={profileData.name} />
                <div>
                  <h2>{profileData.name}</h2>
                  <p>Customer account</p>
                </div>
              </div>
              <dl className="detail-grid">
                <div>
                  <dt>Email address</dt>
                  <dd>{profileData.email || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Mobile number</dt>
                  <dd>{profileData.phone || "Not provided"}</dd>
                </div>
                <div className="full-width">
                  <dt>Home address</dt>
                  <dd>
                    {profileData.address ||
                      "Add an address to make booking easier."}
                  </dd>
                </div>
              </dl>
              <div className="profile-bottom">
                Account ID: {profileData.id || "—"}
              </div>
            </>
          ) : (
            <>
              <div className="form-grid">
                <Field label="Full name">
                  <input
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                  />
                </Field>
                <Field label="Email address">
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                  />
                </Field>
                <Field label="Mobile number">
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                  />
                </Field>
                <div className="full-width">
                  <Field label="Home address">
                    <textarea
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          address: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
              </div>
              <div className="actions">
                <button
                  className="button"
                  disabled={savingProfile}
                  onClick={handleSaveProfile}
                >
                  {savingProfile ? "Saving…" : "Save changes"}
                </button>
                <button
                  className="button button-outline"
                  onClick={() => {
                    setProfileData(savedProfile);
                    setEditMode(false);
                  }}
                >
                  Cancel
                </button>
              </div>
              <hr />
              <h3 className="form-section-title">Change password</h3>
              {state?.demo ? (
                <p className="notice">
                  Password changes are unavailable in the local demo. No
                  password is required to use sample accounts.
                </p>
              ) : (
                <>
                  <div className="form-grid">
                    <Field label="Current password">
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </Field>
                    <Field label="New password">
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </Field>
                    <Field label="Confirm new password">
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="actions">
                    <button
                      className="button"
                      disabled={changingPassword}
                      onClick={handleChangePassword}
                    >
                      {changingPassword ? "Changing…" : "Change password"}
                    </button>
                    <button
                      className="button button-outline"
                      onClick={() => {
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
      {activeTab === "search" && (
        <>
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">HELP IS CLOSE TO HOME</span>
                <h2>Find a professional</h2>
                <p>What needs doing? Start with a service and your pincode.</p>
              </div>
            </div>
            <form onSubmit={handleSearch}>
              <div className="form-grid">
                <Field label="Pincode">
                  <input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="6-digit pincode"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    inputMode="numeric"
                    required
                  />
                </Field>
                <Field label="Service">
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                  >
                    <option value="">All services</option>
                    {professions.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="actions">
                <button className="button" disabled={loading}>
                  {loading ? "Searching…" : "Find professionals"}
                  <Icon name="search" />
                </button>
              </div>
            </form>
          </div>
          {searchError ? (
            <p
              className="notice notice-error"
              role="alert"
              style={{ marginTop: 22 }}
            >
              {searchError}
            </p>
          ) : loading ? (
            <Empty title="Looking for a helping hand…">
              This may take a moment.
            </Empty>
          ) : !results.length ? (
            <Empty
              title={
                loading
                  ? "Looking for a helping hand…"
                  : hasSearched
                    ? "No professionals found"
                    : "Your next helping hand starts here"
              }
            >
              {hasSearched
                ? "Try another service or pincode."
                : "Enter your pincode to discover local professionals."}
            </Empty>
          ) : (
            <div className="results-grid">
              {results.map((w) => (
                <article className="panel worker-card" key={w._id}>
                  <Avatar
                    name={w.name}
                    src={w.photo ? toAbsoluteUrl(w.photo) : null}
                  />
                  <span className="eyebrow">{w.profession}</span>
                  <h3>{w.name}</h3>
                  <p>
                    <Icon name="pin" />
                    {w.pincode}
                  </p>
                  <p>
                    <a href={`tel:${w.mobileNumber}`}>{w.mobileNumber}</a>
                  </p>
                  <button
                    className="button"
                    onClick={() => handleBookingTab(w)}
                  >
                    Request a booking <Icon />
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {activeTab === "bookWorker" && selectedWorker && (
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">LET’S GET IT SORTED</span>
              <h2>Request a booking</h2>
              <p>Tell your professional what you need help with.</p>
            </div>
          </div>
          <div className="person-header">
            <Avatar
              name={selectedWorker.name}
              src={
                selectedWorker.photo
                  ? toAbsoluteUrl(selectedWorker.photo)
                  : null
              }
            />
            <div>
              <h3>{selectedWorker.name}</h3>
              <p>
                {selectedWorker.profession} · {selectedWorker.pincode} ·{" "}
                <a href={`tel:${selectedWorker.mobileNumber}`}>
                  {selectedWorker.mobileNumber}
                </a>
              </p>
            </div>
          </div>
          <Field label="What needs doing?">
            <textarea
              value={jobDetails}
              onChange={(e) => setJobDetails(e.target.value)}
              placeholder="For example, the kitchen tap is leaking. Describe the problem and anything helpful to know."
            />
          </Field>
          <div className="booking-form-grid">
            <div>
              <span className="calendar-heading">
                Choose your preferred date
              </span>
              <DatePicker
                inline
                selected={bookingDate}
                onChange={onDateSelect}
                minDate={new Date()}
                highlightDates={highlightDates}
                excludeDates={highlightDates}
                dayClassName={(d) =>
                  blockedDates.includes(normalizeDateToYYYYMMDD(d))
                    ? "blocked-day"
                    : ""
                }
              />
              <p className="small muted" style={{ marginTop: 12 }}>
                {blockedLoading
                  ? "Loading availability…"
                  : "Red dates are unavailable. Your request is confirmed by the professional."}
              </p>
              <button
                className="button button-outline"
                style={{ marginTop: 18 }}
                onClick={() => {
                  if (!navigator.geolocation) {
                    setFeedback(
                      "Location sharing is not available in this browser.",
                    );
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setCustomerLocation({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                      });
                      setUseLiveLocation(true);
                    },
                    () =>
                      setFeedback(
                        "Location could not be shared. You can still enter your address.",
                      ),
                  );
                }}
              >
                <Icon name="pin" />
                Share my location
              </button>
              {customerLocation && (
                <label
                  className="small muted"
                  style={{ display: "block", marginTop: 12 }}
                >
                  <input
                    type="checkbox"
                    checked={useLiveLocation}
                    onChange={(e) => setUseLiveLocation(e.target.checked)}
                  />{" "}
                  Include captured location (
                  {customerLocation.latitude.toFixed(4)},{" "}
                  {customerLocation.longitude.toFixed(4)})
                </label>
              )}
            </div>
            <div className="form-stack">
              <Field label="Service address">
                <textarea
                  value={bookingAddress}
                  onChange={(e) => {
                    setBookingAddress(e.target.value);
                    setUseProfileAddress(true);
                  }}
                  placeholder="Street, city, pincode and a landmark"
                />
              </Field>
              <Field
                label="Contact number"
                hint="Shared with the professional for this request."
              >
                <input
                  type="tel"
                  value={bookingPhone}
                  onChange={(e) => setBookingPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                />
              </Field>
              <Field
                label="Photos of the job (optional)"
                hint={`Up to ${MAX_PHOTOS} images, ${MAX_PHOTO_MB} MB each. ${bookingPhotoFiles.length} attached.`}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleAddPhotos(e.target.files)}
                />
              </Field>
              {bookingPhotoPreviews.length > 0 && (
                <div className="photo-previews">
                  {bookingPhotoPreviews.map((p, i) => (
                    <div key={p.id}>
                      <img src={p.url} alt={p.name} />
                      <button onClick={() => removePhotoAt(i)}>
                        Remove photo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="actions">
            <button
              className="button"
              onClick={confirmBooking}
              disabled={bookingSubmitting || blockedLoading}
            >
              {bookingSubmitting
                ? `Sending request… ${uploadProgress}%`
                : "Confirm request"}
              <Icon />
            </button>
            <button
              className="button button-outline"
              onClick={() => setActiveTab("search")}
            >
              Cancel request draft
            </button>
          </div>
        </div>
      )}
      {activeTab === "track" && (
        <>
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">STAY IN THE LOOP</span>
                <h2>Track a request</h2>
                <p>Use the tracking code you received when you booked.</p>
              </div>
            </div>
            <form className="form-stack" onSubmit={handleTrackRequest}>
              <Field label="Tracking code">
                <input
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="e.g. DEMO00001"
                  required
                />
              </Field>
              <div>
                <button className="button">
                  Track request <Icon />
                </button>
              </div>
            </form>
          </div>
          {trackingResult ? (
            <BookingSummary booking={trackingResult}>
              {bookingMedia(trackingResult)}
            </BookingSummary>
          ) : (
            <Empty title="See where things stand">
              Enter a tracking code to view the latest status and request
              details.
            </Empty>
          )}
        </>
      )}
      {activeTab === "myBookings" && (
        <>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">YOUR TO-DO, IN PROGRESS</span>
              <h2>My bookings</h2>
              <p>All your requests, from first hello to job done.</p>
            </div>
            <button
              className="button button-outline"
              onClick={() => setActiveTab("search")}
            >
              New request <Icon />
            </button>
          </div>
          {myBookingsLoading ? (
            <Empty title="Loading your bookings…" />
          ) : !myBookings.length ? (
            <Empty title="A fresh to-do list">
              Your requests will appear here after you make your first booking.
            </Empty>
          ) : (
            <div className="booking-list">
              {myBookings.map((b) => {
                const w = typeof b.workerId === "object" ? b.workerId : {};
                return (
                  <button
                    className="booking-row"
                    key={b._id || b.trackingId}
                    onClick={() => openBookingInfo(b)}
                  >
                    <Avatar
                      name={w.name || b.workerName}
                      src={w.photo ? toAbsoluteUrl(w.photo) : null}
                    />
                    <div className="booking-row-main">
                      <h3>{w.name || b.workerName || "Professional"}</h3>
                      <p>{b.jobDetails}</p>
                      <small>
                        {w.profession || b.profession} · {b.trackingId}
                      </small>
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
                );
              })}
            </div>
          )}
        </>
      )}
      {activeTab === "bookingInfo" && selectedBooking && (
        <>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">EVERYTHING IN ONE PLACE</span>
              <h2>Booking details</h2>
            </div>
            <button
              className="text-link"
              onClick={() => setActiveTab("myBookings")}
            >
              ← My bookings
            </button>
          </div>
          <BookingSummary booking={selectedBooking}>
            <hr />
            <div className="person-header">
              <Avatar
                name={
                  selectedBooking.workerId?.name || selectedBooking.workerName
                }
                src={
                  selectedBooking.workerId?.photo
                    ? toAbsoluteUrl(selectedBooking.workerId.photo)
                    : null
                }
              />
              <div>
                <h3>
                  {selectedBooking.workerId?.name ||
                    selectedBooking.workerName ||
                    "Professional"}
                </h3>
                <p>
                  {selectedBooking.workerId?.profession ||
                    selectedBooking.profession}{" "}
                  ·{" "}
                  {selectedBooking.workerId?.pincode || selectedBooking.pincode}
                </p>
                <p>
                  <a
                    href={`tel:${selectedBooking.workerId?.mobileNumber || selectedBooking.phone || ""}`}
                  >
                    {selectedBooking.workerId?.mobileNumber ||
                      selectedBooking.phone ||
                      ""}
                  </a>
                </p>
              </div>
            </div>
            {bookingMedia(selectedBooking)}
          </BookingSummary>
        </>
      )}
    </DashboardShell>
  );
};
export default CustomerDashboard;
