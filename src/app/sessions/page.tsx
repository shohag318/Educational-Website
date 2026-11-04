import { redirect } from "next/navigation";
import { PATHS } from "@/config-global";

export default function SessionsAliasPage() {
  redirect(PATHS.session.manager);
}
