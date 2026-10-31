import { describe, expect, it } from "vitest";
import {
  advanceRoom,
  GameError,
  normalizeSettings,
  type GameErrorCode,
} from "./engine";
import { REVEAL_MS } from "./constants";
import {
  act,
  makeRoom,
  startedRoom,
  TEST_NOW,
  testRng,
  toVoting,
  voteAll,
} from "./test-helpers";

function expectCode(fn: () => unknown, code: GameErrorCode): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(GameError);
    expect((error as GameError).code).toBe(code);
    return;
  }
  throw new Error(`Expected a GameError with code ${code}.`);
}

describe("normalizeSettings", () => {
  it("clamps every rule to the supported range", () => {
    const settings = normalizeSettings(
      {
        imposterCount: 9,
        rounds: 99,
        clueSeconds: 1,
        discussionSeconds: 999,
        voteSeconds: 0,
        guessSeconds: 999,
        finalGuess: false,
      },
      12,
    );

    expect(settings).toEqual({
      imposterCount: 3,
      rounds: 10,
      packId: "random",
      clueSeconds: 15,
      discussionSeconds: 300,
      voteSeconds: 10,
      guessSeconds: 120,
      finalGuess: false,
    });
  });

  it("scales the number of imposters to the table", () => {
    expect(normalizeSettings({ imposterCount: 3 }, 4).imposterCount).toBe(1);
    expect(normalizeSettings({ imposterCount: 3 }, 6).imposterCount).toBe(2);
    expect(normalizeSettings({ imposterCount: 3 }, 9).imposterCount).toBe(3);
  });

  it("falls back from an unknown memory pack", () => {
    expect(
      normalizeSettings({ packId: "not-a-pack" as never }, 5).packId,
    ).toBe("random");
  });
});

describe("startGame", () => {
  it("requires three guests and a host", () => {
    const tooSmall = makeRoom(2);
    expectCode(
      () => act(tooSmall, "p1", { type: "startGame" }),
      "WRONG_PHASE",
    );

    const lobby = makeRoom(4);
    expectCode(
      () => act(lobby, "p2", { type: "startGame" }),
      "FORBIDDEN",
    );
  });

  it("deals roles, a clue order, and a reveal timer", () => {
    const room = startedRoom(6, { imposterCount: 2, rounds: 5 });
    const round = room.round;

    expect(room.phase).toBe("reveal");
    expect(room.roundNumber).toBe(1);
    expect(room.deadline).toBe(TEST_NOW + REVEAL_MS);
    expect(room.settings.imposterCount).toBe(2);
    expect(round).not.toBeNull();
    expect(round?.imposterIds).toHaveLength(2);
    expect(new Set(round?.imposterIds).size).toBe(2);
    expect(round?.clueOrder).toHaveLength(6);
    expect(new Set(round?.clueOrder).size).toBe(6);
    expect(
      round?.clueOrder.every((playerId) => round.clues[playerId] === null),
    ).toBe(true);
    expect(round?.word.length).toBeGreaterThan(0);
    expect(room.usedWords).toContain(round?.word);
  });

  it("resets scores and history when the wake begins", () => {
    const room = makeRoom(4);
    room.players[0].score = 12;
    room.history.push({
      number: 1,
      word: "Old word",
      category: "Old category",
      imposterIds: ["p2"],
      eliminatedId: "p2",
      outcome: "crew",
      outcomeReason: "caught",
      guess: null,
      guessCorrect: false,
      tally: null,
      pointsAwarded: null,
    });
    room.roundWins = { crew: 4, imposters: 2 };

    const started = act(room, "p1", { type: "startGame" });

    expect(started.players.every((player) => player.score === 0)).toBe(true);
    expect(started.history).toEqual([]);
    expect(started.roundWins).toEqual({ crew: 0, imposters: 0 });
  });
});

describe("the reveal", () => {
  it("moves to clues when every guest is ready", () => {
    let room = startedRoom(4);

    for (const player of room.players.slice(0, -1)) {
      room = act(room, player.id, { type: "ready" });
      expect(room.phase).toBe("reveal");
    }

    room = act(room, room.players[room.players.length - 1].id, {
      type: "ready",
    });

    expect(room.phase).toBe("clues");
    expect(room.round?.currentClueIndex).toBe(0);
    expect(room.deadline).toBe(TEST_NOW + room.settings.clueSeconds * 1000);
  });

  it("lets the host begin the clues early", () => {
    const room = act(startedRoom(4), "p1", { type: "beginClues" });
    expect(room.phase).toBe("clues");
  });

  it("keeps the reveal closed to everyone but the host", () => {
    expectCode(
      () => act(startedRoom(4), "p2", { type: "beginClues" }),
      "FORBIDDEN",
    );
  });
});

