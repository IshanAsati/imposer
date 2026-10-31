"use client";

import { useState, useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, QrCode, Share2, Smartphone } from "lucide-react";
import { absoluteRoomUrl, copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";

interface InviteCardProps {
  code: string;
  showQrInitially?: boolean;
}

const subscribeNothing = () => () => {};

export function InviteCard({ code, showQrInitially = false }: InviteCardProps) {
  const { toast } = useToast();
  const [showQr, setShowQr] = useState(showQrInitially);
  const origin = useSyncExternalStore(
    subscribeNothing,
    () => window.location.origin,
    () => "",
  );
  const canShare = useSyncExternalStore(
    subscribeNothing,
    () => "share" in navigator,
    () => false,
  );
  const url = origin
    ? `${origin}/join?code=${encodeURIComponent(code)}`
    : "";

  const copy = async (value: string, message: string) => {
    const copied = await copyToClipboard(value);
    toast(
      copied ? message : "The house could not reach the clipboard.",
      copied ? "success" : "error",
    );
  };

  const share = async () => {
    if (!url || typeof navigator === "undefined" || !navigator.share) {
      return;
    }
    try {
      await navigator.share({
        title: "IMPOSER — A Wake for Liars",
        text: `Wake ${code} is waiting. Take your place at the table.`,
        url,
      });
    } catch {
      // A cancelled share is not an error worth reporting.
    }
  };

  return (
    <section className="relative overflow-hidden border border-ember/25 bg-[radial-gradient(ellipse_at_88%_0%,rgba(208,161,93,0.13),transparent_55%)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-label text-[0.54rem] uppercase tracking-[0.2em] text-ember/85">
            The invitation
          </p>
          <p className="mt-1 text-sm leading-snug text-ash/70">
            Six characters open the door. Share the code or the link.
          </p>
        </div>
        <QrCode className="size-4 shrink-0 text-ash/40" aria-hidden="true" />
      </div>

      <button
        type="button"
        onClick={() => void copy(code, "Wake code copied.")}
        title="Copy wake code"
        aria-label={`Copy wake code ${code}`}
        className="group mt-4 grid w-full max-w-sm grid-cols-6 gap-1.5 text-center"
      >
        {code.split("").map((character, index) => (
          <span
            key={`${character}-${index}`}
            className="grid h-11 place-items-center border border-bone/15 bg-black/30 font-label text-lg tracking-[0.08em] text-bone transition group-hover:border-ember/45 group-hover:text-ember sm:h-12 sm:text-xl"
          >
            {character}
          </span>
        ))}
      </button>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => void copy(url || absoluteRoomUrl(code), "Invite link copied.")}
        >
          <Copy className="size-3.5" />
          Copy invite link
        </Button>
        {canShare ? (
          <Button variant="ghost" size="sm" onClick={() => void share()}>
            <Share2 className="size-3.5" />
            Share
          </Button>
        ) : null}
        <Button
          variant="quiet"
          size="sm"
          onClick={() => setShowQr((current) => !current)}
          aria-expanded={showQr}
        >
          <QrCode className="size-3.5" />
          {showQr ? "Hide the square" : "Show the square"}
        </Button>
      </div>

      {showQr ? (
        <div className="mt-4 flex flex-col items-center gap-4 border-t border-bone/10 pt-4 sm:flex-row">
          <div className="shrink-0 bg-[#efe4cf] p-2.5 shadow-[0_14px_38px_rgba(0,0,0,0.4)]">
            {url ? (
              <QRCodeSVG
                value={url}
                size={164}
                level="M"
                marginSize={1}
                bgColor="#efe4cf"
                fgColor="#14100c"
                title={`Join wake ${code}`}
              />
            ) : (
              <div className="size-[164px] animate-pulse bg-[#d9cbb1]" />
            )}
          </div>
          <div className="text-center sm:text-left">
            <p className="font-display text-xl leading-tight text-bone">
              The square admits one.
            </p>
            <p className="mt-1 text-sm leading-snug text-ash/70">
              Point a phone camera at the square. It opens the guest register
              with the code already filled in.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 font-label text-[0.52rem] uppercase tracking-[0.16em] text-ash/45">
              <Smartphone className="size-3" />
              Guests join on their own phones
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
