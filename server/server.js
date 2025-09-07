// server.js
// Full backend with booking photos support + soft-delete-by-worker behavior.
// Added: worker availability endpoints + slot checking + booking.time + compound unique index.
// Added: blocked-dates API + safe booking creation route.
// NEW: unified POST /api/workers/:id/availability endpoint (add/remove/replace blockedDates, set working hours).
// Also: bookings now store client's address (clientAddress) and client's phone (clientPhone)
// Added: POST /api/customers/:id/change-password for customer's password change
// Added: GET /api/bookings/:id to fetch booking by ObjectId (used by frontend when opening a booking by id)
// NOTE: Customer `name` field is now unique (enforced in schema + registration checks).

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const mongoURI = process.env.MONGO_URI;

// Safety: terminal statuses (only bookings in these states may be deleted by worker/customer)
const TERMINAL_STATUSES = ["completed", "cancelled"];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure uploads directory exists (NEW: create uploads on startup if missing)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads directory:", uploadsDir);
}

// Configure Multer for file uploads (single multer instance reused)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ensure uploads folder exists
    const dir = path.join(__dirname, "uploads");
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Connect to MongoDB (with guard if MONGO_URI not set)
if (!mongoURI) {
  console.error("❌ MONGO_URI is not set in .env — please set it and restart the server.");
  process.exit(1);
}
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ Could not connect to MongoDB", err);
    process.exit(1);
  });

/* ------------------ MODELS ------------------ */

// Worker model (added blockedDates + workingHours for availability)
const workerSchema = new mongoose.Schema({
  name: { type: String, required: true }, // no unique constraint
  password: { type: String, required: true },
  profession: { type: String, default: "" },
  area: { type: String, default: "" },
  city: { type: String, default: "" },
  mobileNumber: { type: String, required: true, unique: true },
  pincode: { type: String, required: true, minlength: 6, maxlength: 6 },
  photo: { type: String, default: "" },
  // availability fields:
  blockedDates: { type: [String], default: [] }, // array of 'YYYY-MM-DD' strings
  workingHours: {
    start: { type: String, default: "09:00" }, // "HH:MM"
    end: { type: String, default: "18:00" }, // "HH:MM"
    slotDuration: { type: Number, default: 30 }, // minutes
  },
});
const Worker = mongoose.model("Worker", workerSchema);

// Booking model (now supports photos array + soft-delete flags + time slot + clientAddress + clientPhone)
const bookingSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
  clientName: { type: String, required: true },
  clientPhone: { type: String, default: "" },    // <-- NEW: customer's mobile number
  clientAddress: { type: String, default: "" }, // <-- NEW: customer's address
  jobDetails: { type: String, required: true },
  bookingDate: { type: Date, required: true }, // date portion used for availability
  time: { type: String, default: null }, // "HH:MM" slot string (optional)
  status: { type: String, default: "pending" },
  trackingId: { type: String, required: true, unique: true },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    googleMapsUrl: { type: String },
  },
  photos: { type: [String], default: [] }, // <-- photo URLs saved here
  // soft-delete flags
  deletedByWorker: { type: Boolean, default: false },
  deletedByCustomer: { type: Boolean, default: false },
}, { timestamps: true });

// compound index to help prevent duplicate slot bookings (best-effort)
// Note: for full safety, use transactions/atomic upserts and application-level checks.
bookingSchema.index({ workerId: 1, bookingDate: 1, time: 1 }, { unique: true, partialFilterExpression: { time: { $type: "string" } } });

const Booking = mongoose.model("Booking", bookingSchema);

// Customer model — enforce unique name + email
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // <-- unique customer name
  email: { type: String, required: true, unique: true }, // Gmail
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// ensure indexes (explicit)
customerSchema.index({ name: 1 }, { unique: true });
customerSchema.index({ email: 1 }, { unique: true });

const Customer = mongoose.model("Customer", customerSchema);

/* ------------------ Utility Helpers ------------------ */

/**
 * Validate time string "HH:MM" (24-hour).
 */
function isValidTimeString(t) {
  if (!t || typeof t !== "string") return false;
  const m = t.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return !!m;
}

/**
 * Generate slots between start and end times using duration minutes.
 * startTime/endTime: "HH:MM" strings
 * returns array of "HH:MM" strings
 */
function generateSlots(startTime, endTime, durationMin) {
  const slots = [];
  // build Date objects on an arbitrary date (we'll not use day)
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  // pick an arbitrary date seed
  const seed = new Date("1970-01-01T00:00:00Z");
  let cur = new Date(seed);
  cur.setUTCHours(sh, sm, 0, 0);
  const end = new Date(seed);
  end.setUTCHours(eh, em, 0, 0);

  while (cur < end) {
    const hh = String(cur.getUTCHours()).padStart(2, "0");
    const mm = String(cur.getUTCMinutes()).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
    cur = new Date(cur.getTime() + durationMin * 60000); // add minutes
  }
  return slots;
}

/* ------------------ WORKER ROUTES ------------------ */

