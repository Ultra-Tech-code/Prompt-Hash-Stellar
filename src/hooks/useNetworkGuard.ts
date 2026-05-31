import { useMemo } from "react";
import { useWallet } from "./useWallet";
import { stellarNetwork } from "@/lib/env";

export interface NetworkGuardResult {
  isConnected: boolean;
  isCorrectNetwork: boolean;
  walletNetworkName: string;
  appNetworkName: string;
  guardMessage: string | null;
  guardSeverity: "error" | "warning" | "none";
}

const formatNetworkName = (name: string) =>
  name === "STANDALONE"
    ? "Local"
    : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

const EXPECTED_NETWORK = formatNetworkName(stellarNetwork);

export function useNetworkGuard(): NetworkGuardResult {
  const { address, network } = useWallet();

  return useMemo(() => {
    const isConnected = Boolean(address);
    const walletNetworkName = network ? formatNetworkName(network) : "";
    const isCorrectNetwork =
      isConnected && walletNetworkName === EXPECTED_NETWORK;

    if (!isConnected) {
      return {
        isConnected: false,
        isCorrectNetwork: false,
        walletNetworkName: "",
        appNetworkName: EXPECTED_NETWORK,
        guardMessage: "Connect a Stellar wallet to continue.",
        guardSeverity: "warning",
      };
    }

    if (!isCorrectNetwork) {
      return {
        isConnected: true,
        isCorrectNetwork: false,
        walletNetworkName,
        appNetworkName: EXPECTED_NETWORK,
        guardMessage: `Wallet is on ${walletNetworkName}. Switch to ${EXPECTED_NETWORK} in your wallet extension.`,
        guardSeverity: "error",
      };
    }

    return {
      isConnected: true,
      isCorrectNetwork: true,
      walletNetworkName,
      appNetworkName: EXPECTED_NETWORK,
      guardMessage: null,
      guardSeverity: "none",
    };
  }, [address, network]);
}
