import { StudioEquisCredit } from "@/components/public/StudioEquisCredit";
import { InstallInstructions } from "@/components/pwa/InstallInstructions";

export default function PublicInstallPage() {
  return (
    <>
      <InstallInstructions surface="public" />
      <StudioEquisCredit />
    </>
  );
}
