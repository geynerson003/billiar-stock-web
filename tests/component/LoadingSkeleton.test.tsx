import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { LoadingSkeleton } from "../../src/components/common/LoadingSkeleton";

describe("LoadingSkeleton", () => {
  it("renderiza 3 filas por defecto", () => {
    const { container } = render(<LoadingSkeleton />);
    expect(container.querySelectorAll(".skeleton")).toHaveLength(3);
  });

  it("respeta rows y height", () => {
    const { container } = render(<LoadingSkeleton rows={5} height={20} />);
    const items = container.querySelectorAll<HTMLElement>(".skeleton");
    expect(items).toHaveLength(5);
    expect(items[0].style.height).toBe("20px");
  });
});
