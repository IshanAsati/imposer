import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IMPOSER — A Wake for Liars",
    short_name: "IMPOSER",
    description:
      "A social deduction game of borrowed memories for 3–12 players.",
    start_url: "/",
    display: "standalone",
    background_color: "#090807",
    theme_color: "#090807",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
