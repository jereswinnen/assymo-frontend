import { redirect } from "next/navigation";

// Redirect to main configurator page with catalogue tab
export default function CatalogueRedirect() {
  redirect("/admin/content/configurator?tab=catalogue");
}
