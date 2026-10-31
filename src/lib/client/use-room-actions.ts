"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { GameAction } from "@/lib/game/types";
import {
  ApiError,
  sendChatMessage,
  sendRoomAction,
} from "@/lib/client/api";
import { applyRoomView } from "@/lib/client/room-query";
import { useToast } from "@/components/ui/toaster";

interface UseRoomActionsOptions {
  code: string;
  token: string;
  onSessionLost: (message: string) => void;
}

export interface RoomActions {
  act: (action: GameAction) => Promise<boolean>;
  pendingType: GameAction["type"] | null;
  isPending: boolean;
  sendChat: (body: string) => Promise<boolean>;
  isChatPending: boolean;
}

export function useRoomActions({
  code,
  token,
  onSessionLost,
}: UseRoomActionsOptions): RoomActions {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const actionMutation = useMutation({
    mutationFn: (action: GameAction) => sendRoomAction(code, token, action),
    onSuccess: (view) => {
      if (view) {
        applyRoomView(queryClient, code, view);
      }
    },
  });

  const chatMutation = useMutation({
    mutationFn: (body: string) => sendChatMessage(code, token, body),
    onSuccess: (view) => {
      applyRoomView(queryClient, code, view);
    },
  });

  const handleError = useCallback(
    (error: unknown) => {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 404)
      ) {
        onSessionLost(error.message);
        return;
      }
      toast(
        error instanceof Error ? error.message : "The house refused.",
        "error",
      );
    },
    [onSessionLost, toast],
  );

  const act = useCallback(
    async (action: GameAction): Promise<boolean> => {
      try {
        await actionMutation.mutateAsync(action);
        return true;
      } catch (error) {
        handleError(error);
        return false;
      }
    },
    [actionMutation, handleError],
  );

  const sendChat = useCallback(
    async (body: string): Promise<boolean> => {
      try {
        await chatMutation.mutateAsync(body);
        return true;
      } catch (error) {
        handleError(error);
        return false;
      }
    },
    [chatMutation, handleError],
  );

  return {
    act,
    pendingType: actionMutation.isPending
      ? (actionMutation.variables?.type ?? null)
      : null,
    isPending: actionMutation.isPending,
    sendChat,
    isChatPending: chatMutation.isPending,
  };
}
