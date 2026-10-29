import React, { useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { Header, Footer, Avatar, Empty, Icon, professions } from "./SiteUI";
import { ServiceSearch } from "./Landing";
const workerPhoto = (worker) =>
  worker.photo
    ? /^(https?:|data:|blob:)/.test(worker.photo)
      ? worker.photo
      : `https://doable-ojum.onrender.com${worker.photo.startsWith("/") ? "" : "/"}${worker.photo}`
    : null;
export default function PublicServices() {
  const [params, setParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  React.useEffect(() => {
    let active = true;
    const profession = params.get("profession") || "";
    const pincode = params.get("pincode") || "";
    setSelected(null);
    setResults([]);
    setError("");
    if (!/^\d{6}$/.test(pincode)) {
      setSearched(false);
      setLoading(false);
      return;
    }
    setSearched(true);
    setLoading(true);
    axios
      .get("https://doable-ojum.onrender.com/api/workers/search", {
        params: { profession, pincode },
      })
      .then((response) => {
        if (!active) return;
        if (response.data.success === false) {
          setError(
            response.data.message ||
              "We couldn’t load professionals. Please try again in a moment.",
          );
          return;
        }
        setResults(response.data.workers || []);
      })
      .catch(() => {
        if (active)
          setError(
            "We couldn’t load professionals. Please try again in a moment.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params, searchAttempt]);
  return (
    <>
      <Header />
      <main className="container directory">
        <span className="eyebrow">FIND YOUR HELPING HAND</span>
        <h1>Local skills. Real possibilities.</h1>
        <p>
          Choose a service and your area. We’ll help you take the next step.
        </p>
        <ServiceSearch
          key={params.toString()}
          initialProfession={params.get("profession") || ""}
          initialPincode={params.get("pincode") || ""}
          onSearch={(profession, pincode) => {
            setParams({ profession, pincode });
            setSearchAttempt((attempt) => attempt + 1);
          }}
        />
        <div className="service-chips">
          {professions.map((p) => (
            <Link
              key={p}
              aria-current={params.get("profession") === p ? "true" : undefined}
              to={`/services?profession=${p}${params.get("pincode") ? "&pincode=" + params.get("pincode") : ""}`}
            >
              {p}
            </Link>
          ))}
        </div>
        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <Empty title="Looking for local professionals…">
            This may take a moment.
          </Empty>
        ) : error ? null : selected ? (
          <div className="panel public-profile">
            <button className="text-link" onClick={() => setSelected(null)}>
              ← Back to results
            </button>
            <div className="person-header">
              <Avatar large name={selected.name} src={workerPhoto(selected)} />
              <div>
                <span className="eyebrow">{selected.profession}</span>
                <h2>{selected.name}</h2>
                <p>Serving pincode {selected.pincode}</p>
              </div>
            </div>
            <p>
              Discuss your job, choose a date and share the details with{" "}
              {selected.name}.
            </p>
            <dl className="detail-grid">
              <div>
                <dt>Profession</dt>
                <dd>{selected.profession}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>
                  <a href={`tel:${selected.mobileNumber}`}>
                    {selected.mobileNumber}
                  </a>
                </dd>
              </div>
            </dl>
            <Link
              className="button"
              to="/login?role=customer"
              state={{ selectedWorker: selected }}
            >
              Log in to request a booking <Icon />
            </Link>
          </div>
        ) : results.length ? (
          <>
            <div className="section-heading">
              <h2>Professionals in {params.get("pincode")}</h2>
              <span>
                {results.length} result{results.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="results-grid">
              {results.map((w) => (
                <article className="panel worker-card" key={w._id}>
                  <Avatar name={w.name} src={workerPhoto(w)} />
                  <span className="eyebrow">{w.profession}</span>
                  <h3>{w.name}</h3>
                  <p>
                    <Icon name="pin" /> {w.pincode}
                  </p>
                  <button
                    className="button button-outline"
                    onClick={() => setSelected(w)}
                  >
                    View professional <Icon />
                  </button>
                </article>
              ))}
            </div>
          </>
        ) : (
          <Empty
            title={
              searched ? "No matches in this area yet" : "A good place to start"
            }
          >
            {searched
              ? "Try another service or a nearby pincode."
              : "Enter your six-digit pincode above to find professionals near you."}
          </Empty>
        )}
      </main>
      <Footer />
    </>
  );
}
