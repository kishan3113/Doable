import React, { useEffect, useRef, useState } from "react";

export function Feedback({ message, onDismiss }) {
  if (!message) return null;
  const error = /failed|error|unable|invalid|❌/i.test(message);
  return (
    <div
      className={`notice feedback ${error ? "notice-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      <span>{message.replace(/[✅❌]/g, "").trim()}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss message">
        ×
      </button>
    </div>
  );
}

export function useConfirmation() {
  const [message, setMessage] = useState("");
  const resolver = useRef(null);
  const trigger = useRef(null);
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!message) return;
    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMessage("");
        resolver.current?.(false);
        resolver.current = null;
        trigger.current?.focus();
      }
      if (event.key === "Tab") {
        const buttons = dialogRef.current?.querySelectorAll("button");
        if (!buttons?.length) return;
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [message]);
  function ask(text) {
    trigger.current = document.activeElement;
    setMessage(text);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }
  function finish(answer) {
    setMessage("");
    resolver.current?.(answer);
    resolver.current = null;
    trigger.current?.focus();
  }
  const dialog = message ? (
    <div className="dialog-backdrop">
      <section
        ref={dialogRef}
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-heading"
        aria-describedby="confirm-description"
      >
        <h2 id="confirm-heading">Please confirm</h2>
        <p id="confirm-description">{message}</p>
        <div className="actions">
          <button
            className="button button-outline"
            autoFocus
            onClick={() => finish(false)}
          >
            Cancel
          </button>
          <button className="button" onClick={() => finish(true)}>
            Continue
          </button>
        </div>
      </section>
    </div>
  ) : null;
  return { ask, dialog };
}
