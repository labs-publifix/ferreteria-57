import { ImageResponse } from "next/og";
import { INTER_BOLD_TTF, INTER_REGULAR_TTF, RUSSO_ONE_TTF } from "@/lib/club57/promociones/liquidaciones/pdfAssets";
import type { ClusterTema } from "@/content/blog/clusters";
import { CLUSTER_THEME } from "./theme";

// Imágenes Open Graph del blog (1200×630) con next/og: tarjeta de marca por
// clúster, sin fotos. Las fuentes son las mismas Russo One / Inter que ya
// van incrustadas en el repo para el PDF de Liquidaciones (licencia OFL,
// subconjunto latino), así la función nunca depende de leer archivos
// sueltos del disco ni de descargar nada.
export const OG_SIZE = { width: 1200, height: 630 };

function toArrayBuffer(base64: string): ArrayBuffer {
  const buffer = Buffer.from(base64, "base64");
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

const FONTS = [
  { name: "Russo One", data: toArrayBuffer(RUSSO_ONE_TTF), weight: 400 as const, style: "normal" as const },
  { name: "Inter", data: toArrayBuffer(INTER_REGULAR_TTF), weight: 400 as const, style: "normal" as const },
  { name: "Inter", data: toArrayBuffer(INTER_BOLD_TTF), weight: 700 as const, style: "normal" as const },
];

export function renderBlogOg({
  tema,
  eyebrow,
  title,
  number,
}: {
  tema: ClusterTema;
  eyebrow: string;
  title: string;
  number?: string;
}) {
  const theme = CLUSTER_THEME[tema];
  const fg = theme.fgHex;
  const titleSize = title.length > 70 ? 54 : title.length > 45 ? 62 : 72;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: theme.bgHex,
          color: fg,
          padding: "64px 72px",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              opacity: 0.85,
              maxWidth: 760,
            }}
          >
            {eyebrow}
          </div>
          {number ? (
            <div style={{ display: "flex", fontFamily: "Russo One", fontSize: 168, lineHeight: 0.8 }}>{number}</div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Russo One",
            fontSize: titleSize,
            lineHeight: 1.08,
            textTransform: "uppercase",
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 999,
              background: tema === "naranja" ? "#1A1A1A" : "#FF6600",
              color: tema === "naranja" ? "#FFFFFF" : "#1A1A1A",
              fontFamily: "Russo One",
              fontSize: 22,
            }}
          >
            F57
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>Ferretería 57 · Blog</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: FONTS }
  );
}
