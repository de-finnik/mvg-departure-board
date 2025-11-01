"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { searchParamToConfig } from "@/lib/parseConfig";
import DepartureBoardCore from "@/components/DepartureBoardCore";

function BoardPageInner() {
  const sp = useSearchParams();
  const config = useMemo(() => searchParamToConfig(sp), [sp]);

  useEffect(() => {
    if(config.titleBar) {
      document.title = `${config.titleBar} | abfahrt.live`;
    }
  }, [config.titleBar]);

  return (
    <div
      className={[
        "w-full max-w-full flex min-h-dvh items-center justify-center",
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
