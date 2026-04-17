import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Modal, PageHeader, Panel } from "../../../../shared/components";
import { useAuth, useLiveCollection, useToast } from "../../../../shared/hooks";
import type { GameBet, GameParticipant } from "../../../../shared/types";
import {
  addBetToGame,
  addParticipantsToGame,
  businessCollection,
  createGame,
  restartGame,
  finishTableSession,
  mapClient,
  mapGame,
  mapProduct,
  mapTable,
  removeBetFromGame,
  removeParticipantFromGame,
} from "../../../../shared/services/firebase/business.service";
import { calculateGameTotal } from "../../../../shared/utils/financial";
import { formatCurrency, formatDate } from "../../../../shared/utils/format";

export function GameRoomPage() {
  const navigate = useNavigate();
  const { tableId = "", sessionId = "" } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.uid;

  const [participantModal, setParticipantModal] = useState(false);
  const [betModal, setBetModal] = useState(false);
  const [finishModal, setFinishModal] = useState(false);
  const [restartModal, setRestartModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [selectedLosers, setSelectedLosers] = useState<string[]>([]);
  const [selectedRestartLosers, setSelectedRestartLosers] = useState<string[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [betQuantityDraft, setBetQuantityDraft] = useState("1");
  const [isPaid, setIsPaid] = useState(false);

  function handleBetQuantityFocus() {
    if (betQuantityDraft === "1") {
      setBetQuantityDraft("");
    }
  }

  function handleBetQuantityBlur() {
    if (betQuantityDraft === "" || Number(betQuantityDraft) < 1) {
      setBetQuantityDraft("1");
    }
  }

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
  const clients = useLiveCollection(
    () => (userId ? businessCollection(userId, "clients") : null),
    [userId],
    mapClient
  );
  const products = useLiveCollection(
    () => (userId ? businessCollection(userId, "products") : null),
    [userId],
    mapProduct
  );

  const table = tables.data.find((entry) => entry.id === tableId);
  const sessionGames = games.data.filter((game) => game.sessionId === sessionId && game.tableId === tableId);
  const currentGame = sessionGames.find((game) => game.status === "ACTIVE") ?? null;
  const historyGames = sessionGames.filter((game) => game.status === "FINISHED").sort((a,b) => a.startTime - b.startTime);

  const totalAmount = currentGame ? calculateGameTotal(currentGame) : table?.pricePerGame ?? 0;

  async function startGame() {
    if (!userId || !table) return;

    await createGame(userId, {
      tableId,
      sessionId,
      startTime: Date.now(),
      endTime: null,
      pricePerGame: table.pricePerGame,
      participants: [],
      bets: [],
      loserIds: [],
      amountPerLoser: 0,
      isPaid: false,
      status: "ACTIVE",
      totalAmount: 0,
    });
    toast("success", "Partida iniciada");
  }

  async function saveParticipants() {
    if (!userId || !currentGame) return;

    const participants: GameParticipant[] = clients.data
      .filter((client) => selectedParticipantIds.includes(client.id))
      .filter((client) => !currentGame.participants.some((participant) => participant.clientId === client.id))
      .map((client) => ({
        clientId: client.id,
        clientName: client.nombre,
        joinedAt: Date.now(),
      }));

    await addParticipantsToGame(userId, currentGame, participants);
    toast("success", `${participants.length} participante(s) agregados`);
    setSelectedParticipantIds([]);
    setParticipantModal(false);
  }

  async function saveBet() {
    if (!userId || !currentGame) return;
    const product = products.data.find((entry) => entry.id === selectedProductId);
    if (!product) {
      toast("warning", "Selecciona un producto");
      return;
    }

    const quantity = Number(betQuantityDraft || 0);
    if (quantity < 1) {
      toast("warning", "La cantidad debe ser mayor a 0");
      return;
    }

    const bet: GameBet = {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.salePrice,
      totalPrice: product.salePrice * quantity,
      betByClientIds: [],
    };

    await addBetToGame(userId, currentGame, bet);
    toast("success", "Apuesta agregada");
    setSelectedProductId("");
    setBetQuantityDraft("1");
    setBetModal(false);
  }

  async function handleRestartGame() {
    if (!userId || !currentGame) return;

    if (currentGame.participants.length > 0 && selectedRestartLosers.length === 0) {
      toast("warning", "Marca al menos un perdedor para reiniciar la ronda");
      return;
    }

    await restartGame(userId, currentGame, selectedRestartLosers);
    toast("success", "Partida reiniciada");
    setSelectedRestartLosers([]);
    setRestartModal(false);
  }

  async function closeSession() {
    if (!userId) return;

    if (currentGame && currentGame.participants.length > 0 && selectedLosers.length === 0) {
      toast("warning", "Marca al menos un perdedor para la ronda actual");
      return;
    }

    await finishTableSession(userId, sessionGames, currentGame?.id ?? "", selectedLosers, isPaid, products.data, tableId, sessionId);
    toast("success", "Mesa finalizada cobrando todas las rondas");
    setSelectedLosers([]);
    setIsPaid(false);
    setFinishModal(false);
    navigate("/tables");
  }

  const finishCandidates = useMemo(() => currentGame?.participants ?? [], [currentGame]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Partida"
        title={table ? `${table.name} · ${formatCurrency(table.pricePerGame)}` : "Mesa"}
        description={
          currentGame
            ? `Partida activa desde ${formatDate(currentGame.startTime)}`
            : "Crea una partida y administra participantes, apuestas y perdedores."
        }
        actions={
          !currentGame ? (
            <button className="button button--primary" onClick={() => void startGame()} type="button">
              Iniciar partida
            </button>
          ) : (
            <div className="inline-actions">
              <button className="button button--secondary" onClick={() => setParticipantModal(true)} type="button">
                Agregar participantes
              </button>
              <button className="button button--secondary" onClick={() => setBetModal(true)} type="button">
                Agregar apuesta
              </button>
              <button className="button button--secondary" onClick={() => setHistoryModal(true)} type="button">
                Historial
              </button>
              <button className="button button--secondary" onClick={() => setRestartModal(true)} type="button">
                Reiniciar
              </button>
              <button className="button button--primary" onClick={() => setFinishModal(true)} type="button">
                Finalizar
              </button>
            </div>
          )
        }
      />

      {!currentGame && (
        <Panel title="Estado de la sala">
          <div className="empty-state">Todavía no hay una partida activa para esta sesión.</div>
        </Panel>
      )}

      {currentGame && (
        <div className="dashboard-grid">
          <Panel title="Resumen de partida">
            <div className="stack-list">
              <div className="list-row">
                <span>Precio base</span>
                <strong>{formatCurrency(currentGame.pricePerGame)}</strong>
              </div>
              <div className="list-row">
                <span>Total apuestas</span>
                <strong>{formatCurrency(currentGame.bets.reduce((sum, bet) => sum + bet.totalPrice, 0))}</strong>
              </div>
              <div className="list-row">
                <span>Total actual</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>
            </div>
          </Panel>

          <Panel title="Participantes">
            <div className="stack-list">
              {currentGame.participants.map((participant) => (
                <div className="list-row" key={participant.clientId}>
                  <div>
                    <strong>{participant.clientName}</strong>
                    <span>Ingresó {formatDate(participant.joinedAt)}</span>
                  </div>
                  <button
                    className="button button--ghost"
                    onClick={() => userId && removeParticipantFromGame(userId, currentGame, participant.clientId)}
                    type="button"
                  >
                    Quitar
                  </button>
                </div>
              ))}
              {currentGame.participants.length === 0 && (
                <div className="empty-state">Aún no hay participantes agregados.</div>
              )}
            </div>
          </Panel>

          <Panel title="Apuestas">
            <div className="stack-list">
              {currentGame.bets.map((bet, index) => (
                <div className="list-row" key={`${bet.productId}-${index}`}>
                  <div>
                    <strong>{bet.productName}</strong>
                    <span>
                      {bet.quantity} x {formatCurrency(bet.unitPrice)}
                    </span>
                  </div>
                  <div className="inline-actions">
                    <strong>{formatCurrency(bet.totalPrice)}</strong>
                    <button
                      className="button button--ghost"
                      onClick={() => userId && removeBetFromGame(userId, currentGame, index)}
                      type="button"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
              {currentGame.bets.length === 0 && <div className="empty-state">Todavía no hay apuestas cargadas.</div>}
            </div>
          </Panel>
        </div>
      )}

      <Modal open={participantModal} title="Agregar participantes" onClose={() => setParticipantModal(false)}>
        <div className="checkbox-list">
          {clients.data.map((client) => (
            <label className="check-row" key={client.id}>
              <input
                checked={selectedParticipantIds.includes(client.id)}
                onChange={(event) =>
                  setSelectedParticipantIds((current) =>
                    event.target.checked
                      ? [...current, client.id]
                      : current.filter((id) => id !== client.id)
                  )
                }
                type="checkbox"
              />
              <span>{client.nombre}</span>
            </label>
          ))}
        </div>
        <div className="modal__footer">
          <button className="button button--secondary" onClick={() => setParticipantModal(false)} type="button">
            Cancelar
          </button>
          <button className="button button--primary" onClick={() => void saveParticipants()} type="button">
            Guardar participantes
          </button>
        </div>
      </Modal>

      <Modal open={betModal} title="Agregar apuesta" onClose={() => setBetModal(false)}>
        <div className="form-grid">
          <label className="field">
            <span>Producto</span>
            <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
              <option value="">Selecciona</option>
              {products.data.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Cantidad</span>
            <input
              required
              min="1"
              type="number"
              value={betQuantityDraft}
              onChange={(event) => setBetQuantityDraft(event.target.value)}
              onFocus={handleBetQuantityFocus}
              onBlur={handleBetQuantityBlur}
            />
          </label>
        </div>

        <div className="modal__footer">
          <button className="button button--secondary" onClick={() => setBetModal(false)} type="button">
            Cancelar
          </button>
          <button className="button button--primary" onClick={() => void saveBet()} type="button">
            Guardar apuesta
          </button>
        </div>
      </Modal>

      <Modal open={restartModal} title="Reiniciar partida" onClose={() => setRestartModal(false)}>
        <div className="form-grid">
          {finishCandidates.length > 0 && (
            <div className="field field--full">
              <span>Selecciona los perdedores de esta ronda</span>
              <div className="checkbox-list" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {finishCandidates.map((participant) => (
                  <label className="check-row" key={participant.clientId}>
                    <input
                      checked={selectedRestartLosers.includes(participant.clientId)}
                      onChange={(event) =>
                        setSelectedRestartLosers((current) =>
                          event.target.checked
                            ? [...current, participant.clientId]
                            : current.filter((id) => id !== participant.clientId)
                        )
                      }
                      type="checkbox"
                    />
                    <span>{participant.clientName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button className="button button--secondary" onClick={() => setRestartModal(false)} type="button">
            Cancelar
          </button>
          <button className="button button--primary" onClick={() => void handleRestartGame()} type="button">
            Reiniciar partida
          </button>
        </div>
      </Modal>

      <Modal open={historyModal} title="Historial de la mesa" onClose={() => setHistoryModal(false)}>
        <div className="stack-list">
          {historyGames.length === 0 ? (
            <div className="empty-state">No hay partidas en el historial.</div>
          ) : (
            historyGames.map((game, idx) => (
              <div key={game.id} className="list-row">
                 <div>
                   <strong>Ronda {idx + 1}</strong>
                   <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>
                     Perdedores: {game.loserIds.length > 0 ? game.loserIds.map(id => clients.data.find(c => c.id === id)?.nombre ?? "Desconocido").join(", ") : "Todos pagarán (o dividido)"}
                   </span>
                 </div>
                 <strong>{formatCurrency(game.totalAmount)}</strong>
              </div>
            ))
          )}
        </div>
        <div className="modal__footer">
          <button className="button button--secondary" onClick={() => setHistoryModal(false)} type="button">
            Cerrar
          </button>
        </div>
      </Modal>

      <Modal open={finishModal} title="Finalizar sesión" onClose={() => setFinishModal(false)}>
        <div className="form-grid">
          {currentGame && (
            <div className="list-row" style={{ padding: '0.5rem 0', background: 'transparent' }}>
              <span>Total a facturar (Historial + Ronda actual)</span>
              <strong>{formatCurrency(historyGames.reduce((acc, g) => acc + g.totalAmount, 0) + totalAmount)}</strong>
            </div>
          )}
          {finishCandidates.length > 0 && (
            <div className="field field--full">
              <span>Selecciona los perdedores de la ronda actual final</span>
              <div className="checkbox-list" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {finishCandidates.map((participant) => (
                  <label className="check-row" key={participant.clientId}>
                    <input
                      checked={selectedLosers.includes(participant.clientId)}
                      onChange={(event) =>
                        setSelectedLosers((current) =>
                          event.target.checked
                            ? [...current, participant.clientId]
                            : current.filter((id) => id !== participant.clientId)
                        )
                      }
                      type="checkbox"
                    />
                    <span>{participant.clientName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="toggle">
            <input checked={isPaid} onChange={(event) => setIsPaid(event.target.checked)} type="checkbox" />
            <span>Marcar todas las rondas de la sesión como pagadas</span>
          </label>
        </div>

        <div className="modal__footer">
          <button className="button button--secondary" onClick={() => setFinishModal(false)} type="button">
            Cancelar
          </button>
          <button className="button button--primary" onClick={() => void closeSession()} type="button">
            Finalizar mesa
          </button>
        </div>
      </Modal>
    </div>
  );
}
