import { redirect } from "next/navigation";
import { PATHS } from "@/config-global";

export default function SessionIndexPage() {
  redirect(PATHS.session.manager);
}
