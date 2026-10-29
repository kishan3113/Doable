import axios from "axios";

// Temporary development-only accounts. Demo requests never reach the hosted API.
export const DEMO_ENABLED = process.env.NODE_ENV === "development";
const SESSION_KEY = "doable-demo-session";
const DATA_KEY = "doable-demo-data-v1";
const WORKER_ID = "000000000000000000000001";
const CUSTOMER_ID = "000000000000000000000002";

function readData() {
  const saved = localStorage.getItem(DATA_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (error) { /* Reset invalid demo data. */ }
  }
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const tomorrow = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return {
    worker: {
      _id: WORKER_ID, name: "Demo Worker", profession: "Plumber",
      mobileNumber: "9999990001", pincode: "110001", area: "Demo Area",
      city: "New Delhi", photo: null, blockedDates: [],
      workingHours: { start: "09:00", end: "18:00", slotDuration: 30 },
    },
    customer: {
      _id: CUSTOMER_ID, name: "Demo Customer", email: "customer@example.test",
      phone: "9999990002", address: "10 Demo Street, New Delhi, 110001",
    },
    bookings: [{
      _id: "000000000000000000000003", workerId: WORKER_ID,
      clientName: "Demo Customer", clientPhone: "9999990002",
      clientAddress: "10 Demo Street, New Delhi, 110001",
      jobDetails: "Fix the leaking kitchen tap (sample booking)",
      bookingDate: `${tomorrow}T00:00:00.000Z`, status: "pending",
      trackingId: "DEMO00001", photos: [], location: null, deletedByWorker: false,
    }],
  };
}

function saveData(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function stopDemo() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function startDemo(role) {
  const data = readData();
  saveData(data);
  sessionStorage.setItem(SESSION_KEY, role);
  if (role === "worker") return { ...data.worker, workerId: WORKER_ID, demo: true };
  return { ...data.customer, customerId: CUSTOMER_ID, demo: true };
}

async function demoAdapter(config) {
  const data = readData();
  const url = new URL(config.url, config.baseURL || "https://doable-ojum.onrender.com");
  const path = url.pathname;
  const method = config.method.toLowerCase();
  const body = config.data instanceof FormData
    ? Object.fromEntries(config.data.entries())
    : typeof config.data === "string" ? JSON.parse(config.data || "{}") : config.data || {};
  let result;
  let status = 200;
  const fail = (message, code = 400) => { result = { success: false, message }; status = code; };
  const populated = (booking) => ({ ...booking, workerId: data.worker, address: booking.clientAddress });

  if (method === "get" && path === "/api/workers/search") {
    const params = config.params || {};
    const matches = (!params.pincode || params.pincode === data.worker.pincode)
      && (!params.profession || data.worker.profession.toLowerCase().includes(params.profession.toLowerCase()));
    result = { success: true, workers: matches ? [data.worker] : [] };
  } else if (method === "get" && path === `/api/workers/${WORKER_ID}/photo`) {
    result = { success: true, photoUrl: data.worker.photo };
  } else if (method === "get" && path === `/api/workers/${WORKER_ID}/availability`) {
    result = { success: true, blockedDates: data.worker.blockedDates, workingHours: data.worker.workingHours };
  } else if (method === "post" && path === `/api/workers/${WORKER_ID}/blocked-dates`) {
    const dates = body.dates || [];
    data.worker.blockedDates = body.action === "add"
      ? [...new Set([...data.worker.blockedDates, ...dates])]
      : body.action === "remove" ? data.worker.blockedDates.filter((d) => !dates.includes(d)) : dates;
    result = { success: true, blockedDates: data.worker.blockedDates };
  } else if (method === "put" && path === `/api/auth/profile/${WORKER_ID}`) {
    ["name", "profession", "mobileNumber", "pincode", "area", "city"].forEach((key) => {
      if (body[key] !== undefined) data.worker[key] = body[key];
    });
    result = { success: true, worker: data.worker };
  } else if (method === "put" && path === `/api/customers/${CUSTOMER_ID}`) {
    ["name", "email", "phone", "address"].forEach((key) => {
      if (body[key] !== undefined) data.customer[key] = body[key];
    });
    result = { success: true, customer: data.customer };
  } else if (method === "post" && path === "/api/bookings") {
    if (data.worker.blockedDates.includes(body.bookingDate)) {
      fail("Demo worker is unavailable on that date.");
    } else {
      const id = Date.now().toString(16).padStart(24, "0");
      const photos = config.data instanceof FormData ? await Promise.all(
        config.data.getAll("photos").map((file) => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }))
      ) : [];
      const booking = {
        _id: id, workerId: WORKER_ID, clientName: data.customer.name,
        clientPhone: body.clientPhone || "", clientAddress: body.address || "",
        jobDetails: body.jobDetails, bookingDate: `${body.bookingDate}T00:00:00.000Z`,
        status: "pending", trackingId: `DEMO${Date.now().toString(36).toUpperCase()}`,
        photos, deletedByWorker: false,
        location: body.location ? JSON.parse(body.location) : null,
      };
      if (booking.location) booking.location.googleMapsUrl = `https://www.google.com/maps?q=${booking.location.latitude},${booking.location.longitude}`;
      data.bookings.push(booking);
      result = { success: true, booking, trackingId: booking.trackingId };
      status = 201;
    }
  } else if (method === "get" && path === `/api/bookings/worker/${WORKER_ID}`) {
    result = { success: true, bookings: data.bookings.filter((b) => !b.deletedByWorker) };
  } else if (method === "get" && (path === `/api/bookings/customer/${CUSTOMER_ID}` || path === "/api/bookings/customer")) {
    result = { success: true, bookings: data.bookings.map(populated) };
  } else if (method === "get" && path.startsWith("/api/bookings/track/")) {
    const booking = data.bookings.find((b) => b.trackingId === path.split("/").pop());
    if (booking) result = { success: true, booking: populated(booking) };
    else fail("Demo booking not found.", 404);
  } else if (method === "put" && /^\/api\/bookings\/[^/]+\/status$/.test(path)) {
    const booking = data.bookings.find((b) => b._id === path.split("/")[3]);
    if (booking) { booking.status = body.status; result = { success: true, booking }; }
    else fail("Demo booking not found.", 404);
  } else if (method === "delete" && /^\/api\/bookings\/[^/]+$/.test(path)) {
    const booking = data.bookings.find((b) => b._id === path.split("/")[3]);
    if (booking && ["completed", "cancelled"].includes(booking.status)) {
      booking.deletedByWorker = true;
      result = { success: true };
    } else fail("Only completed or cancelled demo bookings can be hidden.");
  } else {
    fail("This action is unavailable in the temporary demo. Use a real account for it.");
  }
  saveData(data);
  const response = { data: result, status, statusText: status < 400 ? "OK" : "Demo error", headers: {}, config };
  if (status >= 400) throw new axios.AxiosError(result.message, "ERR_BAD_REQUEST", config, null, response);
  return response;
}

if (DEMO_ENABLED) {
  const hostedAdapter = axios.getAdapter(axios.defaults.adapter);
  axios.defaults.adapter = (config) => sessionStorage.getItem(SESSION_KEY)
    ? demoAdapter(config) : hostedAdapter(config);
}
