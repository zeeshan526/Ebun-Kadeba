"use client";

import { useState } from "react";

// Set NEXT_PUBLIC_FORM_ENDPOINT (e.g. https://formspree.io/f/xxxx) to collect sign-ups.
const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT ?? "";

export function NotifyForm() {
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = form.elements.namedItem("email") as HTMLInputElement;
    if (!email.checkValidity()) {
      setMsg("Enter an email address like name@example.com.");
      email.focus();
      return;
    }
    if (!FORM_ENDPOINT) {
      setMsg("Sign-ups open very soon. Please check back shortly.");
      return;
    }
    setMsg("Adding you…");
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error();
      form.reset();
      setMsg("You’re on the list. You’ll hear from me when it’s live.");
    } catch {
      setMsg("That didn’t go through. Check your connection and try again.");
    }
  }

  return (
    <form className="notify" noValidate onSubmit={onSubmit}>
      <label htmlFor="email">Want a note when it’s live?</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      <button type="submit">Notify me</button>
      <p className="msg" role="status" aria-live="polite">
        {msg}
      </p>
    </form>
  );
}
