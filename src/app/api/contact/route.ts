import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const subject = (form.get("subject") as string) || "Algemeen";
      const name = (form.get("name") as string) || "";
      const email = (form.get("email") as string) || "";
      const phone = (form.get("phone") as string) || "";
      const address = (form.get("address") as string) || "";

      if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
      }

      if (subject === "Tuinhuizen") {
        const extraInfo = (form.get("extraInfo") as string) || "";
        const bouwType = (form.get("bouwType") as string) || "Bouwpakket";
        const bekledingHoutsoort =
          (form.get("bekledingHoutsoort") as string) || "";
        const bekledingProfiel = (form.get("bekledingProfiel") as string) || "";
        const newsletterOptIn =
          (form.get("newsletterOptIn") as string) === "true";
        const grondplan = form.get("grondplan"); // may be null

        console.log("Contact form (Tuinhuizen)", {
          subject,
          name,
          email,
          phone,
          address,
          extraInfo,
          bouwType,
          bekledingHoutsoort,
          bekledingProfiel,
          newsletterOptIn,
          grondplan:
            grondplan && typeof grondplan === "object"
              ? (grondplan as File).name
              : null,
        });
      } else {
        const message = (form.get("message") as string) || "";
        if (!message.trim()) {
          return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        console.log("Contact form (Algemeen)", {
          subject,
          name,
          email,
          phone,
          address,
          message,
        });
      }

      return NextResponse.json({ ok: true });
    }

    // Fallback: JSON body (legacy)
    const { name, email, message } = await req.json();
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.log("Contact form (JSON)", { name, email, message });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
