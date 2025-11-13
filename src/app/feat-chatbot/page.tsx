import Chatbot from "@/components/Chatbot";
import { Fullscreen, Section } from "lucide-react";

export const dynamic = "force-dynamic";

export default function FeatChatbotPage() {
  return (
    <section className="col-span-full">
      <Chatbot />
    </section>
  );
}
