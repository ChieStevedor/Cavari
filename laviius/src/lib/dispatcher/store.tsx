"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { ActionFeedItem, Carrier, Customer, KpiMetric, OperationalAlert, Shipment } from "@/types/dispatcher";
import { generateDispatcherSnapshot } from "./mockData";

export type DrawerTab = "summary" | "timeline" | "carrier" | "communication" | "documents";

interface Toast {
  id: string;
  tone: "success" | "info" | "error";
  message: string;
}

interface DispatcherState {
  status: "loading" | "ready";
  shipments: Shipment[];
  carriers: Carrier[];
  customers: Customer[];
  actionFeed: ActionFeedItem[];
  alerts: OperationalAlert[];
  kpis: KpiMetric[];
  selectedShipmentId: string | null;
  drawerTab: DrawerTab;
  searchOpen: boolean;
  pinnedIds: string[];
  toasts: Toast[];
}

type Action =
  | { type: "SNAPSHOT_LOADED"; snapshot: ReturnType<typeof generateDispatcherSnapshot> }
  | { type: "OPEN_SHIPMENT"; id: string; tab?: DrawerTab }
  | { type: "CLOSE_DRAWER" }
  | { type: "SET_DRAWER_TAB"; tab: DrawerTab }
  | { type: "DISMISS_FEED_ITEM"; id: string }
  | { type: "ASSIGN_CARRIER"; shipmentId: string; carrierId: string }
  | { type: "GENERATE_INVOICE"; shipmentId: string }
  | { type: "TOGGLE_PIN"; shipmentId: string }
  | { type: "ADD_NOTE"; shipmentId: string; note: string }
  | { type: "SEND_MESSAGE"; shipmentId: string; channel: "customer" | "carrier" | "driver" | "internal"; body: string }
  | { type: "OPEN_SEARCH" }
  | { type: "CLOSE_SEARCH" }
  | { type: "MARK_ALERTS_READ" }
  | { type: "DISMISS_ALERT"; id: string }
  | { type: "PUSH_TOAST"; toast: Toast }
  | { type: "DISMISS_TOAST"; id: string }
  | { type: "TICK" };

const initialState: DispatcherState = {
  status: "loading",
  shipments: [],
  carriers: [],
  customers: [],
  actionFeed: [],
  alerts: [],
  kpis: [],
  selectedShipmentId: null,
  drawerTab: "summary",
  searchOpen: false,
  pinnedIds: [],
  toasts: [],
};

