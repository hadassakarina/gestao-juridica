"use client";

import { useEffect, useState } from "react";
import { contarProcessosAtivos } from "./actions";

export function ContadorProcessos() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;
    void contarProcessosAtivos().then((total) => {
      if (ativo) setTotal(total);
    }).catch(() => {});
    return () => { ativo = false; };
  }, []);

  return total === null ? "—" : total.toLocaleString("pt-BR");
}