// Worker registration
app.post("/api/auth/register", upload.single("photo"), async (req, res) => {
  try {
    const { name, password, mobileNumber, profession, area, city, pincode } = req.body;

    if (!name || !password || !mobileNumber || !pincode) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    if (String(pincode).length !== 6) {
      return res.status(400).json({ success: false, message: "Pincode must be exactly 6 digits." });
    }

    const existingWorkerByMobile = await Worker.findOne({ mobileNumber });
    if (existingWorkerByMobile) {
      return res.status(400).json({ success: false, message: "Worker with this mobile number already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    const newWorker = new Worker({
      name,
      password: hashedPassword,
      mobileNumber,
      profession,
      area,
      city,
      pincode,
      photo: photoPath,
    });

    const savedWorker = await newWorker.save();
    res.status(201).json({ success: true, message: "Registration successful!", workerId: savedWorker._id });
  } catch (err) {
    console.error("Registration failed:", err);
    // handle duplicate key error explicitly for clarity
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Duplicate key error.", error: err.keyValue });
    }
    res.status(500).json({ success: false, message: "Registration failed.", error: err.message });
  }
});

// Worker login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ success: false, message: "Name and password required." });
    }
    const worker = await Worker.findOne({ name });
    if (!worker) {
      return res.status(400).json({ success: false, message: "Invalid name or password." });
    }

    const isMatch = await bcrypt.compare(password, worker.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid name or password." });
    }

    res.status(200).json({
      success: true,
      message: "Login successful!",
      role: "worker",
      workerId: worker._id,
      name: worker.name,
      profession: worker.profession,
      mobileNumber: worker.mobileNumber,
      pincode: worker.pincode,
      area: worker.area,
      city: worker.city,
    });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ success: false, message: "Login failed.", error: err.message });
  }
});

// Worker search by pincode + profession
app.get("/api/workers/search", async (req, res) => {
  try {
    const { pincode, profession } = req.query;
    let query = {};
    if (pincode) query.pincode = pincode;
    if (profession) query.profession = { $regex: new RegExp(profession, "i") };

    const workers = await Worker.find(query).select("-password");
    return res.status(200).json({
      success: true,
      workers, // [] if none
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ success: false, message: "Search failed.", error: err.message });
  }
});

/* ------------------ AVAILABILITY ENDPOINTS ------------------ */

/**
 * GET /api/workers/:workerId/availability
 * returns worker blockedDates and workingHours
 */
app.get("/api/workers/:workerId/availability", async (req, res) => {
  try {
    const { workerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ success: false, message: "Invalid worker id format." });
    }
    const worker = await Worker.findById(workerId).select("blockedDates workingHours");
    if (!worker) return res.status(404).json({ success: false, message: "Worker not found." });

    return res.json({
      success: true,
      blockedDates: worker.blockedDates || [],
      workingHours: worker.workingHours || { start: "09:00", end: "18:00", slotDuration: 30 },
    });
  } catch (err) {
    console.error("[GET availability] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch availability.", error: err.message });
  }
});

/**
 * GET /api/workers/:workerId/availability/slots?date=YYYY-MM-DD
 * Returns available slots on that date, taking into account:
 * - worker.workingHours
 * - worker.blockedDates
 * - existing bookings for that worker on that date (status confirmed/ongoing/pending depending on your rules)
 *
 * Response: { success: true, date: "YYYY-MM-DD", availableSlots: ["09:00","09:30"] }
 */
app.get("/api/workers/:workerId/availability/slots", async (req, res) => {
  try {
    const { workerId } = req.params;
    const { date } = req.query; // expect YYYY-MM-DD

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ success: false, message: "Invalid worker id format." });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: "date query required in YYYY-MM-DD format." });
    }

    // basic date format check (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: "date must be in YYYY-MM-DD format." });
    }

    const worker = await Worker.findById(workerId).select("blockedDates workingHours");
    if (!worker) return res.status(404).json({ success: false, message: "Worker not found." });

    // If the day is blocked, return empty
    if ((worker.blockedDates || []).includes(date)) {
      return res.json({ success: true, date, availableSlots: [] });
    }

    const { start = "09:00", end = "18:00", slotDuration = 30 } = worker.workingHours || {};

    // validate times
    if (!isValidTimeString(start) || !isValidTimeString(end)) {
      return res.status(500).json({ success: false, message: "Worker has invalid working hours configured." });
    }

    const allSlots = generateSlots(start, end, slotDuration);

    // Fetch bookings for that worker and date that would make slots unavailable.
    // We'll treat bookings with status 'confirmed' and 'pending' as occupying a slot.
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    const bookedDocs = await Booking.find({
      workerId,
      bookingDate: { $gte: dayStart, $lte: dayEnd },
      time: { $ne: null },
      status: { $in: ["pending", "confirmed", "ongoing"] },
    }).select("time -_id").lean();

    const bookedTimes = (bookedDocs || []).map(b => b.time);
    const availableSlots = allSlots.filter(s => !bookedTimes.includes(s));

    return res.json({ success: true, date, availableSlots });
  } catch (err) {
    console.error("[GET availability slots] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to compute available slots.", error: err.message });
  }
});

/* ------------------ NEW UNIFIED AVAILABILITY UPDATE ENDPOINT ------------------ */

/**
 * POST /api/workers/:id/availability
 * Body options:
 *  - action: "addBlocked" | "removeBlocked" | "replaceBlocked" | "setWorkingHours"
 *  - dates: ["YYYY-MM-DD", ...]            (for blocked dates)
 *  - workingHours: { start, end, slotDuration } (for hours)
 *
 * This provides a single endpoint for frontend to update availability safely.
 */
