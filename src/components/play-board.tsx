"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TicketRevealModal } from "@/components/play/ticket-reveal-modal";

type TicketItem = {
  id: string;
  serialNumber: number;
  gridPosition: number;
  status: "available" | "opened";
};

type HistoryItem = {
  ticketSerialNumber: number;
  letter: string;
  lotLabel: string;
  lotImageUrl?: string | null;
};

type PlayBoardProps = {
  sessionCode: string;
  kujiName: string;
  initialRemainingDraws: number;
  gridColumns: number;
  initialTickets: TicketItem[];
  initialHistory: HistoryItem[];
};

type RevealResult = {
  ticketId: string;
  ticketSerialNumber: number;
  letter: string;
  lotLabel: string;
  lotImageUrl?: string | null;
  remainingDraws: number;
};

function getLetterChipClass(letter: string) {
  switch (letter.toUpperCase()) {
    case "A":
      return "letter-chip letter-chip-a";
    case "B":
      return "letter-chip letter-chip-b";
    case "C":
      return "letter-chip letter-chip-c";
    case "D":
      return "letter-chip letter-chip-d";
    case "E":
      return "letter-chip letter-chip-e";
    case "F":
      return "letter-chip letter-chip-f";
    case "G":
      return "letter-chip letter-chip-g";
    default:
      return "letter-chip";
  }
}

export function PlayBoard({
  sessionCode,
  kujiName,
  initialRemainingDraws,
  gridColumns,
  initialTickets,
  initialHistory
}: PlayBoardProps) {
  const router = useRouter();

  const [tickets, setTickets] = useState(initialTickets);
  const [remainingDraws, setRemainingDraws] = useState(initialRemainingDraws);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
  const [countdown, setCountdown] = useState(8);

  const sortedTickets = useMemo(
    () => [...tickets].sort((a, b) => a.gridPosition - b.gridPosition),
    [tickets]
  );

  const openedCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "opened").length,
    [tickets]
  );

  const finished = remainingDraws <= 0;

  useEffect(() => {
    if (!finished || selectedTicketId) return;

    setCountdown(8);

    const interval = window.setInterval(() => {
      setCountdown((current) => (current > 1 ? current - 1 : 1));
    }, 1000);

    const timeout = window.setTimeout(() => {
      router.push("/play");
    }, 8000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [finished, selectedTicketId, router]);

  const handleSelectTicket = useCallback((ticketId: string) => {
    setSelectedTicketId((current) => {
      if (current) return current;
      return ticketId;
    });
  }, []);

  const handleResolved = useCallback((result: RevealResult) => {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === result.ticketId
          ? { ...ticket, status: "opened" }
          : ticket
      )
    );

    setRemainingDraws(result.remainingDraws);
    setHistory((current) => [
      ...current,
      {
        ticketSerialNumber: result.ticketSerialNumber,
        letter: result.letter,
        lotLabel: result.lotLabel,
        lotImageUrl: result.lotImageUrl ?? null
      }
    ]);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTicketId(null);
  }, []);

  return (
    <div className="stack">
      <section className="card card-pad play-header">
        <div className="stack center">
          <span className={`badge ${finished ? "badge-success" : ""}`}>
            {finished ? "Session terminée" : `${remainingDraws} tirage(s) restant(s)`}
          </span>
          <h1 className="title">{kujiName}</h1>
          <p className="subtitle">
            Choisis un ticket disponible. Les tickets déjà ouverts sont grisés.
          </p>

          <div className="play-kpis">
            <div className="big-remaining">{remainingDraws}</div>
            <div className="subtitle">tirage(s) restant(s)</div>
          </div>

          <div className="form-actions center">
            <span className="badge">{openedCount} ouverts</span>
            <span className="badge">{tickets.length - openedCount} disponibles</span>
          </div>
        </div>
      </section>

      {history.length > 0 ? (
        <section className="card card-pad stack">
          <div>
            <h2 className="title">Résumé en cours</h2>
            <p className="subtitle">Les lots que tu as déjà obtenus.</p>
          </div>

          <div className="summary-list">
            {history.map((item, index) => (
              <div key={`${item.ticketSerialNumber}-${index}`} className="summary-entry">
                <span className={getLetterChipClass(item.letter)}>{item.letter}</span>
                {item.lotImageUrl ? (
                  <img src={item.lotImageUrl} alt={item.lotLabel} className="summary-thumb" />
                ) : null}
                <div className="summary-copy">
                  <strong>{item.lotLabel}</strong>
                  <span>Ticket #{item.ticketSerialNumber}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card card-pad stack">
        <div
          className="ticket-grid ticket-grid-visual"
          style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
        >
          {sortedTickets.map((ticket) => {
            const isOpened = ticket.status === "opened";
            const disabled = isOpened || finished || Boolean(selectedTicketId);

            return (
              <button
                key={ticket.id}
                type="button"
                disabled={disabled}
                aria-label={
                  isOpened
                    ? `Ticket ${ticket.serialNumber} déjà ouvert`
                    : `Ouvrir le ticket ${ticket.serialNumber}`
                }
                className={`ticket-tile ${isOpened ? "ticket-tile-opened" : ""}`}
                onClick={() => handleSelectTicket(ticket.id)}
              >
                <div className="ticket-tile-inner">
                  <Image
                    src="/tickets/TICKET_KUJI.webp"
                    alt=""
                    fill
                    className="ticket-tile-image"
                    priority={false}
                  />
                </div>

                {isOpened ? <div className="ticket-tile-overlay" /> : null}              </button>
            );
          })}
        </div>
      </section>

      {finished && !selectedTicketId ? (
        <section className="card card-pad summary-panel stack center">
          <span className="badge badge-success">Tous les tirages sont terminés</span>
          <h2 className="title">Résumé de fin de session</h2>
          <p className="subtitle">
            Retour automatique vers la page code dans {countdown}s.
          </p>

          <div className="summary-list">
            {history.map((item, index) => (
              <div key={`${item.ticketSerialNumber}-${index}`} className="summary-entry">
                <span className={getLetterChipClass(item.letter)}>{item.letter}</span>
                {item.lotImageUrl ? (
                  <img src={item.lotImageUrl} alt={item.lotLabel} className="summary-thumb" />
                ) : null}
                <div className="summary-copy">
                  <strong>{item.lotLabel}</strong>
                  <span>Ticket #{item.ticketSerialNumber}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="summary-actions">
            <button className="button" type="button" onClick={() => router.push("/play")}>
              Retourner maintenant
            </button>
          </div>
        </section>
      ) : null}

      <TicketRevealModal
        isOpen={!!selectedTicketId}
        sessionCode={sessionCode}
        ticketId={selectedTicketId}
        onClose={handleCloseModal}
        onResolved={handleResolved}
      />
    </div>
  );
}