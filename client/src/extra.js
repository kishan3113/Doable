// // src/CustomerDashboard.js
// import React, { useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";

// const CustomerDashboard = () => {
//   const { state } = useLocation(); // customer info from login
//   const navigate = useNavigate();

//   const [activeTab, setActiveTab] = useState("profile");
//   const [pincode, setPincode] = useState("");
//   const [profession, setProfession] = useState("");
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedWorker, setSelectedWorker] = useState(null);
//   const [jobDetails, setJobDetails] = useState("");
//   const [bookingDate, setBookingDate] = useState("");
//   const [customerLocation, setCustomerLocation] = useState(null);

//   // 🔎 Track request state
//   const [trackingId, setTrackingId] = useState("");
//   const [trackingResult, setTrackingResult] = useState(null);

//   /* ✅ NEW: My Bookings state */
//   const [myBookings, setMyBookings] = useState([]);
//   const [myBookingsLoading, setMyBookingsLoading] = useState(false);

//   // ✅ NEW: Edit profile state
//   const [editMode, setEditMode] = useState(false);
//   const [profileData, setProfileData] = useState({
//     id: state?.id || "",
//     name: state?.name || "",
//     email: state?.email || "",
//     phone: state?.phone || "",
//   });
//   const [savingProfile, setSavingProfile] = useState(false);

//   // 📌 Save updated profile
//   const handleSaveProfile = async () => {
//     // Basic validation
//     if (!profileData.name || !profileData.email) {
//       alert("Please provide name and email.");
//       return;
//     }

//     setSavingProfile(true);
//     try {
//       // ✅ Get id from multiple sources (profileData, router state, or localStorage)
//       const customerId =
//         profileData.id ||
//         state?.customerId || // if login set this shape
//         state?.id || // fallback if state.id is used
//         localStorage.getItem("customerId") || "";

//       if (!customerId) {
//         alert("❌ No customer ID found. Please login again.");
//         setSavingProfile(false);
//         return;
//       }

//       console.log("Updating profile for id:", customerId);

//       // Preferred: call PUT /api/customers/:id
//       const res = await axios.put(`http://localhost:3001/api/customers/${customerId}`, {
//         name: profileData.name,
//         email: profileData.email,
//         phone: profileData.phone,
//       });

//       if (res.data?.success) {
//         alert("✅ Profile updated successfully!");
//         setEditMode(false);
//       } else {
//         alert("❌ Failed to update profile.");
//       }
//     } catch (err) {
//       console.error("Update profile error:", err);
//       const msg = err.response?.data?.message || err.message || "Unknown error";
//       alert("❌ Error while updating profile: " + msg);
//     }
//     setSavingProfile(false);
//   };

//   // 🔎 Search Workers
//   const handleSearch = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const response = await axios.get("http://localhost:3001/api/workers/search", {
//         params: { pincode, profession },
//       });
//       setResults(response.data.success ? response.data.workers : []);
//     } catch (error) {
//       console.error("Search error:", error);
//       setResults([]);
//     }
//     setLoading(false);
//   };

//   // 📌 Open booking tab
//   const handleBookingTab = (worker) => {
//     setSelectedWorker(worker);
//     setJobDetails("");
//     setBookingDate("");
//     setCustomerLocation(null);
//     setActiveTab("bookWorker");
//   };

//   // ✅ Confirm booking
//   const confirmBooking = async () => {
//     if (!jobDetails || !bookingDate) {
//       alert("❌ Please enter job details and select a date.");
//       return;
//     }
//     try {
//       const response = await axios.post("http://localhost:3001/api/bookings", {
//         workerId: selectedWorker._id,
//         clientName: state?.name,
//         jobDetails,
//         bookingDate,
//         location: customerLocation,
//       });
//       if (response.data.success) {
//         alert(`✅ Booking successful! Tracking ID: ${response.data.trackingId}`);
//         setActiveTab("track");
//       } else {
//         alert("❌ Booking failed. Try again.");
//       }
//     } catch (error) {
//       console.error("Booking error:", error);
//       alert("❌ Booking failed. Please try again.");
//     }
//   };

//   // 🔎 Track Request
//   const handleTrackRequest = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await axios.get(`http://localhost:3001/api/bookings/track/${trackingId}`);
//       setTrackingResult(res.data.success ? res.data.booking : null);
//     } catch (err) {
//       console.error("Track error:", err);
//       setTrackingResult(null);
//     }
//   };

