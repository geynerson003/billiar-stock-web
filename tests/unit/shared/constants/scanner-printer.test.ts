import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCANNER_MODE_ID,
  getScannerModeOption,
  isKnownScannerMode,
} from "../../../../src/shared/constants/scanner";
import {
  DEFAULT_PRINTER_FORMAT_ID,
  getPrinterFormatOption,
  isKnownPrinterFormat,
} from "../../../../src/shared/constants/printer";

describe("scanner", () => {
  it("resuelve por id y cae al default", () => {
    expect(getScannerModeOption("hid").id).toBe("hid");
    expect(getScannerModeOption(null).id).toBe(DEFAULT_SCANNER_MODE_ID);
    expect(getScannerModeOption("x").id).toBe(DEFAULT_SCANNER_MODE_ID);
  });
  it("isKnownScannerMode", () => {
    expect(isKnownScannerMode("camera")).toBe(true);
    expect(isKnownScannerMode("laser")).toBe(false);
  });
});

describe("printer", () => {
  it("resuelve por id y cae al default", () => {
    expect(getPrinterFormatOption("a4").id).toBe("a4");
    expect(getPrinterFormatOption(null).id).toBe(DEFAULT_PRINTER_FORMAT_ID);
    expect(getPrinterFormatOption("x").id).toBe(DEFAULT_PRINTER_FORMAT_ID);
  });
  it("isKnownPrinterFormat", () => {
    expect(isKnownPrinterFormat("thermal-58")).toBe(true);
    expect(isKnownPrinterFormat("thermal-99")).toBe(false);
  });
});
