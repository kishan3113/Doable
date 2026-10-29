import React from "react";
import { Header, serviceImages } from "./SiteUI";
export default function AuthLayout({ children, worker }) {
  return (
    <>
      <Header />
      <main className="container auth-layout">
        <aside className="auth-story">
          <img
            src={worker ? serviceImages.Carpenter : serviceImages.Gardener}
            alt={
              worker
                ? "Craftsperson working in a workshop"
                : "A gardener tending a flowerbed"
            }
          />
          <div>
            <span className="eyebrow">EVERYDAY, MADE DOABLE</span>
            <h1>
              {worker ? (
                <>
                  Good at what you do?
                  <br />
                  <span className="accent">Let’s put it to work.</span>
                </>
              ) : (
                <>
                  A little help.
                  <br />
                  <span className="accent">A lot more living.</span>
                </>
              )}
            </h1>
            <p>
              {worker
                ? "Your local customers, upcoming jobs and availability. All in one place."
                : "Connect with local professionals and make room for the things you love."}
            </p>
          </div>
        </aside>
        <section className="auth-form">{children}</section>
      </main>
      <div className="container auth-bottom">
        <span>© {new Date().getFullYear()} Doable</span>
        <span>Good help starts with a connection.</span>
      </div>
    </>
  );
}