app.post("/api/workers/:id/availability", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, dates, workingHours } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid worker id." });
    }

    const worker = await Worker.findById(id);
    if (!worker) return res.status(404).json({ success: false, message: "Worker not found." });

    // Helper: validate dates array format
    function validateDatesArray(arr) {
      if (!Array.isArray(arr)) return false;
      for (const d of arr) {
        if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
      }
      return true;
    }

    if (action === "addBlocked") {
      if (!validateDatesArray(dates)) return res.status(400).json({ success: false, message: "dates must be array of YYYY-MM-DD strings." });
      await Worker.findByIdAndUpdate(id, { $addToSet: { blockedDates: { $each: dates } } }, { new: true });
    } else if (action === "removeBlocked") {
      if (!validateDatesArray(dates)) return res.status(400).json({ success: false, message: "dates must be array of YYYY-MM-DD strings." });
      await Worker.findByIdAndUpdate(id, { $pull: { blockedDates: { $in: dates } } }, { new: true });
    } else if (action === "replaceBlocked") {
      if (!validateDatesArray(dates)) return res.status(400).json({ success: false, message: "dates must be array of YYYY-MM-DD strings." });
      await Worker.findByIdAndUpdate(id, { $set: { blockedDates: dates } }, { new: true });
    } else if (action === "setWorkingHours") {
      if (!workingHours || typeof workingHours !== "object") return res.status(400).json({ success: false, message: "workingHours object required." });
      const { start, end, slotDuration } = workingHours;
      if (!isValidTimeString(start) || !isValidTimeString(end) || typeof slotDuration !== "number") {
        return res.status(400).json({ success: false, message: "workingHours must include valid start,end (HH:MM) and numeric slotDuration." });
      }
      await Worker.findByIdAndUpdate(id, { $set: { workingHours } }, { new: true });
    } else {
      return res.status(400).json({ success: false, message: "Invalid action. Use addBlocked|removeBlocked|replaceBlocked|setWorkingHours" });
    }

    const updated = await Worker.findById(id).select("-password");
    return res.json({ success: true, message: "Availability updated.", worker: updated });
  } catch (err) {
    console.error("[POST /api/workers/:id/availability] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to update availability.", error: err.message });
  }
});

/* ------------------ BLOCKED-DATES API ------------------ */

/**
 * POST  /api/workers/:id/blocked-dates
 * Body: { action: "add" | "remove" | "replace", dates: ["2025-09-10", ...] }
 * - add: push new unique dates to blockedDates
 * - remove: pull listed dates
 * - replace: overwrite blockedDates with provided array
 */
app.post("/api/workers/:id/blocked-dates", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, dates } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid worker id." });
    }
    if (!action || !["add", "remove", "replace"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action. Use add|remove|replace." });
    }
    if (!Array.isArray(dates)) {
      return res.status(400).json({ success: false, message: "dates must be an array of YYYY-MM-DD strings." });
    }

    // simple validation for each date
    for (const d of dates) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return res.status(400).json({ success: false, message: `Invalid date format: ${d}` });
      }
    }

    let update;
    if (action === "add") {
      // use $addToSet with $each to avoid duplicates
      update = { $addToSet: { blockedDates: { $each: dates } } };
    } else if (action === "remove") {
      update = { $pull: { blockedDates: { $in: dates } } };
    } else {
      // replace
      update = { $set: { blockedDates: dates } };
    }

    const worker = await Worker.findByIdAndUpdate(id, update, { new: true }).select("-password");
    if (!worker) return res.status(404).json({ success: false, message: "Worker not found." });

    return res.json({ success: true, message: "Blocked dates updated.", blockedDates: worker.blockedDates });
  } catch (err) {
    console.error("[POST /api/workers/:id/blocked-dates] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to update blocked dates.", error: err.message });
  }
});

/* ------------------ BOOKING ROUTES (updated for photos + time slot checking + clientAddress + clientPhone) ------------------ */

/**
 * Helper: build a unique trackingId (quick loop to avoid collision)
 */
async function generateUniqueTrackingId() {
  // naive but fine for small scale / demo
  for (let i = 0; i < 5; i++) {
    const candidate = Math.random().toString(36).substr(2, 9).toUpperCase();
    const exists = await Booking.exists({ trackingId: candidate });
    if (!exists) return candidate;
  }
  // fallback
  return Math.random().toString(36).substr(2, 12).toUpperCase();
}

/**
 * Create booking (standard route).
 * - Accepts multipart/form-data with `photos` (multiple) OR JSON payload (no files).
 * - If multipart is used, multer will populate req.files and text fields will be in req.body as strings.
 * - Supports 'time' optional field (string "HH:MM")
 */
