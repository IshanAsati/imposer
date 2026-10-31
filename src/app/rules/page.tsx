import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Flame } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "The rules",
  description:
    "How to play IMPOSER: memories, clues, accusations, final guesses, and scoring.",
};

export default function RulesPage() {
  return (
    <main className="min-h-svh">
      <SiteHeader />

      <div className="mx-auto w-full max-w-4xl px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 font-label text-[0.58rem] uppercase tracking-[0.18em] text-ash/70 transition hover:text-bone"
        >
          <ArrowLeft className="size-3.5" />
          Back to the foyer
        </Link>

        <div className="mt-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">The house rules</p>
            <h1 className="mt-5 font-display text-[clamp(3.4rem,9vw,6.5rem)] leading-[0.85] text-bone">
              How to lie
              <span className="block text-ash">convincingly.</span>
            </h1>
          </div>
          <span className="stamp mb-2 hidden sm:inline-flex">Do not lose this</span>
        </div>

        <div className="paper mt-10 p-6 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3b2c1d]/25 pb-4 font-label text-[0.54rem] uppercase tracking-[0.17em] text-[#6c5b45]">
            <span>IMPOSER · Rules of the wake</span>
            <span>3–12 guests · 1–3 imposters</span>
          </div>

          <article className="article-prose pt-8">
            <p className="font-display !text-[1.55rem] !leading-snug !text-[#2b2117]">
              Everyone at the wake is given the same memory. One guest — the
              imposter — is given only the category. The table must find them
              before they leave with a memory that is not theirs.
            </p>

            <h2>1. Set the table</h2>
            <p>
              The host opens a wake and shares the six-character code or invite
              link. Every guest joins from their own phone. When three to twelve
              guests have arrived, the host chooses the rules and begins.
            </p>
            <ul>
              <li>
                <strong>3–5 guests:</strong> up to 1 imposter
              </li>
              <li>
                <strong>6–8 guests:</strong> up to 2 imposters
              </li>
              <li>
                <strong>9–12 guests:</strong> up to 3 imposters
              </li>
            </ul>
            <p>
              The default game is five rounds. The host may choose three to ten
              rounds and one of seven memory drawers.
            </p>

            <h2>2. Receive the memory</h2>
            <p>
              At the start of each round, the crew sees the secret memory and
              its category. Imposters see only the category. Each round has new
              imposters, so nobody sits out for long.
            </p>
            <div className="rule-callout">
              <p>
                Never read the memory aloud, type it into chat, or spell it out.
                The imposter is listening for exactly that.
              </p>
            </div>

            <h2>3. Give one word</h2>
            <p>
              The app sets a speaking order. On your turn, submit exactly{" "}
              <strong>one word</strong>. Everyone can see every clue, so your word
              must prove you know the memory without handing it to the imposter.
            </p>
            <p>
              Good clues are particular, not obvious. If the memory is{" "}
              <em>Grandmother&apos;s house</em>, &ldquo;creaky&rdquo; tells the
              table more than &ldquo;old.&rdquo; If you are the imposter, your
              clue must sound like a memory you have never had.
            </p>
            <p>
              You may pass if you are stuck. A missed turn is skipped
              automatically when the timer runs out.
            </p>

            <h2>4. Discuss and accuse</h2>
            <p>
              Once every guest has given a clue, the table talks. Ask for
              specifics. Compare stories. Decide who is guessing.
            </p>
            <p>
              When discussion ends, everyone votes for one guest or for{" "}
              <strong>skip</strong>. You cannot vote for yourself. If one guest
              receives the most votes, they are accused. If the vote is tied
              between guests, the tied guests face a runoff.
            </p>
            <ul>
              <li>
                If the tied vote involves <strong>skip</strong>, or it is a tie
                with no clear leader, no one is accused and the imposters win the
                round.
              </li>
              <li>
                If the runoff is still tied, no one is accused and the imposters
                win the round.
              </li>
              <li>
                A guest may always change their vote until every vote is in or
                the timer expires.
              </li>
            </ul>

            <h2>5. The final guess</h2>
            <p>
              If the accused guest is an imposter, the crew has not won yet. The
              imposter gets one chance to name the memory from four options.
            </p>
            <ul>
              <li>
                <strong>Correct guess:</strong> the imposters win the round.
              </li>
              <li>
                <strong>Wrong guess:</strong> the crew wins the round.
              </li>
              <li>
                If more than one imposter is in play, they share the same fate
                and the same guess.
              </li>
            </ul>

            <h2>6. Scoring</h2>
            <p>
              Points are awarded at the end of each round, immediately after the
              outcome is decided.
            </p>
            <div className="my-6 overflow-hidden border border-[#3b2c1d]/25">
              <table className="w-full border-collapse text-left text-[1.02rem]">
                <thead className="bg-[#3b2c1d]/10 font-label text-[0.55rem] uppercase tracking-[0.13em] text-[#5e4c37]">
                  <tr>
                    <th className="px-4 py-3">Outcome</th>
                    <th className="px-4 py-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="text-[#33281b]">
                  <tr className="border-t border-[#3b2c1d]/15">
                    <td className="px-4 py-3">
                      Imposters survive or no one is accused
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      +3 each imposter
                    </td>
                  </tr>
                  <tr className="border-t border-[#3b2c1d]/15">
                    <td className="px-4 py-3">
                      Imposter caught and guesses wrong
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      +3 each crew
                    </td>
                  </tr>
                  <tr className="border-t border-[#3b2c1d]/15">
                    <td className="px-4 py-3">
                      Imposter caught and names the memory
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      +2 each imposter, +1 each crew
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>7. End the wake</h2>
            <p>
              After the final round, the side with the most round wins takes the
              wake. If the round wins are tied, the house favors the uninvited:
              the imposters win. Individual points decide who is remembered as
              the most persuasive guest, but the team result stands.
            </p>
            <p>
              The host can call a rematch from the final screen. Scores reset;
              the table stays together.
            </p>

            <h2>8. A few house rules</h2>
            <ul>
              <li>Keep clues to one word. The app will refuse anything else.</li>
              <li>Do not reveal your role card to another guest&apos;s screen.</li>
              <li>
                There is no voice chat inside the app. Use your usual call or
                speak across the room.
              </li>
              <li>
                If a guest disconnects, their seat remains. Rejoin with the same
                device or ask the host for a new invite.
              </li>
              <li>Do not trust anyone who says &ldquo;I definitely remember.&rdquo;</li>
            </ul>

            <div className="mt-10 flex flex-col items-center border-t border-[#3b2c1d]/25 pt-8 text-center">
              <span className="wax-seal mb-5" aria-hidden="true">
                I
              </span>
              <p className="!mb-4 font-display !text-2xl !leading-tight !text-[#2b2117]">
                The table is set. The candles are lit.
              </p>
              <Link
                href="/create"
                className={buttonClasses({
                  variant: "paper",
                  size: "md",
                  className: "mt-2",
                })}
              >
                <Flame className="size-4" />
                Open a wake
              </Link>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
