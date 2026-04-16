import { useMemo, useState, type FormEvent } from "react";
import { Modal, PageHeader, Panel, useConfirmDialog } from "../../../../shared/components";
import { useAuth, useLiveCollection, useToast } from "../../../../shared/hooks";
import type { Expense } from "../../../../shared/types";
import {
  addOrUpdateExpense,
  businessCollection,
  deleteExpense,
  mapExpense,
} from "../../../../shared/services/firebase/business.service";
import { formatCurrency, formatDate } from "../../../../shared/utils/format";

type ExpenseDraft = {
  id: string;
  description: string;
  amount: string;
  category: string;
  date: string;
};

const blankExpenseDraft: ExpenseDraft = {
  id: "",
  description: "",
  amount: "0",
  category: "General",
  date: String(Date.now()),
};

function expenseToDraft(expense: Expense): ExpenseDraft {
  return {
    id: expense.id,
    description: expense.description,
    amount: String(expense.amount),
    category: expense.category,
    date: expense.date,
  };
}

function draftToExpense(draft: ExpenseDraft): Expense {
  return {
    id: draft.id,
    description: draft.description.trim(),
    amount: Number(draft.amount || 0),
    category: draft.category.trim() || "General",
    date: draft.date,
  };
}

export function ExpensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userId = user?.uid;
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<ExpenseDraft>(blankExpenseDraft);
  const [confirmDialog, confirm] = useConfirmDialog();

  const expenses = useLiveCollection(
    () => (userId ? businessCollection(userId, "expenses") : null),
    [userId],
    mapExpense
  );

  const filteredExpenses = useMemo(
    () =>
      expenses.data
        .filter((expense) =>
          `${expense.description} ${expense.category}`.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => Number(b.date) - Number(a.date)),
    [expenses.data, search]
  );

  function openCreate() {
    setDraft(blankExpenseDraft);
    setModalOpen(true);
  }

  function openEdit(expense: Expense) {
    setDraft(expenseToDraft(expense));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setDraft(blankExpenseDraft);
  }

  function handleAmountFocus() {
    if (draft.amount === "0") {
      setDraft({ ...draft, amount: "" });
    }
  }

  function handleAmountBlur() {
    if (draft.amount === "" || Number(draft.amount) < 0) {
      setDraft({ ...draft, amount: "0" });
    }
  }

  async function saveExpense(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;

    if (!draft.description.trim()) {
      toast("warning", "La descripción es obligatoria");
      return;
    }

    const amount = Number(draft.amount || 0);
    if (amount <= 0) {
      toast("warning", "El monto debe ser mayor a 0");
      return;
    }

    await addOrUpdateExpense(userId, draftToExpense(draft));
    toast("success", draft.id ? "Gasto actualizado" : "Gasto registrado con éxito");
    closeModal();
  }

  async function removeExpense(expenseId: string) {
    if (!userId) return;
    const confirmed = await confirm({
      title: "Eliminar gasto",
      message: "¿Estás seguro de eliminar este gasto?",
      confirmLabel: "Eliminar",
    });
    if (!confirmed) return;
    await deleteExpense(userId, expenseId);
    toast("success", "Gasto eliminado");
  }

  return (
    <div className="page page-themed page-themed--expenses">
      {confirmDialog}

      <PageHeader
        eyebrow="Gastos"
        title="Gestión de gastos"
        description="Gestiona tus gastos del negocio."
        actions={
          <div className="inline-actions">
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar gasto…"
            />
            <button className="button button--primary" onClick={openCreate} type="button">
              Nuevo gasto
            </button>
          </div>
        }
      />

      <Panel title="Historial de egresos" subtitle={`${filteredExpenses.length} movimientos`}>
        <div className="stack-list">
          {filteredExpenses.length === 0 && (
            <div className="empty-state">No hay gastos para mostrar con el filtro actual.</div>
          )}
          {filteredExpenses.map((expense) => (
            <div className="list-row list-row--expanded" key={expense.id}>
              <div>
                <strong>{expense.description}</strong>
                <span>
                  {expense.category} · {formatDate(expense.date)}
                </span>
              </div>
              <div className="inline-actions">
                <strong>{formatCurrency(expense.amount)}</strong>
                <button className="button button--secondary" onClick={() => openEdit(expense)} type="button">
                  Editar
                </button>
                <button className="button button--ghost" onClick={() => void removeExpense(expense.id)} type="button">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Modal open={modalOpen} title={draft.id ? "Editar gasto" : "Nuevo gasto"} onClose={closeModal}>
        <form className="form-grid" onSubmit={saveExpense}>
          <label className="field">
            <span>Descripción</span>
            <input
              required
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              placeholder="Ej: Suministros, Mantenimiento…"
            />
          </label>

          <label className="field">
            <span>Monto</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={draft.amount}
              onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
              onFocus={handleAmountFocus}
              onBlur={handleAmountBlur}
            />
          </label>

          <label className="field">
            <span>Categoría</span>
            <input
              value={draft.category}
              onChange={(event) => setDraft({ ...draft, category: event.target.value })}
              placeholder="General"
            />
          </label>

          <div className="modal__footer">
            <button className="button button--secondary" onClick={closeModal} type="button">
              Cancelar
            </button>
            <button className="button button--primary" type="submit">
              Guardar gasto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