app.post("/api/bookings", upload.array("photos", 10), async (req, res) => {
  try {
    // When using multipart, fields are strings; when using JSON, req.body may already be object.
    // Normalize fields:
    const workerId = req.body.workerId;
    const clientName = req.body.clientName;
    // accept phone from common field names
    const clientPhone = req.body.clientPhone || req.body.phone || req.body.mobile || "";
    const clientAddress = req.body.address || req.body.clientAddress || ""; // <-- NEW: accept address
    const jobDetails = req.body.jobDetails;
    const bookingDateRaw = req.body.bookingDate; // expect ISO date or YYYY-MM-DD
    const timeSlot = req.body.time || req.body.timeSlot || null; // optional "HH:MM"
    const locationRaw = req.body.location;

    if (!workerId || !clientName || !jobDetails || !bookingDateRaw) {
      return res.status(400).json({ success: false, message: "Missing required booking fields." });
    }

    // validate workerId
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ success: false, message: "Invalid workerId format." });
    }

    // parse bookingDate (accepts either a full ISO or YYYY-MM-DD)
    const bookingDate = new Date(bookingDateRaw);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid bookingDate." });
    }

    // parse location: could be JSON string or object
    let locationData = null;
    if (locationRaw) {
      if (typeof locationRaw === "string") {
        try {
          const parsed = JSON.parse(locationRaw);
          if (parsed && parsed.latitude && parsed.longitude) {
            locationData = {
              latitude: Number(parsed.latitude),
              longitude: Number(parsed.longitude),
              googleMapsUrl: `https://www.google.com/maps?q=${parsed.latitude},${parsed.longitude}`,
            };
          }
        } catch (e) {
          // if string but not JSON, ignore or leave as null
        }
      } else if (typeof locationRaw === "object" && locationRaw.latitude && locationRaw.longitude) {
        locationData = {
          latitude: Number(locationRaw.latitude),
          longitude: Number(locationRaw.longitude),
          googleMapsUrl: `https://www.google.com/maps?q=${locationRaw.latitude},${locationRaw.longitude}`,
        };
      }
    }

    // handle uploaded files (req.files when multipart used)
    const photoFiles = Array.isArray(req.files) ? req.files : [];
    const photoPaths = photoFiles.map((f) => `/uploads/${f.filename}`);

    // Look up worker to validate availability and blocked dates
    const worker = await Worker.findById(workerId).select("blockedDates workingHours");
    if (!worker) return res.status(404).json({ success: false, message: "Worker not found." });

    // Format date string YYYY-MM-DD for blockedDates checking
    const yyyy = bookingDate.getUTCFullYear();
    const mm = String(bookingDate.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(bookingDate.getUTCDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if ((worker.blockedDates || []).includes(dateStr)) {
      return res.status(400).json({ success: false, message: "Worker is not available on this date (blocked)." });
    }

    // If a time slot was provided, validate it's in worker's slots and not already booked
    if (timeSlot) {
      if (!isValidTimeString(timeSlot)) {
        return res.status(400).json({ success: false, message: "Invalid time slot format. Use HH:MM." });
      }

      const { start = "09:00", end = "18:00", slotDuration = 30 } = worker.workingHours || {};
      const candidateSlots = generateSlots(start, end, slotDuration);

      if (!candidateSlots.includes(timeSlot)) {
        return res.status(400).json({ success: false, message: "Selected time slot is outside worker's working hours or not aligned to slot duration." });
      }

      // check existing booking for same worker/date/time
      const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
      const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);
      const existing = await Booking.findOne({
        workerId,
        bookingDate: { $gte: dayStart, $lte: dayEnd },
        time: timeSlot,
        status: { $in: ["pending", "confirmed", "ongoing"] },
      });

      if (existing) {
        return res.status(409).json({ success: false, message: "Slot already booked." });
      }
    }

    // trackingId unique
    const trackingId = await generateUniqueTrackingId();

    const newBooking = new Booking({
      workerId,
      clientName,
      clientPhone,            // <-- saved here
      clientAddress,          // <-- saved here
      jobDetails,
      bookingDate,
      time: timeSlot || null,
      trackingId,
      location: locationData,
      photos: photoPaths,
      // deleted flags default to false
    });

    await newBooking.save();
    res.status(201).json({ success: true, message: "Booking created successfully!", trackingId, booking: newBooking });
  } catch (err) {
    console.error("Booking creation failed:", err);
    // handle duplicate key error (compound index) gracefully
    if (err.code === 11000) {
      // If it's a unique index violation on workerId+bookingDate+time
      return res.status(409).json({ success: false, message: "Slot already booked (unique constraint). Try again." });
    }
    res.status(500).json({ success: false, message: "Failed to create booking.", error: err.message });
  }
});

/* ------------------ SAFE BOOKING ROUTE (transaction) ------------------ */

/**
 * POST /api/bookings/safe
 * Safer booking creation under high concurrency.
 * Body: workerId, clientName, clientAddress, clientPhone, jobDetails, bookingDate, time (optional), photos multipart ok
 *
 * NOTE: Transactions require MongoDB replica set (or Atlas). If no transaction support,
 * the route will attempt session use and fall back to standard behavior with a clear error.
 */
