import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { stopDemo } from "./demoApi";
export const professions = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Mechanic",
  "Cleaner",
  "Gardener",
];
export const serviceIcons = {
  Plumber: "pipe",
  Electrician: "bolt",
  Carpenter: "hammer",
  Painter: "roller",
  Mechanic: "tool",
  Cleaner: "sparkle",
  Gardener: "leaf",
};
export const serviceImages = {
  Plumber: "/images/stock/plumbing.jpg",
  Carpenter: "/images/stock/carpentry.jpg",
  Cleaner: "/images/stock/cleaning.jpg",
  Gardener: "/images/stock/gardening.jpg",
};
export function Icon({ name = "arrow", size = 20 }) {
  const paths = {
    arrow: "M5 12h14m-6-6 6 6-6 6",
    search: "m21 21-5-5M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16",
    pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    check: "m5 12 4 4L19 6",
    tool: "m14 6 4 4m-9 4-6 6 2 2 6-6M14 2a7 7 0 0 0-5 12l1 1a7 7 0 0 0 12-5l-4 4-5-5 4-4Z",
    pipe: "M4 3h6v7h4V7h6v7a2 2 0 0 1-2 2H8a4 4 0 0 1-4-4V3ZM2 3h10m0 4h10",
    bolt: "m13 2-9 12h7l-1 8 10-13h-7l1-7Z",
    hammer: "m14 9-9 12-3-2L12 7M10 5l4-3 7 5-3 4-4-3-2 2-4-3 2-2Z",
    roller: "M3 3h13v6H3ZM16 6h4v7h-9v3m-2 0h4v6H9Z",
    sparkle:
      "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM3 2v4M1 4h4m15 14v4m-2-2h4",
    leaf: "M20 3C9 2 3 7 5 14c2 6 12 6 15-11ZM3 21 15 9",
    calendar: "M5 5h14v16H5ZM8 2v6m8-6v6M5 11h14",
    user: "M20 21v-2a7 7 0 0 0-14 0v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.tool} />
    </svg>
  );
}
export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="Doable home">
      <span className="logo-mark">
        <Icon name="check" size={23} />
      </span>
      doable<span className="logo-dot">.</span>
    </Link>
  );
}
export function Header({ workspace }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        {workspace ? (
          <span className="workspace-label">{workspace} workspace</span>
        ) : (
          <nav className="public-nav" aria-label="Main navigation">
            <a href="/#services">Services</a>
            <a href="/#how-it-works">How it works</a>
            <a href="/#professionals">For professionals</a>
          </nav>
        )}
        <div className="header-actions">
          {workspace ? (
            <Link className="text-link" to="/">
              Back to website <Icon />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-link">
                Log in
              </Link>
              <Link to="/services" className="button button-light">
                Find a professional <Icon />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p>
            A helping hand for your home.
            <br />A simpler way to get things done.
          </p>
        </div>
        <div>
          <h4>For your home</h4>
          <Link to="/services">Find a professional</Link>
          <a href="/#how-it-works">How it works</a>
          <Link to="/register-customer">Create an account</Link>
        </div>
        <div>
          <h4>For professionals</h4>
          <Link to="/register-worker">Join Doable</Link>
          <Link to="/login?role=worker">Professional log in</Link>
          <a href="/#questions">Common questions</a>
        </div>
        <div>
          <h4>Everyday, made doable.</h4>
          <p>
            Search locally. Share the details.
            <br />
            Keep your requests in one place.
          </p>
          <Link to="/services" className="text-link accent">
            Explore services <Icon />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Doable</span>
        <span>Made for homes. Built around people.</span>
      </div>
    </footer>
  );
}
export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Status({ status = "pending" }) {
  return (
    <span className={`status status-${status}`}>
      <i />
      {status}
    </span>
  );
}
export function Avatar({ name, src, large }) {
  return src ? (
    <img
      className={`avatar ${large ? "avatar-large" : ""}`}
      src={src}
      alt={name}
    />
  ) : (
    <span className={`avatar ${large ? "avatar-large" : ""}`}>
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name="search" size={28} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function DashboardShell({
  role,
  name,
  demo,
  activeTab,
  tabs,
  onTab,
  children,
}) {
  const navigate = useNavigate();
  return (
    <>
      <Header workspace={role} />
      <main className="container workspace">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">YOUR {role.toUpperCase()} SPACE</span>
            <h1>
              Hello, {name || "there"}
              <span className="accent">.</span>
            </h1>
            <p>
              {role === "Customer"
                ? "A little help, a lot less on your list."
                : "Good work starts with a well-planned day."}
            </p>
          </div>
          <button
            className="button button-outline"
            onClick={() => {
              stopDemo();
              if (!demo && role === "Customer")
                [
                  "customerId",
                  "customerName",
                  "customerEmail",
                  "customerPhone",
                  "customerAddress",
                ].forEach((k) => localStorage.removeItem(k));
              navigate("/login");
            }}
          >
            Log out <Icon />
          </button>
        </div>
        {demo && (
          <div className="demo-banner">
            <span className="demo-dot" />
            <strong>Local demo</strong>
            <span>
              Sample data stays in this browser.{" "}
              {role === "Customer" && "Try Plumber in 110001."}
            </span>
          </div>
        )}
        <div className="workspace-layout">
          <aside className="workspace-sidebar">
            <p>YOUR WORKSPACE</p>
            <nav aria-label={`${role} workspace`}>
              {tabs.map(([id, label, icon]) => (
                <button
                  key={id}
                  className={activeTab === id ? "active" : ""}
                  aria-current={activeTab === id ? "page" : undefined}
                  onClick={() => onTab(id)}
                >
                  <Icon name={icon} />
                  {label}
                  <span>↗</span>
                </button>
              ))}
            </nav>
            <div className="sidebar-note">
              <Icon name="tool" />
              <h4>
                {role === "Customer"
                  ? "One less thing to do."
                  : "Your skills. Your schedule."}
              </h4>
              <p>
                {role === "Customer"
                  ? "Find a helping hand for the jobs that need one."
                  : "Keep your availability up to date so customers can plan ahead."}
              </p>
            </div>
          </aside>
          <section className="workspace-content">{children}</section>
        </div>
      </main>
      <div className="workspace-footer container">
        <Logo />
        <span>Everyday, made doable.</span>
      </div>
    </>
  );
}
export function BookingSummary({ booking, children }) {
  return (
    <div className="panel">
      <div className="panel-heading booking-summary-heading">
        <div>
          <span className="eyebrow">BOOKING REQUEST</span>
          <h2>{booking.jobDetails || "Booking details"}</h2>
        </div>
        <Status status={booking.status} />
      </div>
      <dl className="detail-grid">
        <div>
          <dt>Tracking code</dt>
          <dd>{booking.trackingId || "—"}</dd>
        </div>
        <div>
          <dt>Requested date</dt>
          <dd>
            {booking.bookingDate
              ? new Date(booking.bookingDate).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </dd>
        </div>
        <div>
          <dt>Customer</dt>
          <dd>{booking.clientName || "—"}</dd>
        </div>
        <div>
          <dt>Contact number</dt>
          <dd>{booking.clientPhone || booking.phone || "Not provided"}</dd>
        </div>
        <div className="full-width">
          <dt>Service address</dt>
          <dd>{booking.clientAddress || booking.address || "Not provided"}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}
