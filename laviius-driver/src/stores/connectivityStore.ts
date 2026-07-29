import NetInfo from "@react-native-community/netinfo";
import { create } from "zustand";

interface ConnectivityState {
  isOnline: boolean;
  isInitialized: boolean;
  setOnline: (online: boolean) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isOnline: true,
  isInitialized: false,
  setOnline: (online) => set({ isOnline: online, isInitialized: true }),
}));

/** Call once from the root layout. Keeps the store in sync with the OS
 * network state so the whole app can render offline banners / gate sync. */
export function initConnectivityListener() {
  return NetInfo.addEventListener((state) => {
    const online = Boolean(state.isConnected && state.isInternetReachable !== false);
    useConnectivityStore.getState().setOnline(online);
  });
}
