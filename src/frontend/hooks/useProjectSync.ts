"use client";

import { useEffect, useRef } from "react";
import { KanbanTask } from "@/frontend/components/kanban/types";

interface SyncHandlers {
  onTaskCreated: (task: KanbanTask) => void;
  onTaskUpdated: (task: KanbanTask) => void;
  onTaskDeleted: (payload: { id: string }) => void;
}

export function useProjectSync(projectId: string, handlers: SyncHandlers) {
  // Keep handlers in a ref so the effect never needs to re-run when they change
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let dead = false;

    function connect() {
      if (dead) return;
      es = new EventSource(`/api/projects/${projectId}/stream`);

      es.addEventListener("task:created", (e) => {
        try { handlersRef.current.onTaskCreated(JSON.parse(e.data)); } catch { /* ignore parse error */ }
      });

      es.addEventListener("task:updated", (e) => {
        try { handlersRef.current.onTaskUpdated(JSON.parse(e.data)); } catch { /* ignore parse error */ }
      });

      es.addEventListener("task:deleted", (e) => {
        try { handlersRef.current.onTaskDeleted(JSON.parse(e.data)); } catch { /* ignore parse error */ }
      });

      es.onerror = () => {
        es?.close();
        es = null;
        // Reconnect after 3 seconds on error
        if (!dead) retryTimeout = setTimeout(connect, 3_000);
      };
    }

    connect();

    return () => {
      dead = true;
      clearTimeout(retryTimeout);
      es?.close();
    };
  }, [projectId]);
}