//   /* ✅ NEW: Load all bookings for this customer (by name) */
//   const loadMyBookings = async () => {
//     if (!state?.name) return;
//     setMyBookingsLoading(true);
//     try {
//       const res = await axios.get("http://localhost:3001/api/bookings/customer", {
//         params: { name: state.name },
//       });
//       setMyBookings(res.data?.success ? res.data.bookings : []);
//     } catch (err) {
//       console.error("Load my bookings error:", err);
//       setMyBookings([]);
//     }
//     setMyBookingsLoading(false);
//   };

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "linear-gradient(135deg, #1f4037, #99f2c8)",
//         fontFamily: "Poppins, sans-serif",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "flex-start",
//         padding: "40px 10px",
//       }}
//     >
//       <div
//         style={{
//           width: "100%",
//           maxWidth: "850px",
//           background: "#fff",
//           borderRadius: "16px",
//           padding: "30px",
//           boxShadow: "0 10px 35px rgba(0,0,0,0.15)",
//         }}
//       >
//         <h1 style={{ textAlign: "center", marginBottom: "20px", color: "#2c3e50" }}>
//           👤 Customer Dashboard
//         </h1>

//         {/* Tabs */}
//         <div style={{ display: "flex", borderBottom: "2px solid #eee", marginBottom: "20px" }}>
//           {["profile", "search", "bookWorker", "track"].map(
//             (tab) =>
//               (tab !== "bookWorker" || selectedWorker) && (
//                 <button
//                   key={tab}
//                   onClick={() => setActiveTab(tab)}
//                   style={tabStyle(activeTab === tab)}
//                 >
//                   {tab === "profile" && "Profile"}
//                   {tab === "search" && "Search Worker"}
//                   {tab === "bookWorker" && "Book Worker"}
//                   {tab === "track" && "Track Request"}
//                 </button>
//               )
//           )}
//           {/* ✅ NEW: My Bookings tab button (added without removing your array) */}
//           <button
//             onClick={() => {
//               setActiveTab("myBookings");
//               loadMyBookings();
//             }}
//             style={tabStyle(activeTab === "myBookings")}
//           >
//             My Bookings
//           </button>
//         </div>

//         {/* Tab Content */}
//         <div style={{ padding: "20px" }}>
//           {/* Profile Tab */}
//           {activeTab === "profile" && (
//             <div>
//               <h2 style={{ marginBottom: "15px", color: "#2c3e50" }}>📋 Profile Info</h2>

//               {!editMode ? (
//                 <>
//                   <p><strong>ID:</strong> {profileData.id || state?.id}</p>
//                   <p><strong>Name:</strong> {profileData.name}</p>
//                   <p><strong>Email:</strong> {profileData.email}</p>
//                   <p><strong>Phone:</strong> {profileData.phone}</p>

//                   {/* NEW: Edit Profile Button */}
//                   <button
//                     onClick={() => setEditMode(true)}
//                     style={{
//                       marginTop: "12px",
//                       padding: "10px 14px",
//                       backgroundColor: "#f39c12",
//                       color: "#fff",
//                       border: "none",
//                       borderRadius: "8px",
//                       fontWeight: "600",
//                       cursor: "pointer",
//                     }}
//                   >
//                     ✏️ Edit Profile
//                   </button>
//                 </>
//               ) : (
//                 <>
//                   <input
//                     type="text"
//                     value={profileData.name}
//                     onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
//                     placeholder="Name"
//                     style={inputStyle}
//                   />
//                   <input
//                     type="email"
//                     value={profileData.email}
//                     onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
//                     placeholder="Email"
//                     style={inputStyle}
//                   />
//                   <input
//                     type="text"
//                     value={profileData.phone}
//                     onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
//                     placeholder="Phone"
//                     style={inputStyle}
//                   />

//                   <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
//                     <button
//                       onClick={handleSaveProfile}
//                       disabled={savingProfile}
//                       style={btnPrimary}
//                     >
//                       {savingProfile ? "Saving..." : "💾 Save"}
//                     </button>
//                     <button
//                       onClick={() => {
//                         // revert changes to original state values
//                         setProfileData({
//                           id: state?.id || "",
//                           name: state?.name || "",
//                           email: state?.email || "",
//                           phone: state?.phone || "",
//                         });
//                         setEditMode(false);
//                       }}
//                       style={btnDanger}
//                     >
//                       ❌ Cancel
//                     </button>
//                   </div>
//                 </>
//               )}
//             </div>
//           )}

