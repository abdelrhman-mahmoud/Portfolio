import { ImageResponse } from "next/og";
import { getPortfolio } from "@/lib/server/content";
import { str } from "@/lib/cms/model";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function OpenGraphImage() {
  const data = await getPortfolio();
  const profile = data.profile[0];
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 90,
        background: "#0c0912",
        color: "#faf7fc",
        borderBottom: "12px solid #b46bd6",
      }}
    >
      <div style={{ fontSize: 28, color: "#e35b96", marginBottom: 30 }}>
        {str(profile, "title")}
      </div>
      <div style={{ fontSize: 80, fontWeight: 700 }}>
        {str(profile, "displayName")}
      </div>
      <div style={{ fontSize: 24, marginTop: 35, color: "#c4bdce" }}>
        {str(profile, "secondaryTitle")}
      </div>
    </div>,
    size,
  );
}
