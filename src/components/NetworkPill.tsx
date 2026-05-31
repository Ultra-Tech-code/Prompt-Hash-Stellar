import React from "react";
import { Icon } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { stellarNetwork } from "../lib/env";
import { AlertTriangle } from "lucide-react";

const formatNetworkName = (name: string) =>
  name === "STANDALONE"
    ? "Local"
    : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

const appNetwork = formatNetworkName(stellarNetwork);

const bgColor = "#F0F2F5";
const textColor = "#4A5362";

const NetworkPill: React.FC = () => {
  const { network, address } = useWallet();

  const walletNetwork = formatNetworkName(network ?? "");
  const isNetworkMismatch = walletNetwork !== appNetwork;

  let title = "";
  let color = "#2ED06E";
  let showWarning = false;
  if (!address) {
    title = "Connect your wallet using this network.";
    color = "#C1C7D0";
  } else if (isNetworkMismatch) {
    title = `Wallet is on ${walletNetwork}, switch to ${appNetwork} in your wallet extension.`;
    color = "#FF3B30";
    showWarning = true;
  }

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
        padding: "4px 10px",
        borderRadius: "16px",
        fontSize: "12px",
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        cursor: isNetworkMismatch ? "help" : "default",
      }}
      title={title}
      role="status"
      aria-label={title}
    >
      {showWarning ? (
        <AlertTriangle className="h-3 w-3 shrink-0" style={{ color }} />
      ) : (
        <Icon.Circle color={color} />
      )}
      {appNetwork}
    </div>
  );
};

export default NetworkPill;
