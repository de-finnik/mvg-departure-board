"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { searchParamToConfig } from "@/lib/parseConfig";
import DepartureBoardCore from "@/components/DepartureBoardCore";

export default function BoardPage() {
  const sp = useSearchParams();
  const config = useMemo(() => searchParamToConfig(sp), [sp]);

  return (
    <div
      className={[
        // full height + center
        "min-h-dvh grid place-items-center",
        // page background from config theme
        config.darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900",
      ].join(" ")}
    >
      <DepartureBoardCore config={config} />
    </div>
  );
}
