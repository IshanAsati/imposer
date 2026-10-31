import { ImageResponse } from "next/og";

export const alt =
  "IMPOSER — A Wake for Liars. Everyone remembers the night. Everyone except one.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(circle at 72% 24%, #2a1511 0%, #090807 48%, #060504 100%)",
          color: "#e7ddc6",
          padding: "64px 76px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 410,
            height: 410,
            borderRadius: 999,
            border: "1px solid rgba(208,161,93,0.18)",
            right: -60,
            top: -70,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 250,
            height: 250,
            borderRadius: 999,
            border: "1px solid rgba(127,33,29,0.35)",
            right: 20,
            top: 10,
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontFamily: "Courier New, monospace",
            fontSize: 20,
            letterSpacing: 5,
            color: "#b1a48b",
            textTransform: "uppercase",
          }}
        >
          <span>A social deduction wake</span>
          <span style={{ width: 70, height: 1, background: "#7f211d" }} />
          <span>3–12 players</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 148,
              lineHeight: 0.9,
              letterSpacing: 8,
              color: "#eee4cd",
              textShadow: "0 0 80px rgba(127,33,29,0.35)",
            }}
          >
            IMPOSER
          </div>
          <div
            style={{
              marginTop: 30,
              fontSize: 38,
              lineHeight: 1.28,
              color: "#c8baa0",
              maxWidth: 820,
              fontStyle: "italic",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div>Everyone remembers the night.</div>
            <div>Everyone except one.</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(231,221,198,0.16)",
            paddingTop: 24,
            fontFamily: "Courier New, monospace",
            fontSize: 18,
            letterSpacing: 3,
            color: "#8f8470",
            textTransform: "uppercase",
          }}
        >
          <span>One word at a time</span>
          <span style={{ color: "#b8483b" }}>Someone is lying</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