//           {/* Search Tab */}
//           {activeTab === "search" && (
//             <div>
//               <h2 style={{ marginBottom: "15px", color: "#2c3e50" }}>🔎 Search for Workers</h2>
//               <form
//                 onSubmit={handleSearch}
//                 style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}
//               >
//                 <input
//                   type="text"
//                   placeholder="Enter Pincode"
//                   value={pincode}
//                   onChange={(e) => setPincode(e.target.value)}
//                   required
//                   style={inputStyle}
//                 />
//                 <select value={profession} onChange={(e) => setProfession(e.target.value)} style={inputStyle}>
//                   <option value="">-- Select Profession (optional) --</option>
//                   <option value="Plumber">Plumber</option>
//                   <option value="Electrician">Electrician</option>
//                   <option value="Carpenter">Carpenter</option>
//                   <option value="Painter">Painter</option>
//                   <option value="Mechanic">Mechanic</option>
//                   <option value="Cleaner">Cleaner</option>
//                   <option value="Gardener">Gardener</option>
//                 </select>
//                 <button type="submit" disabled={loading} style={btnPrimary}>
//                   {loading ? "Searching..." : "Search"}
//                 </button>
//               </form>

//               {/* Results */}
//               {results.length > 0 ? (
//                 <div style={{ display: "grid", gap: "20px" }}>
//                   {results.map((worker) => (
//                     <div key={worker._id} style={cardStyle}>
//                       <h3 style={{ margin: "0 0 10px", color: "#2c3e50" }}>{worker.name}</h3>
//                       <p><strong>Profession:</strong> {worker.profession}</p>
//                       <p><strong>Pincode:</strong> {worker.pincode}</p>
//                       <p><strong>Phone:</strong> {worker.mobileNumber}</p>
//                       <p style={{ fontSize: "12px", color: "#888" }}>
//                         <strong>ID:</strong> {worker._id}
//                       </p>
//                       <button onClick={() => handleBookingTab(worker)} style={btnSecondary}>
//                         📌 Book Worker
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 !loading && <p>No workers found.</p>
//               )}
//             </div>
//           )}

//           {/* Book Worker Tab */}
//           {activeTab === "bookWorker" && selectedWorker && (
//             <div>
//               <h2>Book Worker: {selectedWorker.name}</h2>
//               <p><strong>Profession:</strong> {selectedWorker.profession}</p>
//               <p><strong>Pincode:</strong> {selectedWorker.pincode}</p>
//               <p><strong>Phone:</strong> {selectedWorker.mobileNumber}</p>

//               <textarea
//                 placeholder="Enter job details (e.g., Fix leaking pipe)"
//                 value={jobDetails}
//                 onChange={(e) => setJobDetails(e.target.value)}
//                 style={{
//                   width: "100%",
//                   padding: "10px",
//                   borderRadius: "8px",
//                   border: "1px solid #ccc",
//                   marginTop: "10px",
//                 }}
//               ></textarea>

//               {/* 📅 Calendar for booking date */}
//               <input
//                 type="date"
//                 value={bookingDate}
//                 onChange={(e) => setBookingDate(e.target.value)}
//                 style={{
//                   width: "100%",
//                   padding: "10px",
//                   borderRadius: "8px",
//                   border: "1px solid #ccc",
//                   marginTop: "10px",
//                 }}
//               />

//               {/* 📍 Location Sharing */}
//               <button
//                 onClick={() => {
//                   if (navigator.geolocation) {
//                     navigator.geolocation.getCurrentPosition(
//                       (position) => {
//                         setCustomerLocation({
//                           latitude: position.coords.latitude,
//                           longitude: position.coords.longitude,
//                         });
//                         alert("✅ Location captured successfully!");
//                       },
//                       (error) => {
//                         alert("❌ Unable to fetch location. Please allow location access.");
//                         console.error(error);
//                       }
//                     );
//                   } else {
//                     alert("❌ Geolocation is not supported by this browser.");
//                   }
//                 }}
//                 style={{
//                   marginTop: "10px",
//                   padding: "10px",
//                   background: "#b1b1b1ff",
//                   color: "#ffffffba",
//                   border: "none",
//                   borderRadius: "8px",
//                   fontWeight: "600",
//                   cursor: "pointer",
//                 }}
//               >
//                 Share My Location
//               </button>

//               <button
//                 onClick={confirmBooking}
//                 style={{
//                   marginTop: "15px",
//                   padding: "12px",
//                   background: "#2ecc71",
//                   color: "#fff",
//                   border: "none",
//                   borderRadius: "8px",
//                   fontWeight: "600",
//                   cursor: "pointer",
//                 }}
//               >
//                 Confirm Booking
//               </button>
//             </div>
//           )}