app.post("/api/bookings/safe", upload.array("photos", 10), async (req, res) => {
  let session;
  try {
    // Try to start a session. If the deployment doesn't support transactions, session.startTransaction() will throw.
    session = await mongoose.startSession();
    session.startTransaction();

    const workerId = req.body.workerId;
    const clientName = req.body.clientName;
    // accept phone from common field names
    const clientPhone = req.body.clientPhone || req.body.phone || req.body.mobile || "";
    const clientAddress = req.body.address || req.body.clientAddress || ""; // <-- NEW
    const jobDetails = req.body.jobDetails;
    const bookingDateRaw = req.body.bookingDate;
    const timeSlot = req.body.time || req.body.timeSlot || null;
    const locationRaw = req.body.location;

    if (!workerId || !clientName || !jobDetails || !bookingDateRaw) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Missing required booking fields." });
    }

    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Invalid workerId format." });
    }

    const bookingDate = new Date(bookingDateRaw);
    if (isNaN(bookingDate.getTime())) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Invalid bookingDate." });
    }

    // parse/verify location (same as other route)
    let locationData = null;
    if (locationRaw) {
      if (typeof locationRaw === "string") {
        try {
          const parsed = JSON.parse(locationRaw);
          if (parsed && parsed.latitude && parsed.longitude) {
            locationData = {
              latitude: Number(parsed.latitude),
              longitude: Number(parsed.longitude),
              googleMapsUrl: `https://www.google.com/maps?q=${parsed.latitude},${parsed.longitude}`,
            };
          }
        } catch (e) {}
      } else if (typeof locationRaw === "object" && locationRaw.latitude && locationRaw.longitude) {
        locationData = {
          latitude: Number(locationRaw.latitude),
          longitude: Number(locationRaw.longitude),
          googleMapsUrl: `https://www.google.com/maps?q=${locationRaw.latitude},${locationRaw.longitude}`,
        };
      }
    }

    // files
    const photoFiles = Array.isArray(req.files) ? req.files : [];
    const photoPaths = photoFiles.map((f) => `/uploads/${f.filename}`);

    // get worker inside session
    const worker = await Worker.findById(workerId).session(session);
    if (!worker) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Worker not found." });
    }

    // Format date string YYYY-MM-DD for blockedDates checking
    const yyyy = bookingDate.getUTCFullYear();
    const mm = String(bookingDate.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(bookingDate.getUTCDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if ((worker.blockedDates || []).includes(dateStr)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Worker is not available on this date (blocked)." });
    }

    // validate timeslot (if provided)
    if (timeSlot) {
      if (!isValidTimeString(timeSlot)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: "Invalid time slot format. Use HH:MM." });
      }
      const { start = "09:00", end = "18:00", slotDuration = 30 } = worker.workingHours || {};
      const candidateSlots = generateSlots(start, end, slotDuration);
      if (!candidateSlots.includes(timeSlot)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: "Selected time slot is outside worker's working hours or not aligned to slot duration." });
      }
    }

    // Check existing booking conflict inside transaction
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const conflictFilter = {
      workerId,
      bookingDate: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ["pending", "confirmed", "ongoing"] },
    };
    if (timeSlot) conflictFilter.time = timeSlot;

    const conflict = await Booking.findOne(conflictFilter).session(session);
    if (conflict) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, message: "Slot already booked (conflict detected)." });
    }

    // create booking
    const trackingId = await generateUniqueTrackingId();
    const createDoc = {
      workerId,
      clientName,
      clientPhone,            // <-- saved here
      clientAddress,          // <-- saved here
      jobDetails,
      bookingDate,
      time: timeSlot || null,
      status: "confirmed",
      trackingId,
      location: locationData,
      photos: photoPaths,
      deletedByWorker: false,
      deletedByCustomer: false,
    };

    const createdArr = await Booking.create([createDoc], { session });
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ success: true, message: "Booking created (safe).", booking: createdArr[0] });
  } catch (err) {
    console.error("[POST /api/bookings/safe] Error:", err);
    try {
      if (session) { await session.abortTransaction(); session.endSession(); }
    } catch (e) {}
    if (err && err.code === 11000) {
      return res.status(409).json({ success: false, message: "Slot already booked (unique constraint)." });
    }
    // If transactions not supported, return specific message
    if (err && /transactions|replica set|not supported/i.test(String(err.message || ""))) {
      return res.status(500).json({ success: false, message: "Transactions not supported on this MongoDB deployment. Use /api/bookings (non-transactional) or enable replica set." });
    }
    return res.status(500).json({ success: false, message: "Failed to create booking safely.", error: err.message });
  }
});

/* ------------------ Get worker bookings / track / status / customer bookings (unchanged) ------------------ */

// Get worker bookings (exclude those soft-deleted by that worker)
app.get("/api/bookings/worker/:id", async (req, res) => {
  try {
    const workerId = req.params.id;
    // only bookings that are not soft-deleted by this worker
    const bookings = await Booking.find({ workerId, deletedByWorker: { $ne: true } }).sort({ bookingDate: -1 });
    res.status(200).json({ success: true, bookings });
  } catch (err) {
    console.error("Fetch bookings failed:", err);
    res.status(500).json({ success: false, message: "Failed to fetch bookings.", error: err.message });
  }
});

// Track booking (returns full booking so frontend can display jobDetails & bookingDate)
app.get("/api/bookings/track/:trackingId", async (req, res) => {
  try {
    const booking = await Booking.findOne({ trackingId: req.params.trackingId })
      .populate("workerId", "name profession mobileNumber pincode")
      .lean();
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    console.error("Track booking failed:", err);
    res.status(500).json({ success: false, message: "Failed to track booking.", error: err.message });
  }
});

// Get booking by MongoDB ObjectId (useful for frontend open-by-id)
app.get("/api/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking id format." });
    }
    const booking = await Booking.findById(id).populate("workerId", "name profession mobileNumber pincode photo").lean();
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });
    return res.status(200).json({ success: true, booking });
  } catch (err) {
    console.error("[GET /api/bookings/:id] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch booking.", error: err.message });
  }
});

