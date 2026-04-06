"use client";

import { useMemo, useRef, useState } from "react";

type PrizeTierRow = {
  id: string;
  letter: string;
  label: string;
  quantity: number;
  imageUrl: string;
};

const INITIAL_ROWS: PrizeTierRow[] = [
  { id: "row-1", letter: "A", label: "Lot A", quantity: 1, imageUrl: "" },
  { id: "row-2", letter: "B", label: "Lot B", quantity: 2, imageUrl: "" },
  { id: "row-3", letter: "C", label: "Lot C", quantity: 3, imageUrl: "" }
];

type InitialRowInput = Omit<PrizeTierRow, "id">;

export function PrizeTierBuilder({ initialRows }: { initialRows?: InitialRowInput[] }) {
  const preparedRows =
    initialRows && initialRows.length > 0
      ? initialRows.map((row, index) => ({
          id: `row-${index + 1}`,
          letter: String(row.letter ?? "").toUpperCase(),
          label: String(row.label ?? ""),
          quantity: Math.max(1, Number(row.quantity) || 1),
          imageUrl: String(row.imageUrl ?? "")
        }))
      : INITIAL_ROWS;

  const [rows, setRows] = useState<PrizeTierRow[]>(preparedRows);
  const nextIdRef = useRef(preparedRows.length + 1);

  function makeRowId() {
    const id = `row-${nextIdRef.current}`;
    nextIdRef.current += 1;
    return id;
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        id: makeRowId(),
        letter: "",
        label: "",
        quantity: 1,
        imageUrl: ""
      }
    ]);
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
  }

  function updateRow(
    id: string,
    field: keyof Omit<PrizeTierRow, "id">,
    value: string | number
  ) {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value
            }
          : row
      )
    );
  }

  const serialized = useMemo(
    () =>
      JSON.stringify(
        rows.map(({ letter, label, quantity, imageUrl }) => ({
          letter: letter.trim().toUpperCase(),
          label: label.trim(),
          quantity: Number(quantity),
          imageUrl: imageUrl.trim()
        }))
      ),
    [rows]
  );

  const totalTickets = useMemo(
    () => rows.reduce((sum, row) => sum + Math.max(1, Number(row.quantity) || 1), 0),
    [rows]
  );

  return (
    <div className="stack" style={{ gap: "0.9rem" }}>
      <input type="hidden" name="prizeTiers" value={serialized} />

      <div className="builder-toolbar compact-builder-toolbar">
        <span className="badge">{rows.length} lots</span>
        <span className="badge">{totalTickets} tickets estimés</span>
      </div>

      <div className="stack prize-tier-builder-list compact-tier-list">
        {rows.map((row, index) => (
          <div key={row.id} className="card card-pad prize-tier-row-card compact-tier-card">
            <div className="prize-tier-row-head compact-tier-head">
              <div className="stack" style={{ gap: "0.18rem" }}>
                <strong>Lot {index + 1}</strong>
                <span className="subtitle">Modifiable avant enregistrement</span>
              </div>

              <button
                type="button"
                className="button-secondary compact-button"
                onClick={() => removeRow(row.id)}
                disabled={rows.length <= 1}
              >
                Supprimer
              </button>
            </div>

            <div className="prize-tier-grid compact-tier-grid">
              <div className="field compact-letter-field">
                <label htmlFor={`letter-${row.id}`}>Lettre</label>
                <input
                  id={`letter-${row.id}`}
                  type="text"
                  value={row.letter}
                  maxLength={8}
                  onChange={(event) =>
                    updateRow(row.id, "letter", event.target.value.toUpperCase())
                  }
                />
              </div>

              <div className="field">
                <label htmlFor={`label-${row.id}`}>Nom du lot</label>
                <input
                  id={`label-${row.id}`}
                  type="text"
                  value={row.label}
                  onChange={(event) => updateRow(row.id, "label", event.target.value)}
                />
              </div>

              <div className="field compact-qty-field">
                <label htmlFor={`quantity-${row.id}`}>Quantité</label>
                <input
                  id={`quantity-${row.id}`}
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(event) =>
                    updateRow(
                      row.id,
                      "quantity",
                      Math.max(1, Number(event.target.value) || 1)
                    )
                  }
                />
              </div>

              <div className="field">
                <label htmlFor={`image-${row.id}`}>Image du lot</label>
                <input
                  id={`image-${row.id}`}
                  type="url"
                  value={row.imageUrl}
                  onChange={(event) => updateRow(row.id, "imageUrl", event.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            {row.imageUrl ? (
              <div className="compact-image-preview-wrap">
                <img src={row.imageUrl} alt={row.label || row.letter || `Lot ${index + 1}`} className="compact-image-preview" />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="button" className="button-secondary" onClick={addRow}>
          Ajouter un lot
        </button>
      </div>
    </div>
  );
}
