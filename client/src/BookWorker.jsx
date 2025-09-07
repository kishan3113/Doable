import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isSameDay, parseISO } from "date-fns";

/*
Props expected:
- workerId (string)
- customer (object) // something with id, name, contact
- onBooked (fn) optional callback after successful booking
*/

export default function BookWorker({ workerId, customer, onBooked }) {
  const [loading, setLoading] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]); // array of ISO date strings (yyyy-mm-dd)
  const [workingHours, setWorkingHours] = useState(null); // optional metadata (e.g. start/end)
  const [selectedDate, setSelectedDate] = useState(null); // JS Date
  const [timeSlots, setTimeSlots] = useState([]); // available slots for the selected date, e.g. ["09:00","10:30"]
  const [selectedTime, setSelectedTime] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch availability metadata (blocked dates / general info)
  useEffect(() => {
    if (!workerId) return;
    setLoading(true);
    axios
      .get(`/api/workers/${workerId}/availability`)
      .then((res) => {
        // expected response shape (see Backend spec below)
        // { blockedDates: ["2025-09-10","2025-09-12"], workingHours: { start: "09:00", end: "18:00" } }
        const data = res.data || {};
        setBlockedDates((data.blockedDates || []).map(d => d)); // store ISO strings
        setWorkingHours(data.workingHours || null);
      })
      .catch((err) => {
        console.error("Failed to load availability", err);
        setError("Failed to load worker availability.");
      })
      .finally(() => setLoading(false));
  }, [workerId]);

  // When date selected, fetch available time slots for that date
  useEffect(() => {
    setSelectedTime("");
    setTimeSlots([]);
    setError("");
    setSuccessMsg("");
    if (!selectedDate || !workerId) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setLoading(true);
    axios
      .get(`/api/workers/${workerId}/availability/slots`, { params: { date: dateStr } })
      .then((res) => {
        // expected: { availableSlots: ["09:00","09:30","10:30"] }
        setTimeSlots(res.data.availableSlots || []);
        if (!res.data.availableSlots || res.data.availableSlots.length === 0) {
          setError("No free slots for chosen date. Try another date.");
        }
      })
      .catch((err) => {
        console.error("Failed to load slots", err);
        setError("Failed to load available slots.");
      })
      .finally(() => setLoading(false));
  }, [selectedDate, workerId]);

  // Helper: produce array of Date objects to disable in DatePicker
  const disabledDateObjects = useMemo(() => {
    return blockedDates.map(d => {
      // assume blockedDates are 'YYYY-MM-DD'; parse to Date
      return parseISO(d);
    });
  }, [blockedDates]);

  function isDateBlocked(date) {
    // react-datepicker will call with JS Date
    return disabledDateObjects.some(bd => isSameDay(bd, date));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!selectedDate) {
      setError("Choose a date.");
      return;
    }
    if (!selectedTime) {
      setError("Choose a time slot.");
      return;
    }

    setLoading(true);
    const payload = {
      workerId,
      customerId: customer?.id,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: selectedTime, // e.g. "09:30"
      // you can include extras: price, notes, address, photos...
    };

    try {
      const res = await axios.post("/api/bookings", payload);
      setSuccessMsg("Booking created successfully!");
      if (onBooked) onBooked(res.data);
    } catch (err) {
      // Expect server to respond with meaningful errors when slot was taken concurrently
      console.error(err);
      const msg = err?.response?.data?.message || "Failed to create booking.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-md shadow-sm max-w-2xl">
      <h3 className="text-lg font-semibold mb-3">Pick a date & time</h3>

      {loading && <div className="mb-2 text-sm">Loading...</div>}
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
      {successMsg && <div className="mb-2 text-sm text-green-600">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select date</label>
          <DatePicker
            selected={selectedDate}
            onChange={(d) => setSelectedDate(d)}
            inline
            highlightDates={[...disabledDateObjects]}
            filterDate={(date) => !isDateBlocked(date)}
            minDate={new Date()} // prevent past dates
            placeholderText="Select a date"
            // showMonthDropdown, showYearDropdown etc can be added
          />
          <p className="text-xs text-gray-500 mt-1">
            Blocked/unavailable dates are disabled on the calendar.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Available time slots</label>
          {selectedDate ? (
            timeSlots.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`px-3 py-1 rounded-md border ${
                      selectedTime === slot ? "bg-blue-600 text-white" : "bg-white"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600">No slots — choose another date.</div>
            )
          ) : (
            <div className="text-sm text-gray-600">Pick a date to see slots.</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Selected</label>
          <div className="text-sm">
            {selectedDate ? format(selectedDate, "EEE, MMM dd, yyyy") : "—"}{" "}
            {selectedTime ? ` @ ${selectedTime}` : ""}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            disabled={loading}
          >
            Book slot
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded border"
            onClick={() => {
              setSelectedDate(null);
              setSelectedTime("");
              setError("");
            }}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
