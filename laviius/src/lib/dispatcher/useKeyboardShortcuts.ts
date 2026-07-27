"use client";

import { useEffect, useRef } from "react";

interface ShortcutHandlers {
  onSearch?: () => void;
  onNewShipment?: () => void;
  onAssignCarrier?: () => void;
  onOpenMap?: () => void;
  onOpenTimeline?: () => void;
  onEscape?: () => void;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

/**
 * Global shortcuts per the console spec: `/` search, `N` new shipment,
 * `A` assign carrier, `M` map, `T` timeline, `Esc` close drawer.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const current = handlersRef.current;

      if (event.key === "Escape") {
        current.onEscape?.();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      switch (event.key.toLowerCase()) {
        case "/":
          event.preventDefault();
          current.onSearch?.();
          break;
        case "n":
          current.onNewShipment?.();
          break;
        case "a":
          current.onAssignCarrier?.();
          break;
        case "m":
          current.onOpenMap?.();
          break;
        case "t":
          current.onOpenTimeline?.();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
