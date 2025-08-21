"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { searchParamToConfig } from "@/lib/parseConfig";
import DepartureBoardCore from "@/components/DepartureBoardCore";

function BoardPageInner() {
  const sp = useSearchParams();
  const config = useMemo(() => searchParamToConfig(sp), [sp]);

  return (
    <div
      className={[
        "min-h-dvh grid place-items-center",
        config.darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900",
      ].join(" ")}
    >
      <DepartureBoardCore config={config} />
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <BoardPageInner />
    </Suspense>
  );
}