describe("clues", () => {
  it("enforces the speaking order and the one-word rule", () => {
    let room = act(startedRoom(5), "p1", { type: "beginClues" });
    const round = room.round;
    if (!round) {
      throw new Error("Expected a round.");
    }

    const speaker = round.clueOrder[0];
    const waiting = round.clueOrder[1];

    expectCode(
      () => act(room, waiting, { type: "submitClue", clue: "early" }),
      "NOT_YOUR_TURN",
    );
    expectCode(
      () => act(room, speaker, { type: "submitClue", clue: "two words" }),
      "INVALID_CLUE",
    );
    expectCode(
      () => act(room, speaker, {
        type: "submitClue",
        clue: round.word.toUpperCase(),
      }),
      "INVALID_CLUE",
    );
    expectCode(
      () => act(room, speaker, {
        type: "submitClue",
        clue: round.category,
      }),
      "INVALID_CLUE",
    );
    expectCode(
      () => act(room, speaker, { type: "submitClue", clue: "semi;colon" }),
      "INVALID_CLUE",
    );

    room = act(room, speaker, { type: "submitClue", clue: "lantern" });
    expect(room.round?.clues[speaker]).toBe("lantern");
    expect(room.round?.currentClueIndex).toBe(1);
  });

  it("records a skip and eventually opens the discussion", () => {
    let room = act(startedRoom(4), "p1", { type: "beginClues" });
    const round = room.round;
    if (!round) {
      throw new Error("Expected a round.");
    }

    const first = round.clueOrder[0];
    room = act(room, first, { type: "skipClue" });
    expect(room.round?.clues[first]).toBeNull();
    expect(room.round?.currentClueIndex).toBe(1);

    for (let index = 1; index < round.clueOrder.length; index += 1) {
      room = act(room, round.clueOrder[index], {
        type: "submitClue",
        clue: `clue${index + 1}`,
      });
    }

    expect(room.phase).toBe("discussion");
    expect(room.deadline).toBe(
      TEST_NOW + room.settings.discussionSeconds * 1000,
    );
  });

  it("lets only the host call the vote", () => {
    const room = toVoting(startedRoom(5));
    expect(room.phase).toBe("voting");
    expectCode(
      () => act(room, "p2", { type: "startVote" }),
      "FORBIDDEN",
    );
  });
});

