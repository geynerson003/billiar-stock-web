import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Panel } from "../../src/components/common/Panel";

describe("Panel", () => {
  it("renderiza children siempre", () => {
    render(<Panel><p>contenido</p></Panel>);
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("omite el header cuando no hay title/subtitle/actions", () => {
    const { container } = render(<Panel><span>x</span></Panel>);
    expect(container.querySelector(".panel__header")).toBeNull();
  });

  it("renderiza title y subtitle", () => {
    const { container } = render(<Panel title="Resumen" subtitle="del mes"><span>x</span></Panel>);
    expect(container.querySelector(".panel__header")).not.toBeNull();
    expect(screen.getByText("Resumen")).toBeInTheDocument();
    expect(screen.getByText("del mes")).toBeInTheDocument();
  });

  it("agrega la className extra", () => {
    const { container } = render(<Panel className="mi-clase"><span>x</span></Panel>);
    expect(container.querySelector(".panel")).toHaveClass("mi-clase");
  });
});
