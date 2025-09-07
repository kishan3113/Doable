// migrate_bookings.js
require("dotenv").config();
const mongoose = require("mongoose");

const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("Please set MONGO_URI in .env");
  process.exit(1);
}

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => run())
  .catch(err => { console.error("Connect failed:", err); process.exit(1); });

const BookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.model("Booking", BookingSchema, "bookings");

async function run() {
  try {
    console.log("Starting migration: normalize bookingDate and time fields...");

    const cursor = Booking.find().cursor();
    let count = 0;
    while (true) {
      const doc = await cursor.next();
      if (!doc) break;
      let changed = false;

      // ensure bookingDate is a Date object
      if (doc.bookingDate && !(doc.bookingDate instanceof Date)) {
        const parsed = new Date(doc.bookingDate);
        if (!isNaN(parsed.getTime())) {
          doc.bookingDate = parsed;
          changed = true;
        }
      }

      // ensure a time field exists (set to null if missing)
      if (typeof doc.time === "undefined") {
        doc.time = null;
        changed = true;
      }

      // optional: store dateStr for quick queries (YYYY-MM-DD)
      if (!doc.dateStr && doc.bookingDate instanceof Date) {
        const d = doc.bookingDate;
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(d.getUTCDate()).padStart(2, "0");
        doc.dateStr = `${yyyy}-${mm}-${dd}`;
        changed = true;
      }

      if (changed) {
        await doc.save();
        count++;
      }
    }

    console.log(`Migration completed. Documents updated: ${count}`);
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