describe("voting and outcomes", () => {
  it("sends a caught imposter to the final guess", () => {
    let room = toVoting(startedRoom(6, { imposterCount: 2 }));
    const imposterId = room.round?.imposterIds[0];
    if (!imposterId) {
      throw new Error("Expected an imposter.");
    }
    const fallback = room.players.find(
      (player) => player.id !== imposterId,
    );
    if (!fallback) {
      throw new Error("Expected a second guest.");
    }

    room = voteAll(room, (playerId) =>
      playerId === imposterId ? fallback.id : imposterId,
    );

    expect(room.phase).toBe("imposter_guess");
    expect(room.round?.eliminatedId).toBe(imposterId);
    expect(room.round?.guessOptions).toHaveLength(4);
    expect(room.round?.guessOptions).toContain(room.round?.word);
    expect(new Set(room.round?.guessOptions).size).toBe(4);
  });

  it("awards the round to the imposters when a crew guest is accused", () => {
    let room = toVoting(startedRoom(6, { imposterCount: 2 }));
    const imposterIds = new Set(room.round?.imposterIds ?? []);
    const crew = room.players.find((player) => !imposterIds.has(player.id));
    if (!crew) {
      throw new Error("Expected a crew guest.");
    }
    const fallback = room.players.find((player) => player.id !== crew.id);
    if (!fallback) {
      throw new Error("Expected a second guest.");
    }

    room = voteAll(room, (playerId) =>
      playerId === crew.id ? fallback.id : crew.id,
    );

    expect(room.phase).toBe("round_result");
    expect(room.round?.outcome).toBe("imposters");
    expect(room.round?.outcomeReason).toBe("survived");
    expect(room.roundWins.imposters).toBe(1);
    for (const player of room.players) {
      expect(player.score).toBe(imposterIds.has(player.id) ? 3 : 0);
    }
  });

  it("gives the round to the imposters when the table skips", () => {
    let room = toVoting(startedRoom(5));
    room = voteAll(room, "skip");

    expect(room.phase).toBe("round_result");
    expect(room.round?.outcome).toBe("imposters");
    expect(room.round?.outcomeReason).toBe("stalemate");
    expect(room.roundWins.imposters).toBe(1);
  });

  it("holds a runoff, then settles a second tie without an accusation", () => {
    let room = toVoting(startedRoom(5, { finalGuess: false }));

    room = act(room, "p1", { type: "vote", targetId: "p2" });
    room = act(room, "p2", { type: "vote", targetId: "p1" });
    room = act(room, "p3", { type: "vote", targetId: "p1" });
    room = act(room, "p4", { type: "vote", targetId: "p2" });
    room = act(room, "p5", { type: "vote", targetId: "skip" });

    expect(room.phase).toBe("runoff");
    expect(room.round?.runoffCandidates?.sort()).toEqual(["p1", "p2"]);
    expect(room.round?.voteRound).toBe(2);
    expect(room.round?.votes).toEqual({});

    expectCode(
      () => act(room, "p3", { type: "vote", targetId: "p4" }),
      "INVALID_TARGET",
    );

    room = act(room, "p1", { type: "vote", targetId: "p2" });
    room = act(room, "p2", { type: "vote", targetId: "p1" });
    room = act(room, "p3", { type: "vote", targetId: "p1" });
    room = act(room, "p4", { type: "vote", targetId: "p2" });
    room = act(room, "p5", { type: "vote", targetId: "skip" });

    expect(room.phase).toBe("round_result");
    expect(room.round?.outcome).toBe("imposters");
    expect(room.round?.outcomeReason).toBe("stalemate");
    expect(room.round?.eliminatedId).toBeNull();
  });

  it("does not allow a guest to accuse themselves", () => {
    const room = toVoting(startedRoom(5));
    expectCode(
      () => act(room, "p2", { type: "vote", targetId: "p2" }),
      "INVALID_TARGET",
    );
  });
});

describe("the final guess", () => {
  function caughtImposterRoom() {
    let room = toVoting(startedRoom(6, { imposterCount: 2 }));
    const imposterId = room.round?.imposterIds[0];
    if (!imposterId) {
      throw new Error("Expected an imposter.");
    }
    const fallback = room.players.find(
      (player) => player.id !== imposterId,
    );
    if (!fallback) {
      throw new Error("Expected a second guest.");
    }
    room = voteAll(room, (playerId) =>
      playerId === imposterId ? fallback.id : imposterId,
    );
    return { room, imposterId };
  }

  it("lets any imposter name the memory, and a correct guess takes the round", () => {
    const caught = caughtImposterRoom();
    const word = caught.room.round?.word;
    const otherImposter = caught.room.round?.imposterIds.find(
      (playerId) => playerId !== caught.imposterId,
    );
    if (!word || !otherImposter) {
      throw new Error("Expected a word and a second imposter.");
    }

    const settled = act(caught.room, otherImposter, {
      type: "submitGuess",
      word,
    });

    expect(settled.phase).toBe("round_result");
    expect(settled.round?.outcome).toBe("imposters");
    expect(settled.round?.outcomeReason).toBe("guessed");
    expect(settled.round?.guess).toBe(word);
    expect(settled.round?.guessCorrect).toBe(true);
    const imposters = new Set(settled.round?.imposterIds ?? []);
    for (const player of settled.players) {
      expect(player.score).toBe(imposters.has(player.id) ? 2 : 1);
    }
  });

  it("gives the crew the round for a wrong guess", () => {
    const caught = caughtImposterRoom();
    const round = caught.room.round;
    if (!round) {
      throw new Error("Expected a round.");
    }
    const wrong = round.guessOptions?.find(
      (option) => option.toLowerCase() !== round.word.toLowerCase(),
    );
    if (!wrong) {
      throw new Error("Expected a wrong option.");
    }

    const settled = act(caught.room, caught.imposterId, {
      type: "submitGuess",
      word: wrong,
    });

    expect(settled.round?.outcome).toBe("crew");
    expect(settled.round?.outcomeReason).toBe("caught");
    expect(settled.round?.guessCorrect).toBe(false);
    const imposters = new Set(settled.round?.imposterIds ?? []);
    for (const player of settled.players) {
      expect(player.score).toBe(imposters.has(player.id) ? 0 : 3);
    }
  });

  it("only accepts one of the offered memories from an imposter", () => {
    const caught = caughtImposterRoom();

    expectCode(
      () =>
        act(caught.room, caught.imposterId, {
          type: "submitGuess",
          word: "a memory that was never offered",
        }),
      "INVALID_GUESS",
    );
    expectCode(
      () =>
        act(caught.room, "p2", {
          type: "submitGuess",
          word: caught.room.round?.word ?? "anything",
        }),
      "FORBIDDEN",
    );
  });
});

