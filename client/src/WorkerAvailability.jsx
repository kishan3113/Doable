// WorkerAvailability.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from "date-fns";

/**
 Props:
  - workerId (string) REQUIRED
  - apiBase (string) optional, default ""
  - onSaved (fn) optional callback when settings change
  - headers (object) optional - extra headers for axios (e.g., Authorization)
*/

export default function WorkerAvailability({
  workerId,
  apiBase = "",
  onSaved,
  headers = {},
}) {
  if (!workerId) {
    throw new Error("WorkerAvailability requires workerId prop");
  }

  const [loading, setLoading] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]); // array of 'YYYY-MM-DD'
  const [selectedDate, setSelectedDate] = useState(null); // Date object
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [workingHours, setWorkingHours] = useState({
    start: "09:00",
    end: "18:00",
    slotDuration: 30,
  });
  const [editingHours, setEditingHours] = useState(false);
  const [newBlockedDates, setNewBlockedDates] = useState([]); // local selection before add

  const http = useMemo(() => {
    const instance = axios.create({ baseURL: apiBase });
    if (headers && Object.keys(headers).length) instance.defaults.headers = { ...instance.defaults.headers, ...headers };
    return instance;
  }, [apiBase, headers]);

  // Fetch worker availability on mount (blockedDates + workingHours)
  useEffect(() => {
    let mounted = true;
    async function fetch() {
      setLoading(true);
      setError("");
      try {
        const res = await http.get(`/api/workers/${workerId}/availability`);
        if (!mounted) return;
        if (res.data && res.data.success !== false) {
          setBlockedDates(res.data.blockedDates || []);
          setWorkingHours(res.data.workingHours || workingHours);
        } else {
          setError("Failed to load availability.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load availability.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetch();
    return () => { mounted = false; };
  }, [workerId, http]);

  // Fetch slots for selected date
  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setLoading(true);
    setError("");
    http.get(`/api/workers/${workerId}/availability/slots`, { params: { date: dateStr } })
      .then(res => {
        if (res.data && res.data.success !== false) {
          setSlots(res.data.availableSlots || []);
        } else {
          setSlots([]);
          setError("Failed to load slots.");
        }
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load slots.");
        setSlots([]);
      })
      .finally(() => setLoading(false));
  }, [selectedDate, workerId, http]);

  function toggleLocalDate(date) {
    // date: JS Date
    const dStr = format(date, "yyyy-MM-dd");
    setNewBlockedDates(prev => prev.includes(dStr) ? prev.filter(x => x !== dStr) : [...prev, dStr]);
  }

  async function addBlockedDates() {
    if (newBlockedDates.length === 0) {
      setError("Select dates to block.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      // action: add
      const res = await http.post(`/api/workers/${workerId}/blocked-dates`, {
        action: "add",
        dates: newBlockedDates,
      });
      if (res.data && res.data.success) {
        setBlockedDates(res.data.blockedDates || []);
        setNewBlockedDates([]);
        setSuccessMsg("Blocked dates added.");
        if (onSaved) onSaved();
      } else {
        setError(res.data?.message || "Failed to add blocked dates.");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to add blocked dates.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  }

  async function removeBlockedDate(dateStr) {
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await http.post(`/api/workers/${workerId}/blocked-dates`, { action: "remove", dates: [dateStr] });
      if (res.data && res.data.success) {
        setBlockedDates(res.data.blockedDates || []);
        setSuccessMsg("Blocked date removed.");
        if (onSaved) onSaved();
      } else {
        setError(res.data?.message || "Failed to remove blocked date.");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to remove blocked date.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(""), 2500);
    }
  }

  async function replaceBlockedDates(datesArr) {
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await http.post(`/api/workers/${workerId}/blocked-dates`, { action: "replace", dates: datesArr });
      if (res.data && res.data.success) {
        setBlockedDates(res.data.blockedDates || []);
        setSuccessMsg("Blocked dates replaced.");
        if (onSaved) onSaved();
      } else {
        setError(res.data?.message || "Failed to replace blocked dates.");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to replace blocked dates.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(""), 2500);
    }
  }

  async function saveWorkingHours() {
    // Validate fields
    if (!/^\d{2}:\d{2}$/.test(workingHours.start) || !/^\d{2}:\d{2}$/.test(workingHours.end)) {
      setError("Start and end must be HH:MM.");
      return;
    }
    if (!Number.isInteger(Number(workingHours.slotDuration)) || Number(workingHours.slotDuration) <= 0) {
      setError("slotDuration must be a positive integer.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // reuse profile update route to set workingHours
      const res = await http.put(`/api/auth/profile/${workerId}`, { workingHours });
      if (res.data && res.data.success) {
        setWorkingHours(res.data.worker.workingHours || workingHours);
        setEditingHours(false);
        setSuccessMsg("Working hours updated.");
        if (onSaved) onSaved();
      } else {
        setError(res.data?.message || "Failed to update working hours.");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to update working hours.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(""), 2500);
    }
  }

  // disabledDays for DatePicker: convert blockedDates strings to Date objects
  const disabledDatesForPicker = useMemo(() => {
    return blockedDates.map(d => {
      try {
        return parseISO(d);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
  }, [blockedDates]);

  // helper for display
  const prettyDate = (dStr) => {
    try {
      const d = parseISO(dStr);
      return d.toDateString();
    } catch (e) { return dStr; }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Availability & Blocked Dates</h2>

      {loading && <div className="text-sm text-gray-600 mb-2">Working…</div>}
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      {successMsg && <div className="text-sm text-green-600 mb-2">{successMsg}</div>}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: Calendar & block/unblock */}
        <div>
          <label className="block text-sm font-medium mb-2">Calendar — click to toggle local selection</label>
          <div className="border rounded p-2">
            <DatePicker
              inline
              selected={selectedDate}
              onChange={(d) => {
                setSelectedDate(d);
              }}
              highlightDates={disabledDatesForPicker}
              // Disable blocked dates visually (they'll remain clickable in this UI to allow "unblock" flow)
              minDate={new Date()}
              dayClassName={(date) => {
                const ds = format(date, "yyyy-MM-dd");
                if (blockedDates.includes(ds)) return "text-red-600";
                if (newBlockedDates.includes(ds)) return "bg-gray-200";
                return "";
              }}
              // onDayClick not exposed; use onChange with custom toggle button below
            />
          </div>

          <div className="mt-3">
            <div className="flex gap-2 items-center">
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white"
                onClick={() => {
                  if (!selectedDate) {
                    setError("Pick a date on the calendar first.");
                    return;
                  }
                  toggleLocalDate(selectedDate);
                  setError("");
                }}
              >
                Toggle selected date in local list
              </button>

              <button
                className="px-3 py-1 rounded border"
                onClick={() => {
                  setNewBlockedDates([]);
                }}
              >
                Clear local selection
              </button>

              <button
                className="px-3 py-1 rounded bg-green-600 text-white"
                onClick={addBlockedDates}
                disabled={newBlockedDates.length === 0 || loading}
              >
                Add local selection (push to server)
              </button>
            </div>

            <div className="mt-2 text-sm text-gray-700">
              <div>Local dates ready to block ({newBlockedDates.length}):</div>
              <ul className="list-disc pl-5">
                {newBlockedDates.map(d => <li key={d}>{prettyDate(d)}</li>)}
              </ul>
            </div>

            <div className="mt-3">
              <div className="text-sm font-medium">Currently blocked dates</div>
              {blockedDates.length === 0 ? (
                <div className="text-sm text-gray-600">No blocked dates set.</div>
              ) : (
                <ul className="mt-2 space-y-1">
                  {blockedDates.map(d => (
                    <li key={d} className="flex justify-between items-center">
                      <span>{prettyDate(d)}</span>
                      <div>
                        <button
                          className="px-2 py-1 text-sm rounded border text-red-600"
                          onClick={() => removeBlockedDate(d)}
                        >
                          Unblock
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-3">
              <button
                className="px-3 py-1 rounded border"
                onClick={() => replaceBlockedDates([])}
              >
                Clear all blocked dates
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: working hours & preview slots */}
        <div>
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">Working hours</div>
                {!editingHours ? (
                  <div className="text-lg font-medium">
                    {workingHours.start} — {workingHours.end} • {workingHours.slotDuration} min slots
                  </div>
                ) : null}
              </div>
              <div>
                <button
                  className="px-3 py-1 rounded border"
                  onClick={() => setEditingHours(!editingHours)}
                >
                  {editingHours ? "Cancel" : "Edit"}
                </button>
              </div>
            </div>

            {editingHours && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <label className="text-sm w-24">Start</label>
                  <input
                    value={workingHours.start}
                    onChange={(e) => setWorkingHours(h => ({ ...h, start: e.target.value }))}
                    placeholder="09:00"
                    className="border rounded px-2 py-1"
                  />
                  <label className="text-sm w-20">End</label>
                  <input
                    value={workingHours.end}
                    onChange={(e) => setWorkingHours(h => ({ ...h, end: e.target.value }))}
                    placeholder="18:00"
                    className="border rounded px-2 py-1"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <label className="text-sm w-24">Slot (min)</label>
                  <input
                    type="number"
                    value={workingHours.slotDuration}
                    onChange={(e) => setWorkingHours(h => ({ ...h, slotDuration: Number(e.target.value) }))}
                    className="border rounded px-2 py-1 w-24"
                  />
                  <div>
                    <button
                      className="px-3 py-1 rounded bg-green-600 text-white"
                      onClick={saveWorkingHours}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Preview slots for selected date</div>
            <div className="border rounded p-3 min-h-[120px]">
              {selectedDate ? (
                <>
                  <div className="mb-2 text-sm text-gray-700">Date: {selectedDate.toDateString()}</div>
                  {slots.length === 0 ? (
                    <div className="text-sm text-gray-600">No available slots (blocked or fully booked).</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slots.map(s => (
                        <div key={s} className="px-2 py-1 border rounded">{s}</div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-600">Pick a date in the calendar to preview slots.</div>
              )}
            </div>

            <div className="text-xs text-gray-500 mt-2">
              Slots are computed using working hours and existing bookings.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
