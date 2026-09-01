import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../../src/components/common/StatCard";

describe("StatCard", () => {
  it("renderiza label y value", () => {
    render(<StatCard label="Ingresos" value="$100" />);
    expect(screen.getByText("Ingresos")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
  });

  it("aplica la clase del tono (default blue)", () => {
    const { container, rerender } = render(<StatCard label="l" value="v" />);
    expect(container.querySelector(".stat-card")).toHaveClass("stat-card--blue");
    rerender(<StatCard label="l" value="v" tone="red" />);
    expect(container.querySelector(".stat-card")).toHaveClass("stat-card--red");
  });

  it("muestra el helper sólo cuando se pasa", () => {
    const { rerender } = render(<StatCard label="l" value="v" />);
    expect(screen.queryByText("+5%")).not.toBeInTheDocument();
    rerender(<StatCard label="l" value="v" helper="+5%" helperTone="up" />);
    expect(screen.getByText("+5%")).toHaveClass("stat-card__helper--up");
  });
});
