import React, { useState, useContext, useEffect, useRef } from "react";
import { WalletContext } from "../../providers/WalletProvider";
import { useAsyncTransaction } from "../../components/useAsyncTransaction";
import { PromptHashClient } from "../../lib/stellar/promptHashClient";
import { unlockPrompt } from "../../lib/prompts/unlock";
import { Skeleton } from "../../components/Skeleton";
import { StatusBanner } from "../../components/StatusBanner";
import { UnlockExplainer } from "../../components/UnlockExplainer";
import { TransactionTimeline } from "../../components/TransactionTimeline";
import { useNetworkGuard } from "../../hooks/useNetworkGuard";
import {
  CheckCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Wallet,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { ReviewForm } from "../../components/prompts/ReviewForm";
import { ReviewList } from "../../components/prompts/ReviewList";
import { StarRating } from "../../components/prompts/StarRating";
import { ReviewClient } from "../../lib/reviews/reviewClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type BuyerStatus =
  | "IDLE"
  | "AWAITING_APPROVAL"
  | "CONFIRMING"
  | "PURCHASED_LOCKED"
  | "UNLOCKING"
  | "SUCCESS"
  | "ERROR";

interface PromptModalProps {
  itemId: string;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  itemId,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const wallet = useContext(WalletContext);
  const queryClient = useQueryClient();
  const networkGuard = useNetworkGuard();

  const [status, setStatus] = useState<BuyerStatus>("IDLE");
  const [txHash, setTxHash] = useState<string>("");
  const [secretContent, setSecretContent] = useState<string>("");
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch reviews for this prompt
  const { data: reviewData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", itemId],
    queryFn: () => ReviewClient.getReviews(itemId),
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 0);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && wallet?.address) {
      setIsCheckingAccess(true);
      PromptHashClient.checkAccess(itemId, wallet.address)
        .then((hasAccess) => setStatus(hasAccess ? "PURCHASED_LOCKED" : "IDLE"))
        .catch(() => setStatus("IDLE"))
        .finally(() => setIsCheckingAccess(false));
    }
  }, [isOpen, itemId, wallet?.address]);

  const {
    execute: runUnlock,
    isLoading: isUnlocking,
    error: unlockError,
  } = useAsyncTransaction(
    async (hash: string) => {
      if (!wallet?.signMessage || !wallet.address)
        throw new Error("Wallet not connected");
      return await unlockPrompt(
        itemId,
        hash,
        wallet.signMessage,
        wallet.address,
      );
    },
    {
      onOptimistic: () => setStatus("UNLOCKING"),
      onSuccess: (data) => {
        setSecretContent(data.decryptedContent);
        setStatus("SUCCESS");
      },
      onError: () => setStatus("PURCHASED_LOCKED"),
    },
  );

  const {
    execute: runPurchase,
    isLoading: isPurchasing,
    error: purchaseError,
  } = useAsyncTransaction(
    async () => {
      if (!wallet?.address) throw new Error("Wallet connection required.");
      setStatus("AWAITING_APPROVAL");
      const mockHash = "tx_" + Math.random().toString(16).slice(2, 14);
      setTxHash(mockHash);
      setStatus("CONFIRMING");
      return await PromptHashClient.purchasePrompt(itemId, wallet.address);
    },
    {
      onSuccess: (data) => {
        setStatus("UNLOCKING");
        onRefresh?.();
        runUnlock(data.txHash || txHash).catch(() => {});
      },
      onError: () => setStatus("ERROR"),
    },
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md sm:p-4">
      <div
        className="relative max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-white/10 bg-slate-900 shadow-2xl sm:rounded-[32px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-modal-title"
        aria-describedby="prompt-modal-description"
      >
        {/* Header Decor */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 to-blue-500" />

        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white transition-all z-10"
          aria-label="Close prompt modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 sm:p-8">
          <div className="mb-6 sm:mb-8">
            <h2
              id="prompt-modal-title"
              className="mb-2 text-2xl font-bold text-white"
            >
              Acquire License
            </h2>
            <p id="prompt-modal-description" className="text-sm text-slate-400">
              Unlock high-quality prompt content via Stellar smart contract.
            </p>
          </div>

          {isCheckingAccess ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="h-14 w-full bg-white/5 rounded-2xl animate-pulse mt-8" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Network mismatch guard */}
              {networkGuard.guardSeverity === "error" && (
                <div className="p-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 flex gap-3 items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-200">
                    <p className="font-semibold">Network mismatch</p>
                    <p className="text-xs text-amber-300/80 mt-1">
                      {networkGuard.guardMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* TRANSACTION STAGES */}
              {(status === "IDLE" || status === "ERROR") && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-start">
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Secure Purchase
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">
                        Funds are held by the contract until access rights are
                        minted. Platform fee is included in the price.
                      </p>
                    </div>
                  </div>

                  {status === "ERROR" && purchaseError && (
                    <StatusBanner
                      status="error"
                      message={purchaseError.message}
                    />
                  )}

                  <button
                    onClick={() => runPurchase()}
                    disabled={
                      isPurchasing || networkGuard.guardSeverity === "error"
                    }
                    className="group w-full h-14 bg-white text-slate-950 hover:bg-emerald-400 font-black rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Confirm & Purchase <Wallet className="w-4 h-4" />
                  </button>
                </div>
              )}

              {status === "AWAITING_APPROVAL" && (
                <div className="py-6">
                  <TransactionTimeline
                    steps={[
                      {
                        id: "approve",
                        label: "Wallet approval",
                        status: "active",
                        description: "Confirm the transaction in your wallet",
                      },
                      {
                        id: "submit",
                        label: "Transaction submitted",
                        status: "pending",
                      },
                      {
                        id: "confirm",
                        label: "Confirmation pending",
                        status: "pending",
                      },
                      { id: "complete", label: "Completed", status: "pending" },
                    ]}
                  />
                </div>
              )}

              {status === "CONFIRMING" && (
                <div className="py-6">
                  <TransactionTimeline
                    steps={[
                      {
                        id: "approve",
                        label: "Wallet approval",
                        status: "completed",
                      },
                      {
                        id: "submit",
                        label: "Transaction submitted",
                        status: "active",
                        description: "Broadcasting to Stellar...",
                      },
                      {
                        id: "confirm",
                        label: "Confirmation pending",
                        status: "pending",
                      },
                      { id: "complete", label: "Completed", status: "pending" },
                    ]}
                  />
                  {txHash && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-xs text-slate-500 hover:text-emerald-400 font-mono transition-colors"
                    >
                      View Transaction <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {status === "PURCHASED_LOCKED" && (
                <div className="space-y-6">
                  <TransactionTimeline
                    steps={[
                      {
                        id: "approve",
                        label: "Wallet approval",
                        status: "completed",
                      },
                      {
                        id: "submit",
                        label: "Transaction submitted",
                        status: "completed",
                      },
                      {
                        id: "confirm",
                        label: "Confirmation pending",
                        status: "completed",
                      },
                      {
                        id: "unlock",
                        label: "Unlocking content",
                        status: "active",
                        description: "Sign with your wallet to decrypt",
                      },
                    ]}
                  />

                  <UnlockExplainer
                    state={
                      isUnlocking
                        ? "signing"
                        : unlockError
                          ? "failed"
                          : "signing"
                    }
                    onRetry={
                      unlockError
                        ? () => runUnlock(txHash || "existing")
                        : undefined
                    }
                  />

                  {unlockError && (
                    <StatusBanner
                      status="error"
                      message={unlockError.message}
                    />
                  )}

                  <button
                    onClick={() => runUnlock(txHash || "existing")}
                    disabled={isUnlocking}
                    className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                  >
                    {isUnlocking ? "Unlocking..." : "Decrypt Content"}
                  </button>
                </div>
              )}

              {status === "SUCCESS" && (
                <div className="animate-in fade-in zoom-in duration-300">
                  <div className="pb-4">
                    <TransactionTimeline
                      steps={[
                        {
                          id: "approve",
                          label: "Wallet approval",
                          status: "completed",
                        },
                        {
                          id: "submit",
                          label: "Transaction submitted",
                          status: "completed",
                        },
                        {
                          id: "confirm",
                          label: "Confirmation pending",
                          status: "completed",
                        },
                        {
                          id: "unlock",
                          label: "Content decrypted",
                          status: "completed",
                        },
                      ]}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-4">
                    <CheckCircle className="h-5 w-5" /> Access Granted
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition" />
                    <div className="relative bg-black border border-white/5 rounded-xl p-6 max-h-[300px] overflow-y-auto">
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                        {secretContent}
                      </pre>
                    </div>
                  </div>

                  {/* Review Section */}
                  {wallet?.address && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      {!showReviewForm ? (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="w-full flex items-center justify-center gap-2 h-12 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Write a Review
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-white">
                            Share Your Experience
                          </h4>
                          <ReviewForm
                            promptId={itemId}
                            onSubmit={async (review) => {
                              await ReviewClient.submitReview(
                                itemId,
                                wallet.address!,
                                review.rating,
                                review.text,
                              );
                              queryClient.invalidateQueries({
                                queryKey: ["reviews", itemId],
                              });
                              queryClient.invalidateQueries({
                                queryKey: ["review-stats", itemId],
                              });
                              setShowReviewForm(false);
                            }}
                            onCancel={() => setShowReviewForm(false)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full mt-6 h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
                  >
                    Back to Marketplace
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reviews Tab */}
        {reviewData && (
          <div className="border-t border-white/10 p-5 sm:p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Reviews</h3>
                {reviewData.stats.total > 0 && (
                  <div className="flex items-center gap-3">
                    <StarRating
                      rating={reviewData.stats.averageRating}
                      readonly
                      size="md"
                    />
                    <span className="text-sm text-slate-400">
                      {reviewData.stats.averageRating.toFixed(1)} out of 5
                    </span>
                  </div>
                )}
              </div>
            </div>
            <ReviewList
              reviews={reviewData.reviews}
              isLoading={reviewsLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};
