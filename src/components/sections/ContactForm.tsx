"use client";

import { FormEvent, useMemo, useState } from "react";

interface ContactFormProps {
  section: {
    _type: "contactForm";
    heading?: string;
  };
}

export default function ContactForm({ section }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [subject, setSubject] = useState<"Algemeen" | "Tuinhuizen">("Algemeen");
  const [message, setMessage] = useState("");
  // Tuinhuizen specific
  const [extraInfo, setExtraInfo] = useState("");
  const [grondplanFile, setGrondplanFile] = useState<File | null>(null);
  const [bouwType, setBouwType] = useState<"Bouwpakket" | "Geplaatst">(
    "Bouwpakket"
  );
  const [bekledingHoutsoort, setBekledingHoutsoort] = useState("");
  const [bekledingProfiel, setBekledingProfiel] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("email", email);
      formData.set("phone", phone);
      formData.set("address", address);
      formData.set("subject", subject);
      if (subject === "Tuinhuizen") {
        formData.set("extraInfo", extraInfo);
        formData.set("bouwType", bouwType);
        formData.set("bekledingHoutsoort", bekledingHoutsoort);
        formData.set("bekledingProfiel", bekledingProfiel);
        formData.set("newsletterOptIn", String(newsletterOptIn));
        if (grondplanFile) formData.set("grondplan", grondplanFile);
      } else {
        formData.set("message", message);
      }

      const res = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(
          data.error || "Er is iets misgegaan. Probeer later opnieuw."
        );
      }

      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setSubject("Algemeen");
      setMessage("");
      setExtraInfo("");
      setGrondplanFile(null);
      setBouwType("Bouwpakket");
      setBekledingHoutsoort("");
      setBekledingProfiel("");
      setNewsletterOptIn(false);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(
        err?.message || "Er is iets misgegaan. Probeer later opnieuw."
      );
    }
  }

  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-6">
      {section.heading && (
        <header className="hidden col-span-full">
          <h2>{section.heading}</h2>
        </header>
      )}

      <div className="col-span-full max-w-3xl mx-auto w-full">
        {section.heading ? <h2 className="mb-6">{section.heading}</h2> : null}

        {status === "success" ? (
          <p className="text-green-700">
            Bedankt! We nemen spoedig contact met je op.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1">
              <label htmlFor="name">Naam</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded px-3 py-2"
                autoComplete="name"
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="email">E-mailadres</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded px-3 py-2"
                autoComplete="email"
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="phone">Telefoon</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border rounded px-3 py-2"
                autoComplete="tel"
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="address">Adres</label>
              <input
                id="address"
                name="address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="border rounded px-3 py-2"
                autoComplete="street-address"
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="subject">Onderwerp</label>
              <select
                id="subject"
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value as any)}
                className="border rounded px-3 py-2"
              >
                <option value="Algemeen">Algemeen</option>
                <option value="Tuinhuizen">Tuinhuizen</option>
              </select>
            </div>

            {subject === "Algemeen" ? (
              <div className="grid gap-1">
                <label htmlFor="message">Bericht</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="border rounded px-3 py-2 min-h-40"
                />
              </div>
            ) : (
              <>
                <div className="grid gap-1">
                  <label htmlFor="extraInfo">Extra informatie</label>
                  <textarea
                    id="extraInfo"
                    name="extraInfo"
                    required
                    value={extraInfo}
                    onChange={(e) => setExtraInfo(e.target.value)}
                    className="border rounded px-3 py-2 min-h-40"
                  />
                </div>

                <div className="grid gap-1">
                  <label htmlFor="grondplan">Grondplan uploaden</label>
                  <input
                    id="grondplan"
                    name="grondplan"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      setGrondplanFile(e.target.files?.[0] || null)
                    }
                    className="border rounded px-3 py-2"
                  />
                </div>

                <div className="grid gap-1">
                  <label htmlFor="bouwType">Bouwpakket of geplaatst</label>
                  <select
                    id="bouwType"
                    name="bouwType"
                    value={bouwType}
                    onChange={(e) => setBouwType(e.target.value as any)}
                    className="border rounded px-3 py-2"
                  >
                    <option value="Bouwpakket">Bouwpakket</option>
                    <option value="Geplaatst">Geplaatst</option>
                  </select>
                </div>

                <div className="grid gap-1">
                  <label htmlFor="bekledingHoutsoort">
                    Bekledingen: houtsoort
                  </label>
                  <input
                    id="bekledingHoutsoort"
                    name="bekledingHoutsoort"
                    type="text"
                    value={bekledingHoutsoort}
                    onChange={(e) => setBekledingHoutsoort(e.target.value)}
                    className="border rounded px-3 py-2"
                  />
                </div>

                <div className="grid gap-1">
                  <label htmlFor="bekledingProfiel">Bekledingen: profiel</label>
                  <input
                    id="bekledingProfiel"
                    name="bekledingProfiel"
                    type="text"
                    value={bekledingProfiel}
                    onChange={(e) => setBekledingProfiel(e.target.value)}
                    className="border rounded px-3 py-2"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="newsletterOptIn"
                    name="newsletterOptIn"
                    type="checkbox"
                    checked={newsletterOptIn}
                    onChange={(e) => setNewsletterOptIn(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="newsletterOptIn" className="select-none">
                    Ja, ik ontvang graag nieuws over aanbiedingen
                  </label>
                </div>
              </>
            )}

            {status === "error" && (
              <p className="text-red-600">{errorMessage}</p>
            )}

            <div>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
              >
                {status === "submitting" ? "Versturen..." : "Versturen"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