// ✅ NEW: Update booking status
app.put("/api/bookings/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    res.json({
      success: true,
      message: "Booking status updated successfully.",
      booking,
    });
  } catch (err) {
    console.error("Update booking status failed:", err);
    res.status(500).json({ success: false, message: "Failed to update booking status.", error: err.message });
  }
});

// ✅ NEW: Get all bookings for a customer (by name) — exclude those deleted by customer
app.get("/api/bookings/customer", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required." });
    }

    // exclude bookings where the customer has soft-deleted
    const bookings = await Booking.find({ clientName: name, deletedByCustomer: { $ne: true } })
      .sort({ bookingDate: -1 }) // most recent first
      .select("-__v");

    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    console.error("Fetch customer bookings failed:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings." });
  }
});

/* ------------------ NEW ADDITION ------------------ */
/**
 * Get all bookings for a customer by customerId (recommended)
 * - Populates workerId so frontend can show worker name, profession, mobileNumber, pincode, photo, etc.
 * - Excludes bookings where the customer has soft-deleted (deletedByCustomer=true).
 */
app.get("/api/bookings/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer id format." });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    const bookings = await Booking.find({ clientName: customer.name, deletedByCustomer: { $ne: true } })
      .sort({ bookingDate: -1 })
      .populate("workerId", "name profession mobileNumber pincode photo")
      .select("-__v");

    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    console.error("[GET /api/bookings/customer/:customerId] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch bookings for customer.", error: err.message });
  }
});
/* ------------------ END NEW ADDITION ------------------ */

/* ------------------ Soft-delete endpoints (worker/customer) ------------------ */

async function validateWorkerOwnership(req, res, booking) {
  const headerWorkerId = req.header("x-worker-id") || req.query.workerId || req.body.workerId;
  if (!headerWorkerId) {
    res.status(400).json({ success: false, message: "Missing x-worker-id header. Delete must be requested by the worker who owns the booking." });
    return new Error("missing-worker-header");
  }

  if (!mongoose.Types.ObjectId.isValid(headerWorkerId)) {
    res.status(400).json({ success: false, message: "Invalid worker id format in x-worker-id header." });
    return new Error("invalid-worker-id");
  }

  if (booking.workerId.toString() !== headerWorkerId.toString()) {
    res.status(403).json({ success: false, message: "Forbidden: you are not the owner of this booking." });
    return new Error("not-owner");
  }

  const workerExists = await Worker.exists({ _id: headerWorkerId });
  if (!workerExists) {
    res.status(404).json({ success: false, message: "Worker not found for provided x-worker-id." });
    return new Error("worker-not-found");
  }

  return null; // validated
}

// Worker soft-delete endpoint: marks deletedByWorker = true
app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[DELETE /api/bookings/:id] id:", id, "x-worker-id:", req.header("x-worker-id"));

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking id format." });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    // check ownership
    const ownershipErr = await validateWorkerOwnership(req, res, booking);
    if (ownershipErr) return; // validateWorkerOwnership already sent response

    // only allow marking deleted if booking is in terminal status
    if (!TERMINAL_STATUSES.includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot delete booking with status "${booking.status}". Only completed or cancelled bookings can be deleted.` });
    }

    // mark soft-delete by worker
    booking.deletedByWorker = true;
    await booking.save();

    console.log(`[SOFT-DELETE] Booking ${id} marked deletedByWorker=true by worker ${req.header("x-worker-id")} (status=${booking.status})`);
    return res.status(200).json({ success: true, message: "Booking hidden from worker dashboard (soft-deleted)." });
  } catch (err) {
    console.error("[DELETE /api/bookings/:id] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to soft-delete booking.", error: err.message });
  }
});

// compatibility pattern
app.delete("/api/bookings/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[DELETE /api/bookings/delete/:id] id:", id, "x-worker-id:", req.header("x-worker-id"));

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking id format." });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const ownershipErr = await validateWorkerOwnership(req, res, booking);
    if (ownershipErr) return;

    if (!TERMINAL_STATUSES.includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot delete booking with status "${booking.status}". Only completed or cancelled bookings can be deleted.` });
    }

    booking.deletedByWorker = true;
    await booking.save();

    console.log(`[SOFT-DELETE] Booking ${id} marked deletedByWorker=true by worker ${req.header("x-worker-id")} (status=${booking.status})`);
    return res.status(200).json({ success: true, message: "Booking hidden from worker dashboard (soft-deleted)." });
  } catch (err) {
    console.error("[DELETE /api/bookings/delete/:id] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to soft-delete booking.", error: err.message });
  }
});

