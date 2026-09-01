import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, PageHeader, Panel, QueryError, useConfirmDialog } from "../../../../shared/components";
import { useAsyncAction, useBusinessId, useLiveCollection, useMarket, useNowTick, usePermissions, useTableTimerAlerts, useToast } from "../../../../shared/hooks";
import type { TableEntity, TablePricingMode } from "../../../../shared/types";
import {
  addOrUpdateTable,
  businessCollection,
  deleteTable,
  mapTable,
  startSession,
  mapGame,
} from "../../../../shared/services/firebase/business.service";
import billiardTableImage from "../../../../icons/mesabillar.png";
import { formatCurrency, formatDuration } from "../../../../shared/utils/format";

type TimerUnit = "minutes" | "hours";

type TableDraft = {
  id: string;
  name: string;
  pricePerGame: string;
  currentSessionId: string | null;
  pricingMode: TablePricingMode;
  timerValue: string;
  timerUnit: TimerUnit;
};

function minutesToTimerField(totalMinutes: number): { timerValue: string; timerUnit: TimerUnit } {
  if (totalMinutes > 0 && totalMinutes % 60 === 0) {
    return { timerValue: String(totalMinutes / 60), timerUnit: "hours" };
  }
  return { timerValue: String(totalMinutes || 30), timerUnit: "minutes" };
}

function tableToDraft(table: TableEntity): TableDraft {
  const { timerValue, timerUnit } = minutesToTimerField(table.timerDurationMinutes ?? 30);
  return {
    id: table.id,
    name: table.name,
    pricePerGame: String(table.pricePerGame),
    currentSessionId: table.currentSessionId ?? null,
    pricingMode: table.pricingMode ?? "GAME",
    timerValue,
    timerUnit,
  };
}

function draftToTable(draft: TableDraft): TableEntity {
  const timerValueNumber = Number(draft.timerValue || 0);
  const timerDurationMinutes = draft.timerUnit === "hours" ? timerValueNumber * 60 : timerValueNumber;

  return {
    id: draft.id,
    name: draft.name.trim(),
    pricePerGame: Number(draft.pricePerGame || 0),
    currentSessionId: draft.currentSessionId,
    pricingMode: draft.pricingMode,
    timerDurationMinutes,
  };
}

