import Link from "next/link";
import { CopyCodeButton } from "@/components/copy-code-button";

type SessionCreatedCardProps = {
  code: string;
};

export function SessionCreatedCard({ code }: SessionCreatedCardProps) {
  const playLink = `/play/session/${encodeURIComponent(code)}`;

  return (
    <section className="session-created-card card card-pad stack">
      <div className="section-head">
        <div>
          <span className="badge badge-success">Session créée</span>
          <h3 className="title">Code client prêt à donner</h3>
          <p className="subtitle">
            Le code est mis en avant pour que tu puisses le copier facilement.
          </p>
        </div>
      </div>

      <div className="session-created-code">{code}</div>

      <div className="session-created-actions">
        <CopyCodeButton value={code} label="Copier le code" />
        <Link className="button-secondary" href={playLink}>
          Voir la page client
        </Link>
      </div>
    </section>
  );
}