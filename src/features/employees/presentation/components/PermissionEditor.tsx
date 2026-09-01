import { useMemo } from "react";
import {
  PERMISSION_GROUPS,
  ROLE_PRESETS,
  getRolePreset,
  type Permission,
} from "../../../../shared/constants";
import { useMarket } from "../../../../shared/hooks";

interface PermissionEditorProps {
  rolePreset: string;
  permissions: string[];
  onChange: (next: { rolePreset: string; permissions: Permission[] }) => void;
}

/**
 * Editor de permisos: selector de preset de rol + checkboxes por permiso.
 * Cambiar de preset (distinto de "Personalizado") reemplaza la selección;
 * tocar un checkbox pasa el preset a "Personalizado".
 */
export function PermissionEditor({ rolePreset, permissions, onChange }: PermissionEditorProps) {
  const market = useMarket();
  const selected = useMemo(() => new Set(permissions), [permissions]);

  const groups = useMemo(
    () => PERMISSION_GROUPS.filter((group) => group.section !== "tables" || market.features.tables),
    [market.features.tables]
  );

  function applyPreset(presetId: string) {
    if (presetId === "custom") {
      onChange({ rolePreset: "custom", permissions: permissions as Permission[] });
      return;
    }
    onChange({ rolePreset: presetId, permissions: [...getRolePreset(presetId).permissions] });
  }

  function togglePermission(permission: Permission) {
    const next = new Set(selected);
    if (next.has(permission)) {
      next.delete(permission);
    } else {
      next.add(permission);
    }
    onChange({ rolePreset: "custom", permissions: [...next] as Permission[] });
  }

  return (
    <div className="stack">
      <label className="field">
        <span>Rol</span>
        <select value={rolePreset} onChange={(event) => applyPreset(event.target.value)}>
          {ROLE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
        <small>{getRolePreset(rolePreset).description}</small>
      </label>

      {groups.map((group) => (
        <fieldset key={group.section} className="panel" style={{ padding: "12px 16px" }}>
          <legend style={{ fontWeight: 700, fontSize: "0.85rem" }}>{group.label}</legend>
          <div className="stack-list">
            {group.items.map((item) => (
              <label
                key={item.id}
                className="list-row"
                style={{ alignItems: "center", gap: "8px" }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => togglePermission(item.id)}
                />
                <span style={{ color: item.destructive ? "var(--danger, #c0392b)" : undefined }}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
