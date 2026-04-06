import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PlayBoard } from "@/components/play-board";

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
    default:
      return "letter-chip";
  }
}

export default async function PlaySessionPage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalizedCode = decodeURIComponent(code).trim().toUpperCase();

  const session = await prisma.clientSession.findUnique({
    where: { accessCode: normalizedCode },
    include: {
      kuji: {
        include: {
          prizeTiers: { orderBy: { displayOrder: "asc" } },
          tickets: {
            orderBy: { gridPosition: "asc" },
            select: {
              id: true,
              serialNumber: true,
              gridPosition: true,
              status: true
            }
          }
        }
      },
      drawLogs: {
        orderBy: { openedAt: "asc" },
        select: {
          ticketSerialNumber: true,
          letter: true
        }
      }
    }
  });

  if (!session) {
    return (
      <main className="page-shell">
        <div className="container narrow">
          <section className="card card-pad stack center">
            <h1 className="title">Code introuvable</h1>
            <p className="subtitle">Ce code n’existe pas ou n’est plus disponible.</p>
            <Link className="button-secondary" href="/play">
              Retour
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (
    session.expiresAt &&
    session.expiresAt.getTime() < Date.now() &&
    session.status === "active"
  ) {
    await prisma.clientSession.update({
      where: { id: session.id },
      data: { status: "expired" }
    });
    session.status = "expired";
  }

  const remainingDraws = Math.max(0, session.allowedDraws - session.usedDraws);

  const initialHistory = session.drawLogs.map((draw) => ({
    ticketSerialNumber: draw.ticketSerialNumber,
    letter: draw.letter,
    lotLabel:
      session.kuji.prizeTiers.find((tier) => tier.letter === draw.letter)?.label ??
      `Lot ${draw.letter}`,
    lotImageUrl:
      session.kuji.prizeTiers.find((tier) => tier.letter === draw.letter)?.imageUrl ?? null
  }));

  if (session.status === "completed" || remainingDraws === 0) {
    return (
      <main className="page-shell">
        <div className="container narrow">
          <section className="card card-pad stack center">
            <span className="badge badge-success">Session terminée</span>
            <h1 className="title">Résumé de tes tirages</h1>
            <p className="subtitle">
              Tous tes tirages ont été utilisés.
            </p>

            <div className="summary-list">
              {initialHistory.length === 0 ? (
                <span className="muted">Aucun tirage enregistré.</span>
              ) : (
                initialHistory.map((item, index) => (
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
                ))
              )}
            </div>

            <Link className="button" href="/play">
              Retour à la page code
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (session.status !== "active") {
    return (
      <main className="page-shell">
        <div className="container narrow">
          <section className="card card-pad stack center">
            <h1 className="title">Session non disponible</h1>
            <p className="subtitle">
              Cette session est {session.status === "revoked" ? "révoquée" : session.status}.
            </p>
            <Link className="button-secondary" href="/play">
              Retour
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="container">
        <PlayBoard
          sessionCode={session.accessCode}
          kujiName={session.kuji.name}
          initialRemainingDraws={remainingDraws}
          gridColumns={session.kuji.gridColumns}
          initialTickets={session.kuji.tickets}
          initialHistory={initialHistory}
        />
      </div>
    </main>
  );
}