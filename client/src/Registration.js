import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import AuthLayout from "./AuthLayout";
import { Field, Icon, professions } from "./SiteUI";
import { stopDemo } from "./demoApi";
export default function Registration({ worker = false }) {
  const location = useLocation();
  const selectedWorker = !worker ? location.state?.selectedWorker : undefined;
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    pincode: "",
    profession: "",
  });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => stopDemo(), []);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!/^\d{10}$/.test(form.phone))
      return setError("Enter a 10-digit mobile number.");
    if (worker && !/^\d{6}$/.test(form.pincode))
      return setError("Enter a six-digit pincode.");
    setBusy(true);
    try {
      let data = form;
      if (worker) {
        data = new FormData();
        Object.entries({
          name: form.name.trim(),
          password: form.password,
          mobileNumber: form.phone,
          pincode: form.pincode,
          profession: form.profession,
          area: "N/A",
          city: "N/A",
        }).forEach(([k, v]) => data.append(k, v));
        if (photo) data.append("photo", photo);
      }
      const r = await axios.post(
        `https://doable-ojum.onrender.com${worker ? "/api/auth/register" : "/api/customers"}`,
        data,
      );
      if (r.data.success) {
        navigate(`/login?role=${worker ? "worker" : "customer"}`, {
          state: { registered: true, selectedWorker },
        });
      } else
        setError(
          r.data.message ||
            "We couldn’t create your account. Please try again.",
        );
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "We couldn’t create your account. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout worker={worker}>
      <span className="eyebrow">
        {worker ? "PUT YOUR SKILLS TO WORK" : "MAKE YOURSELF AT HOME"}
      </span>
      <h2>
        {worker ? "Join as a professional." : "Your helping hand awaits."}
      </h2>
      <p className="subcopy">
        {worker
          ? "Create your profile and connect with local customers."
          : "Create an account to find help and manage your requests."}
      </p>
      <form onSubmit={submit} className="form-stack">
        <div className="form-grid">
          <Field label="Full name">
            <input
              name="name"
              value={form.name}
              onChange={update}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </Field>
          {!worker && (
            <Field label="Email address">
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={update}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>
          )}
          <Field label="Mobile number">
            <input
              name="phone"
              value={form.phone}
              onChange={update}
              placeholder="10-digit number"
              inputMode="tel"
              autoComplete="tel"
              pattern="[0-9]{10}"
              required
            />
          </Field>
          {worker && (
            <>
              <Field label="Pincode">
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={update}
                  placeholder="6-digit pincode"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  required
                />
              </Field>
              <Field label="Your profession">
                <select
                  name="profession"
                  value={form.profession}
                  onChange={update}
                  required
                >
                  <option value="">Choose a service</option>
                  {professions.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
            </>
          )}
        </div>
        <Field label="Password" hint="Use at least 6 characters.">
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            autoComplete="new-password"
            minLength={6}
            placeholder="Create a password"
            required
          />
        </Field>
        {worker ? (
          <Field label="Profile photo (optional)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
            />
          </Field>
        ) : (
          <Field label="Home address">
            <textarea
              name="address"
              value={form.address}
              onChange={update}
              placeholder="Street, city, pincode and a nearby landmark"
              autoComplete="street-address"
              required
            />
          </Field>
        )}
        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
          <Icon />
        </button>
      </form>
      <p className="auth-footer">
        Already have an account?{" "}
        <Link
          to={`/login?role=${worker ? "worker" : "customer"}`}
          state={{ selectedWorker }}
        >
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
