"use client";

import { useMemo } from "react";
import { makeThrowParams } from "@/lib/dice/throwParams";
import { useDiceStore } from "@/lib/store";
import { Die } from "./Die";

export function DiceManager() {
  const spec = useDiceStore((s) => s.spec);
  const rollId = useDiceStore((s) => s.rollId);

  // one throw per die, regenerated per roll
  const throws = useMemo(
    () => spec.map((_, i) => makeThrowParams(i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rollId, spec.length]
  );

  return (
    <>
      {spec.map((d, i) => (
        <Die key={d.id} id={d.id} type={d.type} params={throws[i]} />
      ))}
    </>
  );
}