describe("timers", () => {
  it("walks a whole round forward on deadlines", () => {
    const room = startedRoom(4);
    const revealDeadline = room.deadline;
    if (revealDeadline === null) {
      throw new Error("Expected a reveal deadline.");
    }

    let advanced = advanceRoom(room, revealDeadline, testRng);
    expect(advanced.changed).toBe(true);
    expect(advanced.room.phase).toBe("clues");

    const players = advanced.room.players.length;
    for (let index = 0; index < players; index += 1) {
      const deadline = advanced.room.deadline;
      if (deadline === null) {
        throw new Error("Expected a clue deadline.");
      }
      advanced = advanceRoom(advanced.room, deadline, testRng);
    }

    expect(advanced.room.phase).toBe("discussion");

    advanced = advanceRoom(
      advanced.room,
      advanced.room.deadline as number,
      testRng,
    );
    expect(advanced.room.phase).toBe("voting");

    advanced = advanceRoom(
      advanced.room,
      advanced.room.deadline as number,
      testRng,
    );
    expect(advanced.room.phase).toBe("round_result");
    expect(advanced.room.round?.outcomeReason).toBe("stalemate");

    advanced = advanceRoom(
      advanced.room,
      advanced.room.deadline as number,
      testRng,
    );
    expect(advanced.room.phase).toBe("reveal");
    expect(advanced.room.roundNumber).toBe(2);
  });

  it("gives the crew the round when the final guess times out", () => {
    let room = toVoting(startedRoom(5));
    const imposterId = room.round?.imposterIds[0];
    if (!imposterId) {
      throw new Error("Expected an imposter.");
    }
    const fallback = room.players.find(
      (player) => player.id !== imposterId,
    );
    if (!fallback) {
      throw new Error("Expected a second guest.");
    }
    room = voteAll(room, (playerId) =>
      playerId === imposterId ? fallback.id : imposterId,
    );
    expect(room.phase).toBe("imposter_guess");

    const advanced = advanceRoom(
      room,
      room.deadline as number,
      testRng,
    );
    expect(advanced.room.phase).toBe("round_result");
    expect(advanced.room.round?.outcome).toBe("crew");
    expect(advanced.room.round?.outcomeReason).toBe("caught");
    expect(advanced.room.round?.guess).toBeNull();
  });
});

