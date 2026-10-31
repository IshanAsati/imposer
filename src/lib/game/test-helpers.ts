import { applyGameAction, createRoomState } from "./engine";
import type {
  GameAction,
  GameSettings,
  RoomState,
  VoteTarget,
} from "./types";

export const TEST_NOW = Date.UTC(2026, 9, 30, 20, 0, 0);

export function testRng(): number {
  return 0.42;
}

export function makeRoom(
  count = 5,
  settings: Partial<GameSettings> = {},
): RoomState {
  const room = createRoomState({
    code: "ABC234",
    roomId: "room-test",
    host: { id: "p1", name: "Host", avatar: "moth" },
    now: TEST_NOW,
    settings,
  });

  for (let index = 2; index <= count; index += 1) {
    room.players.push({
      id: `p${index}`,
      name: `Guest ${index}`,
      avatar: "crow",
      joinedAt: TEST_NOW,
      score: 0,
    });
  }

  return room;
}

export function act(
  room: RoomState,
  actorId: string,
  action: GameAction,
  now = TEST_NOW,
  hostOnline = true,
): RoomState {
  return applyGameAction(room, actorId, action, {
    now,
    rng: testRng,
    hostOnline,
  });
}

export function startedRoom(
  count = 5,
  settings: Partial<GameSettings> = {},
): RoomState {
  return act(makeRoom(count, settings), "p1", { type: "startGame" });
}

export function toDiscussion(room: RoomState): RoomState {
  let next = room;

  for (const player of next.players) {
    next = act(next, player.id, { type: "ready" });
  }

  const round = next.round;
  if (!round || next.phase !== "clues") {
    return next;
  }

  for (const [index, playerId] of round.clueOrder.entries()) {
    next = act(next, playerId, {
      type: "submitClue",
      clue: `clue${index + 1}`,
    });
  }

  return next;
}

export function toVoting(room: RoomState): RoomState {
  let next = toDiscussion(room);
  if (next.phase === "discussion") {
    next = act(next, next.hostId, { type: "startVote" });
  }
  return next;
}

export function voteAll(
  room: RoomState,
  targetFor: VoteTarget | ((playerId: string) => VoteTarget),
): RoomState {
  let next = room;

  for (const player of [...next.players]) {
    if (next.phase !== "voting" && next.phase !== "runoff") {
      break;
    }
    const target =
      typeof targetFor === "function" ? targetFor(player.id) : targetFor;
    next = act(next, player.id, { type: "vote", targetId: target });
  }

  return next;
}
