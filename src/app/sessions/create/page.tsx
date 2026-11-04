import { redirect } from "next/navigation";
import { PATHS } from "@/config-global";

export default function SessionsCreateAliasPage() {
  redirect(PATHS.session.create);
}
