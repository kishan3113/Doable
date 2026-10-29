import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import App from "./App";

jest.mock("axios", () => {
  const client = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  client.create = () => client;
  return client;
});

const worker = {
  _id: "worker-1",
  name: "Test Professional",
  profession: "Plumber",
  pincode: "110001",
  mobileNumber: "9999990001",
  photo: "/uploads/profile.jpg",
};
const account = {
  customerId: "customer-1",
  name: "Test Customer",
  email: "test@example.test",
  phone: "9999990002",
  address: "10 Test Street",
};
const booking = {
  _id: "booking-1",
  trackingId: "TRACK123",
  workerId: worker,
  jobDetails: "Repair a tap",
  bookingDate: "2026-11-15",
  status: "confirmed",
  clientAddress: "10 Actual API Street",
  clientName: account.name,
  photos: ["data:image/png;base64,aGVsbG8="],
};

function open(entry = "/") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
  axios.get.mockResolvedValue({
    data: {
      success: true,
      workers: [worker],
      bookings: [booking],
      booking,
      blockedDates: [],
    },
  });
});

test("landing service and pincode search navigates to matching public results", async () => {
  open();
  expect(
    screen.getByRole("heading", { name: /good help. close to home/i }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox", { name: "Service" }), {
    target: { value: "Plumber" },
  });
  fireEvent.change(screen.getByLabelText("Six-digit pincode"), {
    target: { value: "110001" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Find professionals" }));
  expect(
    await screen.findByRole("heading", { name: "Test Professional" }),
  ).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith(
    expect.stringContaining("/api/workers/search"),
    { params: { profession: "Plumber", pincode: "110001" } },
  );
});

test("changing a public service chip preserves pincode, refreshes results and updates the form", async () => {
  open("/services?profession=Plumber&pincode=110001");
  await screen.findByRole("heading", { name: "Test Professional" });
  fireEvent.click(screen.getByRole("link", { name: "Cleaner" }));
  await waitFor(() =>
    expect(axios.get).toHaveBeenLastCalledWith(
      expect.stringContaining("/api/workers/search"),
      { params: { profession: "Cleaner", pincode: "110001" } },
    ),
  );
  expect(screen.getByRole("combobox", { name: "Service" })).toHaveValue(
    "Cleaner",
  );
  expect(screen.getByLabelText("Six-digit pincode")).toHaveValue("110001");
});

test("public profile selection survives normal customer login into the booking form", async () => {
  axios.post.mockResolvedValue({ data: { success: true, ...account } });
  open("/services?profession=Plumber&pincode=110001");
  await screen.findByRole("heading", { name: "Test Professional" });
  fireEvent.click(screen.getByRole("button", { name: /view professional/i }));
  fireEvent.click(
    screen.getByRole("link", { name: /log in to request a booking/i }),
  );
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: account.email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "example-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^Log in/ }));
  expect(
    await screen.findByRole("heading", { name: "Request a booking" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: worker.name }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Service address")).toHaveValue(account.address);
});

test("customer history and details show status, API clientAddress and existing photo attachments", async () => {
  open({ pathname: "/customer-dashboard", state: account });
  fireEvent.click(screen.getByRole("button", { name: /my bookings/i }));
  expect(await screen.findByText("confirmed")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: /Test Professional.*Repair a tap/i }),
  );
  expect(screen.getByText("10 Actual API Street")).toBeInTheDocument();
  expect(screen.getByText("confirmed")).toBeInTheDocument();
  expect(screen.getByAltText("Job attachment 1")).toHaveAttribute(
    "src",
    booking.photos[0],
  );
});

test("demo edit profile explains password limitation and has no password submission", () => {
  open({ pathname: "/customer-dashboard", state: { ...account, demo: true } });
  fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));
  expect(
    screen.getByText(/password changes are unavailable in the local demo/i),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /^change password$/i }),
  ).not.toBeInTheDocument();
});

test("unauthenticated worker workspace routes to its login form", async () => {
  open("/worker-dashboard");
  expect(await screen.findByLabelText("Worker name")).toBeInTheDocument();
});