export function TablesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { run: runAction } = useAsyncAction();
  const { can } = usePermissions();
  const { id: marketId, terms } = useMarket();
  const userId = useBusinessId(); // businessId efectivo (uid del dueño)
  const [modalOpen, setModalOpen] = useState(false);
  const blankTableDraft: TableDraft = {
    id: "",
    name: "",
    pricePerGame: "0",
    currentSessionId: null,
    pricingMode: "GAME",
    timerValue: "30",
    timerUnit: "minutes",
  };
  const [draft, setDraft] = useState<TableDraft>(blankTableDraft);
  const [confirmDialog, confirm] = useConfirmDialog();

  const tables = useLiveCollection(
    () => (userId ? businessCollection(userId, "tables") : null),
    [userId],
    mapTable
  );

  const games = useLiveCollection(
    () => (userId ? businessCollection(userId, "games") : null),
    [userId],
    mapGame
  );

  const now = useNowTick();
  useTableTimerAlerts(games.data, (tableId) => tables.data.find((t) => t.id === tableId)?.name ?? "una mesa");

  function openCreate() {
    setDraft(blankTableDraft);
    setModalOpen(true);
  }

  function openEdit(table: TableEntity) {
    setDraft(tableToDraft(table));
    setModalOpen(true);
  }

  function handlePriceFocus() {
    if (draft.pricePerGame === "0") {
      setDraft({ ...draft, pricePerGame: "" });
    }
  }

  function handlePriceBlur() {
    if (draft.pricePerGame === "" || Number(draft.pricePerGame) < 0) {
      setDraft({ ...draft, pricePerGame: "0" });
    }
  }

  async function saveTable(event: FormEvent) {
    event.preventDefault();
    if (!userId || !can("tables.manage")) return;

    if (!draft.name.trim()) {
      toast("warning", "El nombre de la mesa es obligatorio");
      return;
    }

    const price = Number(draft.pricePerGame || 0);
    if (price < 0) {
      toast("warning", "El precio debe ser un número positivo");
      return;
    }

    if (draft.pricingMode === "TIME" && Number(draft.timerValue || 0) <= 0) {
      toast("warning", "Ingresa una duración de tiempo válida");
      return;
    }

    await runAction(() => addOrUpdateTable(userId, draftToTable(draft)), {
      success: draft.id ? "Mesa actualizada" : "Mesa creada con éxito",
      errorFallbackId: "tables.save.error",
      onSuccess: () => setModalOpen(false),
    });
  }

  async function removeTable(tableId: string) {
    if (!userId || !can("tables.delete")) return;
    const confirmed = await confirm({
      title: "Eliminar mesa",
      message: "¿Estás seguro de eliminar esta mesa?",
      confirmLabel: "Eliminar",
    });
    if (!confirmed) return;
    await runAction(() => deleteTable(userId, tableId), {
      success: "tables.delete.success",
      errorFallbackId: "tables.delete.error",
    });
  }

  async function handleStartSession(table: TableEntity) {
    if (!userId || !can("tables.manage")) return;
    const session = await runAction(() => startSession(userId, table.id), {
      errorFallbackId: "tables.session.start.error",
    });
    if (session) navigate(`/tables/${table.id}/${session.id}`);
  }

  return (
    <div className="page page-themed page-themed--tables">
      {confirmDialog}

      <PageHeader
        eyebrow={terms.tablesEyebrow}
        title={terms.tablesTitle}
        description={terms.tablesDescription}
        actions={
          can("tables.manage") ? (
            <button className="button button--primary" onClick={openCreate} type="button">
              {terms.newTableCta}
            </button>
          ) : undefined
        }
      />

      <QueryError error={tables.error} />

      <Panel title={terms.tablesListTitle} subtitle={`${tables.data.length} mesas`}>
        <div className="catalog-grid">
          {tables.data.length === 0 && (
            <div className="empty-state">{terms.tablesEmpty}</div>
          )}
          {tables.data.map((table) => {
            const activeGame = games.data.find(
              (g) => g.tableId === table.id && g.sessionId === table.currentSessionId && g.status === "ACTIVE"
            );
            const hasActiveGame = Boolean(activeGame);
            const isTimeMode = table.pricingMode === "TIME";
            const remainingMs =
              activeGame && isTimeMode && activeGame.timerDurationMs
                ? activeGame.startTime + activeGame.timerDurationMs - now
                : null;
            const timeIsUp = remainingMs !== null && remainingMs <= 0;

            return (
            <article
              className={`catalog-card table-card ${table.currentSessionId ? "table-card--active" : ""}`}
              key={table.id}
            >
              <button
                className="table-card__settings"
                onClick={() => openEdit(table)}
                type="button"
                aria-label="Configurar mesa"
                title="Configurar mesa"
                hidden={!can("tables.manage")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>

              {marketId === "billiards" && (
                <div className="table-card__visual">
                  <img alt={`Mesa ${table.name}`} className="table-card__image" src={billiardTableImage} />
                </div>
              )}

              <div className="catalog-card__top">
                <div>
                  <strong>{table.name}</strong>
                  <span>
                    {isTimeMode
                      ? `${formatCurrency(table.pricePerGame)} por ${formatDuration((table.timerDurationMinutes ?? 0) * 60000)}`
                      : `${formatCurrency(table.pricePerGame)} ${terms.perSessionLabel}`}
                  </span>
                </div>
                <span className={`badge ${hasActiveGame ? "badge--danger" : table.currentSessionId ? "badge--success" : ""}`}>
                  {hasActiveGame ? "Ocupada" : table.currentSessionId ? "Disponible" : "No disponible"}
                </span>
              </div>

              {remainingMs !== null && (
                <div className={`table-card__timer ${timeIsUp ? "table-card__timer--up" : ""}`}>
                  {timeIsUp ? "¡Tiempo agotado!" : `Tiempo restante: ${formatDuration(remainingMs)}`}
                </div>
              )}

              <div className="inline-actions">
                {table.currentSessionId ? (
                  <button
                    className="button button--primary"
                    onClick={() => navigate(`/tables/${table.id}/${table.currentSessionId}`)}
                    type="button"
                  >
                    {terms.openSessionCta}
                  </button>
                ) : (
                  can("tables.manage") && (
                    <button className="button button--primary" onClick={() => void handleStartSession(table)} type="button">
                      {terms.startSessionCta}
                    </button>
                  )
                )}
                {can("tables.delete") && (
                  <button className="button button--ghost" onClick={() => void removeTable(table.id)} type="button">
                    Eliminar
                  </button>
                )}
              </div>
            </article>
            );
          })}
        </div>
      </Panel>

      <Modal open={modalOpen} title={draft.id ? "Configurar mesa" : "Nueva mesa"} onClose={() => setModalOpen(false)}>
        <form className="form-grid" onSubmit={saveTable}>
          <label className="field">
            <span>Nombre</span>
            <input
              required
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Ej: Mesa 1, Terraza…"
            />
          </label>

          <label className="field">
            <span>{terms.tablePriceLabel}</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={draft.pricePerGame}
              onChange={(event) => setDraft({ ...draft, pricePerGame: event.target.value })}
              onFocus={handlePriceFocus}
              onBlur={handlePriceBlur}
            />
          </label>

          <div className="field field--full">
            <span>Cobro de la mesa</span>
            <div className="segmented-control">
              <button
                className={`segmented-control__option ${draft.pricingMode === "GAME" ? "segmented-control__option--active" : ""}`}
                onClick={() => setDraft({ ...draft, pricingMode: "GAME" })}
                type="button"
              >
                Por partida
              </button>
              <button
                className={`segmented-control__option ${draft.pricingMode === "TIME" ? "segmented-control__option--active" : ""}`}
                onClick={() => setDraft({ ...draft, pricingMode: "TIME" })}
                type="button"
              >
                Por tiempo
              </button>
            </div>
          </div>

          {draft.pricingMode === "TIME" && (
            <div className="field field--full">
              <span>Duración del cronómetro</span>
              <div className="timer-input-row">
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={draft.timerValue}
                  onChange={(event) => setDraft({ ...draft, timerValue: event.target.value })}
                />
                <select
                  value={draft.timerUnit}
                  onChange={(event) => setDraft({ ...draft, timerUnit: event.target.value as TimerUnit })}
                >
                  <option value="minutes">Minutos</option>
                  <option value="hours">Horas</option>
                </select>
              </div>
            </div>
          )}

          <div className="modal__footer">
            <button className="button button--secondary" onClick={() => setModalOpen(false)} type="button">
              Cancelar
            </button>
            {draft.currentSessionId && (
              <button
                className="button button--ghost"
                onClick={() => setDraft({ ...draft, currentSessionId: null })}
                type="button"
              >
                Cerrar sesión
              </button>
            )}
            <button className="button button--primary" type="submit">
              Guardar mesa
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
