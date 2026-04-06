"use client";

import { useMemo, useState } from "react";
import { TicketRevealModal } from "./ticket-reveal-modal";

type Ticket = {
  id: string;
  serialNumber: number;
  status: "available" | "opened";
};

type SessionBoardProps = {
  sessionCode: string;
  kujiName: string;
  initialRemainingDraws: number;
  initialTickets: Ticket[];
};

type RevealResult = {
  ticketId: string;
  letter: string;
  remainingDraws: number;
};

export function SessionBoard({
  sessionCode,
  kujiName,
  initialRemainingDraws,
  initialTickets
}: SessionBoardProps) {
  const [remainingDraws, setRemainingDraws] = useState(initialRemainingDraws);
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const openedCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "opened").length,
    [tickets]
  );

  function handleSelectTicket(ticketId: string) {
    if (remainingDraws <= 0) return;
    if (selectedTicketId) return;
    setSelectedTicketId(ticketId);
  }

  function handleResolved(result: RevealResult) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === result.ticketId
          ? { ...ticket, status: "opened" }
          : ticket
      )
    );

    setRemainingDraws(result.remainingDraws);
    setHistory((current) => [...current, result.letter]);
  }

  function handleCloseModal() {
    setSelectedTicketId(null);
  }

  return (
    <div className="stack">
      <section className="play-header card card-pad">
        <p className="subtitle">Kuji en cours</p>
        <h1 className="title">{kujiName}</h1>

        <div className="play-kpis">
          <div className="big-remaining">{remainingDraws}</div>
          <div className="subtitle">tirage(s) restant(s)</div>
        </div>

        <div className="form-actions">
          <span className="badge">{openedCount} tickets déjà ouverts</span>
          <span className="badge">{tickets.length - openedCount} restants dans la grille</span>
        </div>
      </section>

      {history.length > 0 ? (
        <section className="card card-pad stack">
          <p className="subtitle">Gains de cette session</p>
          <div className="form-actions">
            {history.map((letter, index) => (
              <span key={`${letter}-${index}`} className="badge badge-letter">
                {letter}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="ticket-grid">
        {tickets.map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            className={`ticket-button ${ticket.status === "opened" ? "ticket-opened" : ""}`}
            disabled={ticket.status === "opened" || remainingDraws <= 0 || !!selectedTicketId}
            onClick={() => handleSelectTicket(ticket.id)}
          >
            {ticket.status === "opened" ? "Ouvert" : `Ticket ${ticket.serialNumber}`}
          </button>
        ))}
      </section>

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