//           {/* Track Request Tab */}
//           {activeTab === "track" && (
//             <div>
//               <h2>📍 Track Your Request</h2>
//               <form onSubmit={handleTrackRequest} style={{ display: "flex", gap: "10px" }}>
//                 <input
//                   type="text"
//                   placeholder="Enter Tracking ID"
//                   value={trackingId}
//                   onChange={(e) => setTrackingId(e.target.value)}
//                   required
//                   style={inputStyle}
//                 />
//                 <button type="submit" style={btnPrimary}>Track</button>
//               </form>
//               {trackingResult ? (
//                 <div style={cardStyle}>
//                   <p>
//                     <strong>Status:</strong>{" "}
//                     <span
//                       style={{
//                         padding: "4px 10px",
//                         borderRadius: "12px",
//                         fontWeight: "600",
//                         color: "#fff",
//                         backgroundColor:
//                           trackingResult.status === "pending"
//                             ? "#f39c12" // 🟡 Pending
//                             : trackingResult.status === "confirmed"
//                             ? "#3498db" // 🔵 Confirmed
//                             : trackingResult.status === "completed"
//                             ? "#2ecc71" // 🟢 Completed
//                             : "#e74c3c", // 🔴 Cancelled / Others
//                       }}
//                     >
//                       {trackingResult.status.charAt(0).toUpperCase() +
//                         trackingResult.status.slice(1)}
//                     </span>
//                   </p>
//                   <p><strong>Job:</strong> {trackingResult.jobDetails}</p>
//                   <p><strong>Date:</strong> {new Date(trackingResult.bookingDate).toLocaleDateString()}</p>
//                 </div>
//               ) : (
//                 trackingId && <p>No booking found with this ID.</p>
//               )}
//             </div>
//           )}

//           {/* ✅ NEW: My Bookings Tab */}
//           {activeTab === "myBookings" && (
//             <div>
//               <h2 style={{ marginBottom: "15px", color: "#2c3e50" }}>📚 My Bookings</h2>

//               {myBookingsLoading && <p>Loading your bookings…</p>}

//               {!myBookingsLoading && myBookings.length === 0 && (
//                 <p>No bookings found for your account yet.</p>
//               )}

//               {!myBookingsLoading && myBookings.length > 0 && (
//                 <div style={{ display: "grid", gap: "16px" }}>
//                   {myBookings.map((bk) => (
//                     <div key={bk._id} style={cardStyle}>
//                       <p><strong>Tracking Code:</strong> {bk.trackingId}</p>
//                       <p><strong>Job:</strong> {bk.jobDetails}</p>
//                       <p><strong>Date:</strong> {new Date(bk.bookingDate).toLocaleDateString()}</p>
//                       <p>
//                         <strong>Status:</strong>{" "}
//                         <span
//                           style={{
//                             padding: "4px 10px",
//                             borderRadius: "12px",
//                             fontWeight: "600",
//                             color: "#fff",
//                             backgroundColor:
//                               bk.status === "pending"
//                                 ? "#f39c12"
//                                 : bk.status === "confirmed"
//                                 ? "#3498db"
//                                 : bk.status === "completed"
//                                 ? "#2ecc71"
//                                 : "#e74c3c",
//                           }}
//                         >
//                           {bk.status?.charAt(0).toUpperCase() + bk.status?.slice(1)}
//                         </span>
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Logout */}
//         <button onClick={() => navigate("/")} style={btnDanger}>
//           🚪 Logout
//         </button>
//       </div>
//     </div>
//   );
// };

// /* 🎨 Reusable Styles */
// const tabStyle = (isActive) => ({
//   flex: 1,
//   padding: "12px",
//   background: isActive ? "#3498db" : "transparent",
//   color: isActive ? "#fff" : "#2c3e50",
//   border: "none",
//   borderRadius: "8px 8px 0 0",
//   fontWeight: "600",
//   cursor: "pointer",
// });

// const inputStyle = {
//   padding: "12px",
//   borderRadius: "8px",
//   border: "1px solid #ccc",
//   fontSize: "14px",
//   marginBottom: "10px",
// };

// const btnPrimary = {
//   padding: "12px",
//   backgroundColor: "#3498db",
//   color: "#fff",
//   border: "none",
//   borderRadius: "8px",
//   fontWeight: "600",
//   cursor: "pointer",
//   marginTop: "10px",
// };

// const btnSecondary = {
//   padding: "10px 15px",
//   backgroundColor: "#2ecc71",
//   color: "#fff",
//   border: "none",
//   borderRadius: "8px",
//   fontWeight: "600",
//   cursor: "pointer",
//   marginTop: "10px",
// };

// const btnDanger = {
//   marginTop: "20px",
//   width: "100%",
//   padding: "12px",
//   backgroundColor: "#e74c3c",
//   color: "#fff",
//   border: "none",
//   borderRadius: "8px",
//   fontWeight: "600",
//   cursor: "pointer",
// };

// const cardStyle = {
//   border: "1px solid #ddd",
//   borderRadius: "12px",
//   padding: "20px",
//   background: "#f9f9f9",
//   boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
// };

// export default CustomerDashboard;
