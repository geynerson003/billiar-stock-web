import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "../../src/components/common/PageHeader";

describe("PageHeader", () => {
  it("renderiza título y descripción", () => {
    render(<PageHeader title="Ventas" description="Historial de ventas" />);
    expect(screen.getByRole("heading", { name: "Ventas" })).toBeInTheDocument();
    expect(screen.getByText("Historial de ventas")).toBeInTheDocument();
  });

  it("muestra eyebrow y actions sólo cuando se pasan", () => {
    const { rerender, container } = render(
      <PageHeader title="T" description="D" />
    );
    expect(container.querySelector(".page-header__eyebrow")).toBeNull();
    expect(container.querySelector(".page-header__actions")).toBeNull();

    rerender(
      <PageHeader title="T" description="D" eyebrow="Sección" actions={<button>Nueva</button>} />
    );
    expect(screen.getByText("Sección")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nueva" })).toBeInTheDocument();
  });
});