test("booking submission shows inline tracking feedback and returns to history without a native alert", async () => {
  const alert = jest.spyOn(window, "alert").mockImplementation(() => {});
  axios.post.mockResolvedValue({
    data: { success: true, trackingId: booking.trackingId, booking },
  });
  open({
    pathname: "/customer-dashboard",
    state: { ...account, selectedWorker: worker, activeTab: "bookWorker" },
  });
  fireEvent.change(screen.getByLabelText("What needs doing?"), {
    target: { value: booking.jobDetails },
  });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /confirm request/i }),
    ).toBeEnabled(),
  );
  const availableDate = screen
    .getAllByRole("gridcell")
    .find((option) => option.getAttribute("aria-disabled") === "false");
  fireEvent.click(availableDate);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /confirm request/i }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: /confirm request/i }));
  expect(await screen.findByRole("status")).toHaveTextContent("TRACK123");
  expect(
    screen.getByRole("heading", { name: "My bookings" }),
  ).toBeInTheDocument();
  expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining("/api/bookings"),
    expect.any(FormData),
    expect.any(Object),
  );
  expect(alert).not.toHaveBeenCalled();
  alert.mockRestore();
});

test("worker status changes reach the existing API and completed requests can be hidden through in-page confirmation", async () => {
  axios.put.mockResolvedValue({
    data: { success: true, booking: { ...booking, status: "completed" } },
  });
  axios.delete.mockResolvedValue({ status: 200, data: { success: true } });
  open({
    pathname: "/worker-dashboard",
    state: { ...worker, workerId: worker._id, demo: true },
  });
  fireEvent.click(screen.getByRole("button", { name: /my bookings/i }));
  fireEvent.click(
    await screen.findByRole("button", { name: /Test Customer.*Repair a tap/i }),
  );
  fireEvent.change(screen.getByLabelText("Request status"), {
    target: { value: "completed" },
  });
  await waitFor(() =>
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining("/api/bookings/booking-1/status"),
      { status: "completed" },
    ),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: /hide from my bookings/i }),
  );
  expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() =>
    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining("/api/bookings/booking-1"),
      { headers: { "x-worker-id": worker._id } },
    ),
  );
});

test("returning to the bare services page clears previous public results", async () => {
  open("/services?profession=Plumber&pincode=110001");
  await screen.findByRole("heading", { name: worker.name });
  fireEvent.click(
    screen.getAllByRole("link", { name: "Find a professional" })[0],
  );
  expect(
    await screen.findByRole("heading", { name: "A good place to start" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: worker.name }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText("Six-digit pincode")).toHaveValue("");
});

test("selected professional survives customer registration and subsequent login", async () => {
  axios.post.mockImplementation((url) =>
    Promise.resolve({
      data: url.endsWith("/api/customers")
        ? { success: true }
        : { success: true, ...account },
    }),
  );
  open("/services?profession=Plumber&pincode=110001");
  await screen.findByRole("heading", { name: worker.name });
  fireEvent.click(screen.getByRole("button", { name: /view professional/i }));
  fireEvent.click(
    screen.getByRole("link", { name: /log in to request a booking/i }),
  );
  fireEvent.click(screen.getByRole("link", { name: "Create an account" }));
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: account.name },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: account.email },
  });
  fireEvent.change(screen.getByLabelText("Mobile number"), {
    target: { value: account.phone },
  });
  fireEvent.change(screen.getByLabelText(/Password/), {
    target: { value: "example-password" },
  });
  fireEvent.change(screen.getByLabelText("Home address"), {
    target: { value: account.address },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByText(/your account is ready/i)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: account.email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "example-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^Log in/ }));
  expect(
    await screen.findByRole("heading", { name: "Request a booking" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: worker.name }),
  ).toBeInTheDocument();
});

test("public search failure shows feedback without claiming there are no matches", async () => {
  axios.get.mockRejectedValueOnce(new Error("Network unavailable"));
  open("/services?profession=Plumber&pincode=110001");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "couldn’t load professionals",
  );
  expect(
    screen.queryByRole("heading", { name: "No matches in this area yet" }),
  ).not.toBeInTheDocument();
});
