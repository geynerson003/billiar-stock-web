import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordField } from "../../src/features/auth/presentation/components/PasswordField";

function ControlledPasswordField({ onChange }: { onChange: (v: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <PasswordField
      label="Clave"
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

describe("PasswordField", () => {
  it("empieza como input de tipo password y alterna a text", async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Contraseña" value="secreto" onChange={() => {}} />);
    const input = screen.getByLabelText("Contraseña");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(input).toHaveAttribute("type", "text");
  });

  it("propaga el valor tecleado via onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledPasswordField onChange={onChange} />);
    await user.type(screen.getByLabelText("Clave"), "abc");
    expect(onChange).toHaveBeenLastCalledWith("abc");
  });
});
