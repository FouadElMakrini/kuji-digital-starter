import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

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

export default async function HistoryPage() {
  const draws = await prisma.drawLog.findMany({
    orderBy: { openedAt: "desc" },
    take: 200,
    include: {
      kuji: {
        select: { name: true }
      },
      session: {
        select: { accessCode: true }
      }
    }
  });

  return (
    <section className="card card-pad stack">
      <div className="section-head">
        <div>
          <h2 className="title">Historique des tirages</h2>
          <p className="subtitle">Vue simple de tous les tickets déjà sortis.</p>
        </div>
      </div>

      {draws.length === 0 ? (
        <div className="empty-state">Aucun tirage enregistré pour le moment.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Kuji</th>
                <th>Code session</th>
                <th>Ticket</th>
                <th>Position</th>
                <th>Lettre</th>
              </tr>
            </thead>
            <tbody>
              {draws.map((draw) => (
                <tr key={draw.id}>
                  <td>{formatDate(draw.openedAt)}</td>
                  <td>{draw.kuji.name}</td>
                  <td>{draw.session.accessCode}</td>
                  <td>#{draw.ticketSerialNumber}</td>
                  <td>{draw.gridPosition + 1}</td>
                  <td>
                    <span className={getLetterChipClass(draw.letter)}>
                      {draw.letter}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}