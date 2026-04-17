import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, PageHeader, Panel, useConfirmDialog } from "../../../../shared/components";
import { useAuth, useLiveCollection, useToast } from "../../../../shared/hooks";
import type { TableEntity } from "../../../../shared/types";
import {
  addOrUpdateTable,
  businessCollection,
  deleteTable,
  mapTable,
  startSession,
  mapGame,
} from "../../../../shared/services/firebase/business.service";
import billiardTableImage from "../../../../icons/mesabillar.png";
import { formatCurrency } from "../../../../shared/utils/format";

type TableDraft = {
  id: string;
  name: string;
  pricePerGame: string;
  currentSessionId: string | null;
};

function tableToDraft(table: TableEntity): TableDraft {
  return {
    id: table.id,
    name: table.name,
    pricePerGame: String(table.pricePerGame),
    currentSessionId: table.currentSessionId ?? null,
  };
}

function draftToTable(draft: TableDraft): TableEntity {
  return {
    id: draft.id,
    name: draft.name.trim(),
    pricePerGame: Number(draft.pricePerGame || 0),
    currentSessionId: draft.currentSessionId,
  };
}

export function TablesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.uid;
  const [modalOpen, setModalOpen] = useState(false);
  const blankTableDraft: TableDraft = {
    id: "",
    name: "",
    pricePerGame: "0",
    currentSessionId: null,
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
    if (!userId) return;

    if (!draft.name.trim()) {
      toast("warning", "El nombre de la mesa es obligatorio");
      return;
    }

    const price = Number(draft.pricePerGame || 0);
    if (price < 0) {
      toast("warning", "El precio debe ser un número positivo");
      return;
    }

    await addOrUpdateTable(userId, draftToTable(draft));
    toast("success", draft.id ? "Mesa actualizada" : "Mesa creada con éxito");
    setModalOpen(false);
  }

  async function removeTable(tableId: string) {
    if (!userId) return;
    const confirmed = await confirm({
      title: "Eliminar mesa",
      message: "¿Estás seguro de eliminar esta mesa?",
      confirmLabel: "Eliminar",
    });
    if (!confirmed) return;
    await deleteTable(userId, tableId);
    toast("success", "Mesa eliminada");
  }

  async function handleStartSession(table: TableEntity) {
    if (!userId) return;
    const session = await startSession(userId, table.id);
    navigate(`/tables/${table.id}/${session.id}`);
  }

  return (
    <div className="page page-themed page-themed--tables">
      {confirmDialog}

      <PageHeader
        eyebrow="Mesas"
        title="Gestión de mesas"
        description="Gestiona tus mesas y abre partidas."
        actions={
          <button className="button button--primary" onClick={openCreate} type="button">
            Nueva mesa
          </button>
        }
      />

      <Panel title="Mesas configuradas" subtitle={`${tables.data.length} mesas`}>
        <div className="catalog-grid">
          {tables.data.length === 0 && (
            <div className="empty-state">Todavía no hay mesas creadas. Registra la primera para abrir partidas.</div>
          )}
          {tables.data.map((table) => {
            const hasActiveGame = games.data.some(
              (g) => g.tableId === table.id && g.sessionId === table.currentSessionId && g.status === "ACTIVE"
            );

            return (
            <article
              className={`catalog-card table-card ${table.currentSessionId ? "table-card--active" : ""}`}
              key={table.id}
            >
              <div className="table-card__visual">
                <img alt={`Mesa ${table.name}`} className="table-card__image" src={billiardTableImage} />
              </div>

              <div className="catalog-card__top">
                <div>
                  <strong>{table.name}</strong>
                  <span>{formatCurrency(table.pricePerGame)} por partida</span>
                </div>
                <span className={`badge ${hasActiveGame ? "badge--danger" : table.currentSessionId ? "badge--success" : ""}`}>
                  {hasActiveGame ? "En partida" : table.currentSessionId ? "Mesa disponible" : " No disponible"}
                </span>
              </div>

              <div className="inline-actions">
                {table.currentSessionId ? (
                  <button
                    className="button button--primary"
                    onClick={() => navigate(`/tables/${table.id}/${table.currentSessionId}`)}
                    type="button"
                  >
                    Abrir partida
                  </button>
                ) : (
                  <button className="button button--primary" onClick={() => void handleStartSession(table)} type="button">
                    Iniciar sesión
                  </button>
                )}
                <button className="button button--secondary" onClick={() => openEdit(table)} type="button">
                  Editar
                </button>
                <button className="button button--ghost" onClick={() => void removeTable(table.id)} type="button">
                  Eliminar
                </button>
              </div>
            </article>
            );
          })}
        </div>
      </Panel>

      <Modal open={modalOpen} title={draft.id ? "Editar mesa" : "Nueva mesa"} onClose={() => setModalOpen(false)}>
        <form className="form-grid" onSubmit={saveTable}>
          <label className="field">
            <span>Nombre</span>
            <input
              required
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Ej: Mesa 1, Billar Premium…"
            />
          </label>

          <label className="field">
            <span>Precio por partida</span>
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