describe("the final and a rematch", () => {
  function playCrewRounds(): {
    room: ReturnType<typeof startedRoom>;
    finished: ReturnType<typeof startedRoom>;
  } {
    let room = startedRoom(3, { rounds: 3, finalGuess: false });

    for (let round = 1; round <= 3; round += 1) {
      room = toVoting(room);
      const imposterId = room.round?.imposterIds[0];
      if (!imposterId) {
        throw new Error("Expected an imposter.");
      }
      const fallback = room.players.find(
        (player) => player.id !== imposterId,
      );
      if (!fallback) {
        throw new Error("Expected a second guest.");
      }
      room = voteAll(room, (playerId) =>
        playerId === imposterId ? fallback.id : imposterId,
      );
      expect(room.phase).toBe("round_result");

      if (round < 3) {
        room = act(room, room.hostId, { type: "nextRound" });
        expect(room.phase).toBe("reveal");
      }
    }

    return { room, finished: room };
  }

  it("closes the wake after the last round and counts the winner", () => {
    const { finished } = playCrewRounds();
    const final = act(finished, finished.hostId, { type: "nextRound" });

    expect(final.phase).toBe("final");
    expect(final.finalOutcome).toBe("crew");
    expect(final.roundWins).toEqual({ crew: 3, imposters: 0 });
    for (const player of final.players) {
      expect(player.score).toBe(
        final.round?.imposterIds.includes(player.id) ? 0 : 9,
      );
    }
    expect(final.deadline).toBeNull();
  });

  it("breaks a tied wake in favour of the imposters", () => {
    const { finished } = playCrewRounds();
    const tied = structuredClone(finished);
    tied.roundWins = { crew: 1, imposters: 1 };
    tied.roundNumber = tied.settings.rounds;

    const final = act(tied, tied.hostId, { type: "nextRound" });

    expect(final.phase).toBe("final");
    expect(final.finalOutcome).toBe("imposters");
  });

  it("keeps the table but wipes every score on a rematch", () => {
    const { finished } = playCrewRounds();
    const final = act(finished, finished.hostId, { type: "nextRound" });

    expectCode(
      () => act(final, "p2", { type: "rematch" }),
      "FORBIDDEN",
    );

    const rematch = act(final, final.hostId, { type: "rematch" });
    expect(rematch.phase).toBe("lobby");
    expect(rematch.players).toHaveLength(3);
    expect(rematch.players.every((player) => player.score === 0)).toBe(true);
    expect(rematch.round).toBeNull();
    expect(rematch.roundNumber).toBe(0);
    expect(rematch.roundWins).toEqual({ crew: 0, imposters: 0 });
    expect(rematch.history).toEqual([]);
    expect(rematch.usedWords).toEqual([]);
    expect(rematch.finalOutcome).toBeNull();
    expect(rematch.deadline).toBeNull();
  });
});

describe("lobby and host controls", () => {
  it("lets the host tune the rules, then seals them when the wake begins", () => {
    let room = act(makeRoom(10), "p1", {
      type: "updateSettings",
      settings: { imposterCount: 3, rounds: 7, packId: "food" },
    });

    expect(room.settings.imposterCount).toBe(3);
    expect(room.settings.rounds).toBe(7);
    expect(room.settings.packId).toBe("food");

    expectCode(
      () =>
        act(room, "p2", {
          type: "updateSettings",
          settings: { rounds: 4 },
        }),
      "FORBIDDEN",
    );

    room = act(room, "p1", { type: "startGame" });
    expectCode(
      () =>
        act(room, "p1", {
          type: "updateSettings",
          settings: { rounds: 4 },
        }),
      "WRONG_PHASE",
    );
  });

  it("removes kicked guests and rescales the imposter count", () => {
    let room = act(makeRoom(10), "p1", {
      type: "updateSettings",
      settings: { imposterCount: 3 },
    });

    expect(room.settings.imposterCount).toBe(3);

    room = act(room, "p1", { type: "kick", playerId: "p10" });
    expect(room.players).toHaveLength(9);
    expect(room.settings.imposterCount).toBe(3);

    expectCode(
      () => act(room, "p2", { type: "kick", playerId: "p3" }),
      "FORBIDDEN",
    );
    expectCode(
      () => act(room, "p1", { type: "kick", playerId: "p99" }),
      "INVALID_TARGET",
    );

    for (const playerId of ["p9", "p8", "p7", "p6"]) {
      room = act(room, "p1", { type: "kick", playerId });
    }

    expect(room.players).toHaveLength(5);
    expect(room.settings.imposterCount).toBe(1);
  });

  it("hands the host's chair to a guest only when the host is away", () => {
    const room = startedRoom(4);

    expectCode(
      () => act(room, "p2", { type: "claimHost" }),
      "FORBIDDEN",
    );

    const claimed = act(room, "p2", { type: "claimHost" }, TEST_NOW, false);
    expect(claimed.hostId).toBe("p2");
    expect(claimed.players.some((player) => "isHost" in player)).toBe(false);
  });

  it("forbids leaving a round in progress", () => {
    const room = startedRoom(4);
    expectCode(
      () => act(room, "p2", { type: "leave" }),
      "WRONG_PHASE",
    );
  });

  it("passes the host to the next guest when the host leaves the lobby", () => {
    const room = act(makeRoom(4), "p1", { type: "leave" });
    expect(room.players.map((player) => player.id)).toEqual(["p2", "p3", "p4"]);
    expect(room.hostId).toBe("p2");
  });
});
