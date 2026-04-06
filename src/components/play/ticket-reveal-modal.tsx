"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type RevealResult = {
  ticketId: string;
  ticketSerialNumber: number;
  letter: string;
  lotLabel: string;
  lotImageUrl?: string | null;
  remainingDraws: number;
};

type TicketRevealModalProps = {
  isOpen: boolean;
  sessionCode: string;
  ticketId: string | null;
  onClose: () => void;
  onResolved: (result: RevealResult) => void;
};

const IDLE_VIDEO_SRC = "/reveal/reveal_idle.mp4";

const REVEAL_VIDEO_BY_LETTER: Record<string, string> = {
  A: "/reveal/reveal_a.mp4",
  B: "/reveal/reveal_b.mp4",
  C: "/reveal/reveal_c.mp4",
  D: "/reveal/reveal_d.mp4",
  E: "/reveal/reveal_e.mp4",
  F: "/reveal/reveal_f.mp4",
  G: "/reveal/reveal_g.mp4"
};

export function TicketRevealModal({
  isOpen,
  sessionCode,
  ticketId,
  onClose,
  onResolved
}: TicketRevealModalProps) {
  const [step, setStep] = useState<"idle" | "video" | "revealed">("idle");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RevealResult | null>(null);
  const [error, setError] = useState("");

  const consumedTicketRef = useRef<string | null>(null);
  const preloadVideoRef = useRef<HTMLVideoElement | null>(null);

  const revealVideoSrc = useMemo(() => {
    if (!result) return "";
    return REVEAL_VIDEO_BY_LETTER[result.letter.toUpperCase()] || IDLE_VIDEO_SRC;
  }, [result]);

  function getLetterClass(letter: string) {
    switch (letter.toUpperCase()) {
      case "A":
        return "letter-a";
      case "B":
        return "letter-b";
      case "C":
        return "letter-c";
      case "D":
        return "letter-d";
      case "E":
        return "letter-e";
      case "F":
        return "letter-f";
      case "G":
        return "letter-g";
      default:
        return "letter-default";
    }
  }

  useEffect(() => {
    if (!isOpen || !ticketId) return;

    if (consumedTicketRef.current === ticketId) {
      return;
    }

    let cancelled = false;

    async function consumeTicket() {
      try {
        consumedTicketRef.current = ticketId;
        setLoading(true);
        setError("");
        setResult(null);
        setStep("idle");

        const response = await fetch("/api/play/open-ticket", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            accessCode: sessionCode,
            ticketId
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Impossible d’ouvrir ce ticket.");
        }

        if (cancelled) return;

        const payload: RevealResult = {
          ticketId: data.ticketId,
          ticketSerialNumber: data.ticketSerialNumber,
          letter: data.letter,
          lotLabel: data.lotLabel,
          lotImageUrl: data.lotImageUrl ?? null,
          remainingDraws: data.remainingDraws
        };

        setResult(payload);
        onResolved(payload);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erreur inconnue.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    consumeTicket();

    return () => {
      cancelled = true;
    };
  }, [isOpen, ticketId, sessionCode, onResolved]);

  useEffect(() => {
    if (!isOpen || !result || !revealVideoSrc || step !== "idle") return;

    const video = document.createElement("video");
    video.src = revealVideoSrc;
    video.preload = "auto";
    video.playsInline = true;
    video.load();

    preloadVideoRef.current = video;

    return () => {
      preloadVideoRef.current = null;
    };
  }, [isOpen, result, revealVideoSrc, step]);

  function resetAndClose() {
    consumedTicketRef.current = null;
    setResult(null);
    setStep("idle");
    setError("");
    onClose();
  }

  function handleIdleClick() {
    if (loading || !result) return;
    setStep("video");
  }

  function handleRevealVideoFinished() {
    setStep("revealed");
  }

  if (!isOpen || !ticketId) return null;

  if (error) {
    return (
      <div className="reveal-overlay">
        <div className="reveal-result-wrap">
          <div className="reveal-result-card">
            <div className="stack center">
              <p className="notice notice-error">{error}</p>
              <button className="button" type="button" onClick={resetAndClose}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "video" && result) {
    return (
      <div className="reveal-overlay reveal-overlay-full">
        <div className="reveal-video-stage">
          <video
            key={revealVideoSrc}
            className="reveal-full-video"
            src={revealVideoSrc}
            autoPlay
            playsInline
            preload="auto"
            onEnded={handleRevealVideoFinished}
            onError={handleRevealVideoFinished}
          />
          <button
            type="button"
            className="reveal-skip-button"
            onClick={handleRevealVideoFinished}
          >
            Passer
          </button>
        </div>
      </div>
    );
  }

  if (step === "revealed" && result) {
    return (
      <div className="reveal-overlay">
        <div className="reveal-result-wrap">
          <button className="reveal-button" type="button" onClick={resetAndClose}>
            <div className="reveal-result-card reveal-result-card-clean">
              <div className="ticket-visual reveal-result-visual-clean">
                <Image
                  src="/tickets/open-ticket.png"
                  alt="Ticket ouvert"
                  fill
                  className="ticket-image"
                  priority
                />
                <div className={`revealed-letter ${getLetterClass(result.letter)}`}>
                  {result.letter}
                </div>
              </div>

              {result.lotImageUrl ? (
                <div className="reveal-lot-image-wrap">
                  <img src={result.lotImageUrl} alt={result.lotLabel} className="reveal-lot-image" />
                </div>
              ) : null}

              <div className="reveal-result-meta reveal-result-meta-clean">
                <span className="badge badge-success">Lot obtenu</span>
                <h2 className="reveal-result-title">{result.lotLabel}</h2>
                <p className="subtitle">Touchez pour continuer</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reveal-overlay reveal-overlay-full">
      <button
        className="reveal-idle-stage"
        type="button"
        onClick={handleIdleClick}
      >
        <video
          className="reveal-full-video"
          src={IDLE_VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />

        <div className="reveal-idle-content">
          <span className="badge">Ticket sélectionné</span>
          <h2 className="reveal-idle-title">
            {loading ? "Préparation du reveal..." : "Touchez pour lancer le reveal"}
          </h2>
          <p className="reveal-idle-subtitle">
            {loading
              ? "Le tirage et la vidéo du lot sont en préparation."
              : "La vidéo du lot correspondant est prête."}
          </p>
        </div>
      </button>
    </div>
  );
}