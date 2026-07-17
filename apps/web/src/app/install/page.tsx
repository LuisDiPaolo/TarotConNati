import { StudioEquisCredit } from "@/components/public/StudioEquisCredit";
import { InstallInstructions } from "@/components/pwa/InstallInstructions";

export default function InstallPage() {
  return (
    <>
      <InstallInstructions surface="public" />
      <StudioEquisCredit />
    </>
  );
}