function reducer(state: DispatcherState, action: Action): DispatcherState {
  switch (action.type) {
    case "SNAPSHOT_LOADED":
      return { ...state, status: "ready", ...action.snapshot };

    case "OPEN_SHIPMENT":
      return { ...state, selectedShipmentId: action.id, drawerTab: action.tab ?? "summary" };

    case "CLOSE_DRAWER":
      return { ...state, selectedShipmentId: null };

    case "SET_DRAWER_TAB":
      return { ...state, drawerTab: action.tab };

    case "DISMISS_FEED_ITEM":
      return { ...state, actionFeed: state.actionFeed.filter((item) => item.id !== action.id) };

    case "ASSIGN_CARRIER": {
      const carrier = state.carriers.find((c) => c.id === action.carrierId);
      if (!carrier) return state;
      const driver = carrier.drivers.find((d) => d.status === "available") ?? carrier.drivers[0];
      return {
        ...state,
        shipments: state.shipments.map((s) =>
          s.id === action.shipmentId
            ? {
                ...s,
                status: "assigned",
                assignedCarrier: carrier,
                assignedDriver: driver,
                dispatcherName: s.dispatcherName ?? "You",
                timeline: [
                  ...s.timeline,
                  {
                    id: `tl-assign-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    label: "Carrier Offer Sent",
                    actorName: "You",
                    actorRole: "Dispatcher",
                    source: "dispatcher" as const,
                  },
                ],
              }
            : s,
        ),
        actionFeed: state.actionFeed.filter(
          (item) => !(item.shipmentId === action.shipmentId && item.type === "waiting_assignment"),
        ),
        toasts: [
          ...state.toasts,
          { id: `toast-${Date.now()}`, tone: "success", message: `${carrier.name} offered the load — awaiting acceptance.` },
        ],
      };
    }

    case "GENERATE_INVOICE":
      return {
        ...state,
        shipments: state.shipments.map((s) => (s.id === action.shipmentId ? { ...s, billingStatus: "invoiced" } : s)),
        actionFeed: state.actionFeed.filter(
          (item) => !(item.shipmentId === action.shipmentId && item.type === "ready_to_invoice"),
        ),
        toasts: [...state.toasts, { id: `toast-${Date.now()}`, tone: "success", message: "Invoice generated and sent to billing." }],
      };

    case "TOGGLE_PIN":
      return {
        ...state,
        pinnedIds: state.pinnedIds.includes(action.shipmentId)
          ? state.pinnedIds.filter((id) => id !== action.shipmentId)
          : [...state.pinnedIds, action.shipmentId],
      };

    case "ADD_NOTE":
      return {
        ...state,
        shipments: state.shipments.map((s) =>
          s.id === action.shipmentId ? { ...s, internalNotes: [...s.internalNotes, action.note] } : s,
        ),
      };

    case "SEND_MESSAGE": {
      const message = {
        id: `msg-${Date.now()}`,
        channel: action.channel,
        authorName: "You",
        authorRole: "Dispatcher",
        body: action.body,
        timestamp: new Date().toISOString(),
      };
      return {
        ...state,
        shipments: state.shipments.map((s) =>
          s.id === action.shipmentId ? { ...s, messages: [...s.messages, message] } : s,
        ),
      };
    }

    case "OPEN_SEARCH":
      return { ...state, searchOpen: true };

    case "CLOSE_SEARCH":
      return { ...state, searchOpen: false };

    case "MARK_ALERTS_READ":
      return { ...state, alerts: state.alerts.map((a) => ({ ...a, read: true })) };

    case "DISMISS_ALERT":
      return { ...state, alerts: state.alerts.filter((a) => a.id !== action.id) };

    case "PUSH_TOAST":
      return { ...state, toasts: [...state.toasts, action.toast] };

    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    case "TICK": {
      // Lightweight real-time simulation: nudge ETAs down and occasionally
      // flip a driver-en-route shipment closer to delivery. Keeps the
      // console feeling alive without a real telemetry feed.
      return {
        ...state,
        shipments: state.shipments.map((s) =>
          s.status === "driver_en_route" && typeof s.etaMinutes === "number"
            ? { ...s, etaMinutes: Math.max(1, s.etaMinutes - 1) }
            : s,
        ),
      };
    }

    default:
      return state;
  }
}

interface DispatcherContextValue extends DispatcherState {
  dispatch: React.Dispatch<Action>;
  selectedShipment: Shipment | null;
  openShipment: (id: string, tab?: DrawerTab) => void;
  closeDrawer: () => void;
  setDrawerTab: (tab: DrawerTab) => void;
  dismissFeedItem: (id: string) => void;
  assignCarrier: (shipmentId: string, carrierId: string) => void;
  generateInvoice: (shipmentId: string) => void;
  togglePin: (shipmentId: string) => void;
  addNote: (shipmentId: string, note: string) => void;
  sendMessage: (shipmentId: string, channel: "customer" | "carrier" | "driver" | "internal", body: string) => void;
  openSearch: () => void;
  closeSearch: () => void;
  pushToast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
  markAlertsRead: () => void;
  dismissAlert: (id: string) => void;
}

const DispatcherContext = createContext<DispatcherContextValue | null>(null);

export function DispatcherProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Seeded after mount only — mock generation uses Math.random and must
    // never run during server render.
    const snapshot = generateDispatcherSnapshot();
    dispatch({ type: "SNAPSHOT_LOADED", snapshot });
  }, []);

  useEffect(() => {
    if (state.status !== "ready") return;
    tickRef.current = setInterval(() => dispatch({ type: "TICK" }), 20_000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [state.status]);

  const pushToast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    dispatch({ type: "PUSH_TOAST", toast: { id, tone, message } });
    setTimeout(() => dispatch({ type: "DISMISS_TOAST", id }), 4000);
  }, []);

  const value: DispatcherContextValue = useMemo(
    () => ({
      ...state,
      dispatch,
      selectedShipment: state.shipments.find((s) => s.id === state.selectedShipmentId) ?? null,
      openShipment: (id, tab) => dispatch({ type: "OPEN_SHIPMENT", id, tab }),
      closeDrawer: () => dispatch({ type: "CLOSE_DRAWER" }),
      setDrawerTab: (tab) => dispatch({ type: "SET_DRAWER_TAB", tab }),
      dismissFeedItem: (id) => dispatch({ type: "DISMISS_FEED_ITEM", id }),
      assignCarrier: (shipmentId, carrierId) => dispatch({ type: "ASSIGN_CARRIER", shipmentId, carrierId }),
      generateInvoice: (shipmentId) => dispatch({ type: "GENERATE_INVOICE", shipmentId }),
      togglePin: (shipmentId) => dispatch({ type: "TOGGLE_PIN", shipmentId }),
      addNote: (shipmentId, note) => dispatch({ type: "ADD_NOTE", shipmentId, note }),
      sendMessage: (shipmentId, channel, body) => dispatch({ type: "SEND_MESSAGE", shipmentId, channel, body }),
      openSearch: () => dispatch({ type: "OPEN_SEARCH" }),
      closeSearch: () => dispatch({ type: "CLOSE_SEARCH" }),
      pushToast,
      dismissToast: (id) => dispatch({ type: "DISMISS_TOAST", id }),
      markAlertsRead: () => dispatch({ type: "MARK_ALERTS_READ" }),
      dismissAlert: (id) => dispatch({ type: "DISMISS_ALERT", id }),
    }),
    [state, pushToast],
  );

  return <DispatcherContext.Provider value={value}>{children}</DispatcherContext.Provider>;
}

export function useDispatcher(): DispatcherContextValue {
  const ctx = useContext(DispatcherContext);
  if (!ctx) throw new Error("useDispatcher must be used within DispatcherProvider");
  return ctx;
}