// compatibility pattern
app.delete("/api/bookings/:id/delete", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[DELETE /api/bookings/:id/delete] id:", id, "x-worker-id:", req.header("x-worker-id"));

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking id format." });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const ownershipErr = await validateWorkerOwnership(req, res, booking);
    if (ownershipErr) return;

    if (!TERMINAL_STATUSES.includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot delete booking with status "${booking.status}". Only completed or cancelled bookings can be deleted.` });
    }

    booking.deletedByWorker = true;
    await booking.save();

    console.log(`[SOFT-DELETE] Booking ${id} marked deletedByWorker=true by worker ${req.header("x-worker-id")} (status=${booking.status})`);
    return res.status(200).json({ success: true, message: "Booking hidden from worker dashboard (soft-deleted)." });
  } catch (err) {
    console.error("[DELETE /api/bookings/:id/delete] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to soft-delete booking.", error: err.message });
  }
});

/* ------------------ Hard-delete (admin) ------------------ */
/* Not used by worker UI. Only for admin/manual cleanup. Keep this separate and protected later with auth. */
app.delete("/api/bookings/:id/hard-delete", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[HARD-DELETE] id:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid booking id format." });
    }

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });

    await Booking.findByIdAndDelete(id);
    console.log(`[HARD-DELETE] Booking ${id} permanently removed.`);

    return res.status(200).json({ success: true, message: "Booking permanently deleted." });
  } catch (err) {
    console.error("[HARD-DELETE] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to hard-delete booking.", error: err.message });
  }
});

/* ------------------ CUSTOMER ROUTES ------------------ */

// Customer registration
app.post("/api/customers", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password || !phone || !address) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedName = String(name).trim();

    // Check both unique constraints explicitly for clearer errors
    const existingByEmail = await Customer.findOne({ email: normalizedEmail });
    if (existingByEmail) {
      return res.status(400).json({ success: false, message: "Customer with this email already exists." });
    }
    const existingByName = await Customer.findOne({ name: normalizedName });
    if (existingByName) {
      return res.status(400).json({ success: false, message: "Customer name is already taken. Please choose another name." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newCustomer = new Customer({ name: normalizedName, email: normalizedEmail, password: hashedPassword, phone, address });
    await newCustomer.save();

    res.status(201).json({ success: true, message: "Customer created successfully!", customerId: newCustomer._id });
  } catch (err) {
    console.error("Customer creation failed:", err);
    if (err.code === 11000) {
      // give helpful error for duplicate key (race condition)
      const dupKey = err.keyValue ? Object.keys(err.keyValue)[0] : "unknown";
      if (dupKey === "name") {
        return res.status(400).json({ success: false, message: "Customer name already exists." });
      } else if (dupKey === "email") {
        return res.status(400).json({ success: false, message: "Email already exists." });
      }
      return res.status(400).json({ success: false, message: "Duplicate key error.", error: err.keyValue });
    }
    res.status(500).json({ success: false, message: "Failed to create customer.", error: err.message });
  }
});

// Customer login
app.post("/api/customers/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required." });
    }
    const customer = await Customer.findOne({ email });
    if (!customer) return res.status(400).json({ success: false, message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid email or password." });

    res.status(200).json({
      success: true,
      message: "Login successful!",
      customerId: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });
  } catch (err) {
    console.error("Customer login failed:", err);
    res.status(500).json({ success: false, message: "Login failed.", error: err.message });
  }
});

// Customer profile
app.get("/api/customers/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select("-password");
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    res.status(200).json({ success: true, customer });
  } catch (err) {
    console.error("Fetch customer profile failed:", err);
    res.status(500).json({ success: false, message: "Failed to fetch profile.", error: err.message });
  }
});

/* ------------------ Change Password (Customer) ------------------ */
/**
 * POST /api/customers/:id/change-password
 * Body: { currentPassword, newPassword }
 * - Validates current password matches stored hash
 * - If matches, updates to new hashed password
 */
app.post("/api/customers/:id/change-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid customer id format." });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both currentPassword and newPassword are required." });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
    }

    const customer = await Customer.findById(id).select("+password");
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });

    const match = await bcrypt.compare(currentPassword, customer.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    customer.password = hashed;
    await customer.save();

    return res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("[POST /api/customers/:id/change-password] Error:", err);
    return res.status(500).json({ success: false, message: "Failed to change password.", error: err.message });
  }
});

/* ------------------ PROFILE UPDATE ROUTES ------------------ */

// Helper: build update object from allowed fields
function buildUpdateFromBody(body, allowedFields = []) {
  const update = {};
  for (const f of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, f) && body[f] !== undefined) {
      update[f] = body[f];
    }
  }
  return update;
}

// Update worker profile
app.put("/api/auth/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, profession, mobileNumber, pincode, area, city, password, blockedDates, workingHours } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (profession !== undefined) update.profession = profession;
    if (area !== undefined) update.area = area;
    if (city !== undefined) update.city = city;
    if (mobileNumber !== undefined) update.mobileNumber = mobileNumber;

    if (pincode !== undefined) {
      if (String(pincode).length !== 6) {
        return res.status(400).json({ success: false, message: "Pincode must be exactly 6 digits." });
      }
      update.pincode = pincode;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(password, salt);
    }

    // If frontend wants to set blockedDates or workingHours, allow it
    if (blockedDates !== undefined) {
      // expect array of YYYY-MM-DD strings
      if (!Array.isArray(blockedDates)) {
        return res.status(400).json({ success: false, message: "blockedDates must be an array of YYYY-MM-DD strings." });
      }
      update.blockedDates = blockedDates;
    }
    if (workingHours !== undefined) {
      // expect object { start, end, slotDuration }
      if (typeof workingHours !== "object") {
        return res.status(400).json({ success: false, message: "workingHours must be an object { start, end, slotDuration }." });
      }
      update.workingHours = workingHours;
    }

    if (mobileNumber) {
      const exists = await Worker.findOne({ mobileNumber, _id: { $ne: id } });
      if (exists) {
        return res.status(400).json({ success: false, message: "Mobile number already in use." });
      }
    }

    const updated = await Worker.findByIdAndUpdate(id, update, { new: true }).select("-password");
    if (!updated) return res.status(404).json({ success: false, message: "Worker not found." });

    res.json({ success: true, message: "Profile updated successfully.", worker: updated });
  } catch (err) {
    console.error("Worker update failed:", err);
    res.status(500).json({ success: false, message: "Profile update failed.", error: err.message });
  }
});

// Update customer profile (with ObjectId validation & request logging)
app.put("/api/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[PUT /api/customers/:id] id:", id);
    console.log("[PUT /api/customers/:id] body:", req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid customer id format." });
    }

    const { name, email, phone, address, password } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;

    if (email !== undefined) {
      const exists = await Customer.findOne({ email, _id: { $ne: id } });
      if (exists) {
        return res.status(400).json({ success: false, message: "Email already in use." });
      }
      update.email = email;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(password, salt);
    }

    // If the name is being changed, ensure new name isn't taken by another customer
    if (name !== undefined) {
      const existingByName = await Customer.findOne({ name, _id: { $ne: id } });
      if (existingByName) {
        return res.status(400).json({ success: false, message: "Customer name already in use." });
      }
      update.name = name;
    }

    const updated = await Customer.findByIdAndUpdate(id, update, { new: true }).select("-password");
    if (!updated) return res.status(404).json({ success: false, message: "Customer not found." });

    res.json({ success: true, message: "Profile updated successfully.", customer: updated });
  } catch (err) {
    console.error("[PUT /api/customers/:id] Error:", err);
    console.error(err.stack);
    const errorDetails = { name: err.name, message: err.message };
    return res.status(500).json({ success: false, message: "Profile update failed.", error: errorDetails });
  }
});

// Compatibility route to support frontend that calls PUT /api/customers/update with { id, ... }
app.put("/api/customers/update", async (req, res) => {
  try {
    const { id } = req.body;
    console.log("[PUT /api/customers/update] id:", id);
    console.log("[PUT /api/customers/update] body:", req.body);

    if (!id) return res.status(400).json({ success: false, message: "Customer id is required." });
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid customer id format." });
    }

    const { name, email, phone, address, password } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;

    if (email !== undefined) {
      const exists = await Customer.findOne({ email, _id: { $ne: id } });
      if (exists) {
        return res.status(400).json({ success: false, message: "Email already in use." });
      }
      update.email = email;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(password, salt);
    }

    // If the name is being changed, ensure new name isn't taken by another customer
    if (name !== undefined) {
      const existingByName = await Customer.findOne({ name, _id: { $ne: id } });
      if (existingByName) {
        return res.status(400).json({ success: false, message: "Customer name already in use." });
      }
      update.name = name;
    }

    const updated = await Customer.findByIdAndUpdate(id, update, { new: true }).select("-password");
    if (!updated) return res.status(404).json({ success: false, message: "Customer not found." });

    res.json({ success: true, message: "Profile updated successfully.", customer: updated });
  } catch (err) {
    console.error("[PUT /api/customers/update] Error:", err);
    console.error(err.stack);
    const errorDetails = { name: err.name, message: err.message };
    return res.status(500).json({ success: false, message: "Profile update failed.", error: errorDetails });
  }
});

/* ------------------ WORKER PHOTO ROUTES ------------------ */

// Upload or update worker photo
app.post("/api/workers/:id/photo", upload.single("photo"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid worker id format." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No photo uploaded." });
    }

    const photoPath = `/uploads/${req.file.filename}`;

    const worker = await Worker.findByIdAndUpdate(
      id,
      { photo: photoPath },
      { new: true }
    ).select("-password");

    if (!worker) {
      return res.status(404).json({ success: false, message: "Worker not found." });
    }

    res.json({
      success: true,
      message: "Photo uploaded successfully.",
      photoUrl: photoPath,
      worker,
    });
  } catch (err) {
    console.error("Photo upload failed:", err);
    res.status(500).json({ success: false, message: "Failed to upload photo.", error: err.message });
  }
});

// Get worker photo
app.get("/api/workers/:id/photo", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid worker id format." });
    }

    const worker = await Worker.findById(id).select("photo");
    if (!worker) {
      return res.status(404).json({ success: false, message: "Worker not found." });
    }

    if (!worker.photo) {
      return res.status(200).json({
        success: true,
        message: "No photo uploaded yet.",
        photoUrl: null,
      });
    }

    res.json({ success: true, photoUrl: worker.photo });
  } catch (err) {
    console.error("Fetch photo failed:", err);
    res.status(500).json({ success: false, message: "Failed to fetch photo.", error: err.message });
  }
});

/* ------------------ BOOKING: worker adds a photo to existing booking ------------------ */
/**
 * Worker uploads a single photo to a booking. Field name: "photo"
 * - validates booking exists
 * - appends `/uploads/<filename>` to booking.photos
 * - returns updated booking
 */
app.post("/api/bookings/:id/photo", upload.single("photo"), async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking id format." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });

    if (!req.file) return res.status(400).json({ success: false, message: "No photo uploaded." });

    const photoPath = `/uploads/${req.file.filename}`;
    booking.photos = booking.photos || [];
    booking.photos.push(photoPath);
    await booking.save();

    res.json({ success: true, message: "Photo added to booking.", booking, photoUrl: photoPath });
  } catch (err) {
    console.error("Upload booking photo failed:", err);
    res.status(500).json({ success: false, message: "Failed to upload booking photo.", error: err.message });
  }
});

/* ------------------ START SERVER ------------------ */
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
