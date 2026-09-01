import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BarChart } from "../../src/components/charts/BarChart";

describe("BarChart", () => {
  it("muestra el estado vacío cuando no hay datos finitos", () => {
    render(<BarChart data={[{ label: "a", value: NaN }]} />);
    expect(screen.getByText(/no hay datos disponibles/i)).toBeInTheDocument();
  });

  it("renderiza una barra por dato válido", () => {
    const { container } = render(
      <BarChart data={[{ label: "L", value: 10 }, { label: "M", value: 20 }, { label: "X", value: Infinity }]} />
    );
    expect(container.querySelectorAll(".mini-chart__item")).toHaveLength(2);
  });

  it("por defecto marca la última barra como activa y el header sigue el hover", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BarChart
        data={[{ label: "Lun", value: 5 }, { label: "Mar", value: 8 }]}
        formatValue={(v) => `#${v}`}
      />
    );
    expect(screen.getByText("Mar · #8")).toBeInTheDocument();

    const firstItem = container.querySelectorAll(".mini-chart__item")[0];
    await user.hover(firstItem);
    expect(screen.getByText("Lun · #5")).toBeInTheDocument();
  });

  it("marca las barras negativas", () => {
    const { container } = render(
      <BarChart data={[{ label: "a", value: -3 }, { label: "b", value: 4 }]} />
    );
    expect(container.querySelector(".mini-chart__bar--negative")).not.toBeNull();
  });
});
