"use client";

import { useState } from "react";
import { BrandAssetsManager } from "@/components/panel/BrandAssetsManager";
import { PwaBrandPreview } from "@/components/panel/PwaBrandPreview";
import type { PanelBusinessSettings } from "@/lib/operations/panel-settings.types";

export function BrandConfigurationAssetsSection({ business }: { business: PanelBusinessSettings }) {
  const [currentBusiness, setCurrentBusiness] = useState(business);

  return (
    <>
      <BrandAssetsManager business={currentBusiness} onBusinessChange={setCurrentBusiness} />
      <PwaBrandPreview business={currentBusiness} />
    </>
  );
}
