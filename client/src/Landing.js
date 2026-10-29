import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Header,
  Footer,
  Icon,
  professions,
  serviceImages,
  serviceIcons,
} from "./SiteUI";
export function ServiceSearch({
  initialProfession = "",
  initialPincode = "",
  onSearch,
}) {
  const [profession, setProfession] = useState(initialProfession);
  const [pincode, setPincode] = useState(initialPincode);
  const navigate = useNavigate();
  return (
    <form
      className="service-search"
      onSubmit={(e) => {
        e.preventDefault();
        if (onSearch) onSearch(profession, pincode);
        else
          navigate(
            `/services?profession=${encodeURIComponent(profession)}&pincode=${pincode}`,
          );
      }}
    >
      <label>
        <span className="sr-only">Service</span>
        <Icon name="tool" />
        <select
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
        >
          <option value="">What can we help you with?</option>
          {professions.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <label className="pincode-field">
        <Icon name="pin" />
        <span className="sr-only">Six-digit pincode</span>
        <input
          placeholder="Your pincode"
          value={pincode}
          onChange={(e) =>
            setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          inputMode="numeric"
          pattern="[0-9]{6}"
          required
          title="Enter a six-digit pincode"
        />
      </label>
      <button className="search-submit" aria-label="Find professionals">
        <Icon name="search" size={24} />
      </button>
    </form>
  );
}
const serviceCopy = {
  Plumber: "Leaks, taps & everyday fixes",
  Electrician: "Wiring, fittings & repairs",
  Carpenter: "Furniture, doors & woodwork",
  Painter: "A fresh start for your walls",
  Mechanic: "Maintenance & mechanical fixes",
  Cleaner: "A little care for every corner",
  Gardener: "Greener spaces, happy plants",
};
export default function Landing() {
  return (
    <>
      <Header />
      <main>
        <section className="hero container">
          <span className="pill">
            <i /> A little help goes a long way
          </span>
          <h1>
            Good help. Close to home.
            <br />
            <span className="accent">Consider it doable.</span>
          </h1>
          <p>
            From the little fixes to the jobs you’ve been putting off,
            <br className="desktop-break" /> find local professionals who can
            lend a hand.
          </p>
          <ServiceSearch />
          <div className="popular">
            Popular: <Link to="/services?profession=Plumber">Plumbing</Link>
            <Link to="/services?profession=Cleaner">Home cleaning</Link>
            <Link to="/services?profession=Electrician">
              Electrical repairs
            </Link>
          </div>
        </section>
        <section className="container category-section" id="services">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A HAND FOR EVERY HOME</span>
              <h2>What’s on your to-do list?</h2>
            </div>
            <Link to="/services" className="text-link">
              View all <Icon />
            </Link>
          </div>
          <div className="category-grid">
            {["Cleaner", "Carpenter", "Plumber", "Gardener"].map((p, i) => (
              <Link
                key={p}
                className="category-card"
                to={`/services?profession=${p}`}
              >
                <div className="category-photo">
                  <img
                    src={serviceImages[p]}
                    alt={
                      p === "Cleaner"
                        ? "Home cleaning supplies and work"
                        : `${p.toLowerCase()} tools and craft`
                    }
                    loading="lazy"
                  />
                  <span className="category-number">0{i + 1}</span>
                </div>
                <div className="category-label">
                  <div>
                    <h3>
                      {p === "Cleaner"
                        ? "Home cleaning"
                        : p === "Carpenter"
                          ? "Carpentry"
                          : p === "Plumber"
                            ? "Plumbing"
                            : "Gardening"}
                    </h3>
                    <p>{serviceCopy[p]}</p>
                  </div>
                  <span className="circle-arrow">
                    <Icon />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="professional-split" id="professionals">
          <div className="professional-photo">
            <img
              src={serviceImages.Carpenter}
              alt="Professional at work in a workshop"
              loading="lazy"
            />
            <div className="photo-caption">
              <Icon name="tool" />
              <span>
                Real skills.
                <br />
                <strong>Everyday possibilities.</strong>
              </span>
            </div>
          </div>
          <div className="professional-copy">
            <span className="pill pill-dark">
              FOR THE PEOPLE WHO MAKE IT HAPPEN
            </span>
            <h2>
              You bring the skills.
              <br />
              We help you
              <br />
              find the work.
            </h2>
            <p>
              Make a place for your craft. Connect with people in your area,
              manage requests and set your availability—all on Doable.
            </p>
            <Link to="/register-worker" className="button button-dark">
              Join as a professional <Icon />
            </Link>
          </div>
        </section>
        <section className="container section-padding">
          <div className="center-heading">
            <span className="eyebrow">SMALL FIXES. FRESH STARTS.</span>
            <h2>
              Whatever your home needs,
              <br />
              there’s a helping hand.
            </h2>
            <p>Seven everyday services. One place to start.</p>
          </div>
          <div className="service-grid">
            {professions.map((p, i) => (
              <Link
                key={p}
                to={`/services?profession=${p}`}
                className={`service-tile ${i === 0 ? "featured" : ""}`}
              >
                <span className="tile-icon">
                  <Icon name={serviceIcons[p]} />
                </span>
                <h3>{p}</h3>
                <p>{serviceCopy[p]}</p>
                <Icon />
              </Link>
            ))}
          </div>
        </section>
        <section className="how-section" id="how-it-works">
          <div className="container section-padding">
            <div className="center-heading">
              <span className="eyebrow">FROM TO-DO TO DONE</span>
              <h2>
                A simpler way to
                <br />
                get things moving.
              </h2>
            </div>
            <div className="steps-grid">
              {[
                [
                  "Find your helping hand",
                  "Choose a service and enter your pincode to see professionals in your area.",
                ],
                [
                  "Make a plan together",
                  "Describe the job, add photos and request a date that works for you.",
                ],
                [
                  "Keep everything in view",
                  "Follow your request’s status and find the details whenever you need them.",
                ],
              ].map(([title, text], i) => (
                <div className="step" key={title}>
                  <span>0{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
            <div className="wide-feature">
              <img
                src={serviceImages.Gardener}
                alt="Carefully tending plants in a green garden"
                loading="lazy"
              />
              <div>
                <span className="eyebrow">MORE ROOM FOR EVERYDAY LIFE</span>
                <h2>
                  Less on your list.
                  <br />
                  More in your day.
                </h2>
                <Link className="button" to="/services">
                  Find a helping hand <Icon />
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="container faq-section" id="questions">
          <div>
            <span className="eyebrow">GOOD TO KNOW</span>
            <h2>
              A few things
              <br />
              you might be asking.
            </h2>
            <p>A clear first step makes all the difference.</p>
          </div>
          <div className="faq-list">
            {[
              [
                "How do I find someone in my area?",
                "Choose a service and enter your six-digit pincode. Doable shows matching professionals, with their service and contact information.",
              ],
              [
                "What happens after I send a request?",
                "Your request starts as pending. The professional can confirm it and update its status. You can check progress in your customer workspace using your tracking code.",
              ],
              [
                "Can I share photos of the job?",
                "Yes. Add photos and a description while making your request so the professional can understand what needs doing. You can also share your address and an optional location.",
              ],
              [
                "How much will the service cost?",
                "Doable does not set prices or take payments. Discuss the scope, cost and payment arrangements directly with the professional before work begins.",
              ],
              [
                "How do I join as a professional?",
                "Create a professional account with your service, pincode and contact details. You can then manage requests and block dates when you are unavailable.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span>+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="container final-cta">
          <span className="eyebrow">LET’S MAKE IT DOABLE</span>
          <h2>
            That job you’ve been putting off?
            <br />
            <span className="accent">Start here.</span>
          </h2>
          <Link to="/services" className="button">
            Find a professional <Icon />
          </Link>
          <p>
            Or <Link to="/register-worker">put your skills to work ↗</Link>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
