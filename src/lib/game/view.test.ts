import { describe, expect, it } from "vitest";
import { buildRoomView } from "./view";
import type { ChatMessage } from "./types";
import {
  act,
  makeRoom,
  startedRoom,
  TEST_NOW,
  toVoting,
  voteAll,
} from "./test-helpers";

function caughtImposterRoom() {
  let room = toVoting(startedRoom(6, { imposterCount: 2 }));
  const imposterIds = room.round?.imposterIds ?? [];
  const imposterId = imposterIds[0];
  const fallback = room.players.find((player) => player.id !== imposterId);
  if (!imposterId || !fallback) {
    throw new Error("Expected a caught imposter and a fallback guest.");
  }

  room = voteAll(room, (playerId) =>
    playerId === imposterId ? fallback.id : imposterId,
  );

  return { room, imposterId, imposterIds };
}

const PRESENCE = { p1: TEST_NOW };

function view(room: ReturnType<typeof makeRoom>, viewerId: string) {
  return buildRoomView(room, viewerId, PRESENCE, [], TEST_NOW);
}

describe("buildRoomView secrets", () => {
  it("shows nothing but seats in the lobby", () => {
    const room = makeRoom(5);
    const crew = view(room, "p2");

    expect(crew.you.role).toBeNull();
    expect(crew.you.word).toBeNull();
    expect(crew.you.category).toBeNull();
    expect(crew.you.fellowImposters).toBeNull();
    expect(crew.round).toBeNull();
  });

  it("gives the crew the memory but hides the imposters", () => {
    const room = startedRoom(6, { imposterCount: 2 });
    const round = room.round;
    if (!round) {
      throw new Error("Expected a round.");
    }
    const crewId = room.players.find(
      (player) => !round.imposterIds.includes(player.id),
    )?.id;
    if (!crewId) {
      throw new Error("Expected a crew guest.");
    }

    const crew = view(room, crewId);

    expect(crew.you.role).toBe("crew");
    expect(crew.you.word).toBe(round.word);
    expect(crew.you.category).toBe(round.category);
    expect(crew.you.fellowImposters).toBeNull();
    expect(crew.round?.word).toBe(round.word);
    expect(crew.round?.imposterIds).toBeNull();
  });

  it("gives an imposter the category but never the memory", () => {
    const room = startedRoom(6, { imposterCount: 2 });
    const round = room.round;
    if (!round) {
      throw new Error("Expected a round.");
    }
    const imposterId = round.imposterIds[0];

    const imposter = view(room, imposterId);

    expect(imposter.you.role).toBe("imposter");
    expect(imposter.you.word).toBeNull();
    expect(imposter.you.category).toBe(round.category);
    expect(imposter.you.fellowImposters).toEqual(
      round.imposterIds.filter((id) => id !== imposterId),
    );
    expect(imposter.round?.word).toBeNull();
    expect(imposter.round?.imposterIds).toBeNull();
    expect(imposter.round?.category).toBe(round.category);
  });

  it("only hands the four guess options to an imposter on trial", () => {
    const { room, imposterId } = caughtImposterRoom();
    const crewId = room.players.find(
      (player) => !room.round?.imposterIds.includes(player.id),
    )?.id;
    if (!crewId) {
      throw new Error("Expected a crew guest.");
    }

    expect(room.phase).toBe("imposter_guess");

    const imposter = view(room, imposterId);
    const crew = view(room, crewId);

    expect(imposter.round?.guessOptions).toHaveLength(4);
    expect(imposter.round?.guessOptions).toContain(room.round?.word);
    expect(imposter.round?.word).toBeNull();
    expect(crew.round?.guessOptions).toBeNull();
    expect(crew.round?.word).toBe(room.round?.word ?? null);
  });

  it("reveals the memory, votes, and imposters once the round is over", () => {
    const { room, imposterId } = caughtImposterRoom();
    const settled = act(room, imposterId, {
      type: "submitGuess",
      word: room.round?.guessOptions?.[0] ?? "",
    });
    if (!settled.round) {
      throw new Error("Expected a settled round.");
    }

    const imposter = view(settled, imposterId);
    const crewId = settled.players.find(
      (player) => !settled.round?.imposterIds.includes(player.id),
    )?.id;
    if (!crewId) {
      throw new Error("Expected a crew guest.");
    }
    const crew = view(settled, crewId);

    expect(settled.phase).toBe("round_result");
    expect(imposter.you.word).toBe(settled.round.word);
    expect(imposter.round?.word).toBe(settled.round.word);
    expect(imposter.round?.imposterIds).toEqual(settled.round.imposterIds);
    expect(imposter.round?.votes).toEqual(settled.round.votes);
    expect(imposter.round?.tally).toEqual(settled.round.tally);
    expect(imposter.round?.pointsAwarded).toEqual(
      settled.round.pointsAwarded,
    );
    expect(imposter.round?.guessOptions).toBeNull();
    expect(crew.round?.word).toBe(settled.round.word);
    expect(crew.round?.imposterIds).toEqual(settled.round.imposterIds);
  });

  it("keeps the memory hidden from imposters at the very end", () => {
    const room = startedRoom(4);
    room.phase = "final";
    room.finalOutcome = "crew";
    if (!room.round) {
      throw new Error("Expected a round.");
    }
    const imposterId = room.round.imposterIds[0];

    const imposter = view(room, imposterId);

    expect(imposter.you.word).toBe(room.round.word);
    expect(imposter.round?.word).toBe(room.round.word);
    expect(imposter.round?.imposterIds).toEqual(room.round.imposterIds);
  });
});

describe("buildRoomView presence and chat", () => {
  it("marks only recently seen seats online", () => {
    const room = makeRoom(4);
    const chat: ChatMessage[] = [
      {
        id: "m1",
        playerId: "p2",
        name: "Guest 2",
        body: "Someone is breathing.",
        createdAt: TEST_NOW - 500,
      },
    ];
    const built = buildRoomView(room, "p1", { p1: TEST_NOW - 100 }, chat, TEST_NOW);

    expect(built.players.find((player) => player.id === "p1")?.online).toBe(
      true,
    );
    expect(built.players.find((player) => player.id === "p2")?.online).toBe(
      false,
    );
    expect(built.chat).toEqual(chat);
    expect(built.serverNow).toBe(TEST_NOW);
  });

  it("rejects a viewer who is not at the table", () => {
    expect(() => view(makeRoom(4), "stranger")).toThrow(
      "Viewer is not in this room",
    );
  });

  it("marks the host and carries scores and settings across", () => {
    const room = makeRoom(4);
    room.players[0].score = 7;
    const built = view(room, "p1");

    expect(built.hostId).toBe("p1");
    expect(built.you.isHost).toBe(true);
    expect(built.players.find((player) => player.id === "p1")?.isHost).toBe(
      true,
    );
    expect(built.players.find((player) => player.id === "p1")?.score).toBe(7);
    expect(built.settings).toEqual(room.settings);
    expect(built.code).toBe(room.code);
  });
});
