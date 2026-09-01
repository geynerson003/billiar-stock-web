import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../../src/components/common/Modal";

describe("Modal", () => {
  it("no renderiza nada cuando open=false", () => {
    render(<Modal open={false} title="T" onClose={() => {}}>contenido</Modal>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renderiza en un portal con título y contenido", () => {
    render(<Modal open title="Confirmar" onClose={() => {}}>cuerpo</Modal>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirmar")).toBeInTheDocument();
    expect(screen.getByText("cuerpo")).toBeInTheDocument();
  });

  it("bloquea el scroll del body mientras está abierto", () => {
    const { unmount } = render(<Modal open title="T" onClose={() => {}}>x</Modal>);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("llama onClose con Escape, con el botón de cerrar y con el backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal open title="T" onClose={onClose}>x</Modal>);

    await user.keyboard("{Escape}");
    await user.click(screen.getByLabelText("Cerrar"));
    await user.click(screen.getByRole("presentation"));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("un click dentro del cuadro de diálogo no cierra el modal", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal open title="T" onClose={onClose}><span>dentro</span></Modal>);
    await user.click(screen.getByText("dentro"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
