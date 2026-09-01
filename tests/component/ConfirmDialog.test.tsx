import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useConfirmDialog } from "../../src/components/common/ConfirmDialog";

function Harness({ onResult }: { onResult: (v: boolean) => void }) {
  const [dialog, confirm] = useConfirmDialog();
  return (
    <>
      <button
        onClick={async () => {
          const ok = await confirm({ title: "¿Eliminar?", message: "No se puede deshacer" });
          onResult(ok);
        }}
      >
        pedir
      </button>
      {dialog}
    </>
  );
}

describe("useConfirmDialog", () => {
  it("resuelve true al confirmar", async () => {
    const user = userEvent.setup();
    const results: boolean[] = [];
    render(<Harness onResult={(v) => results.push(v)} />);

    await user.click(screen.getByRole("button", { name: "pedir" }));
    expect(screen.getByText("¿Eliminar?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(results).toEqual([true]);
  });

  it("resuelve false al cancelar", async () => {
    const user = userEvent.setup();
    const results: boolean[] = [];
    render(<Harness onResult={(v) => results.push(v)} />);

    await user.click(screen.getByRole("button", { name: "pedir" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(results).toEqual([false]);
  });
});
