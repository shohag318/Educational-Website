import { redirect } from "next/navigation";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const inst = searchParams?.inst || searchParams?.code || "";
  if (inst) {
    redirect(`/portal-login?inst=${encodeURIComponent(String(inst))}`);
  }
  redirect("/portal-login");
}
