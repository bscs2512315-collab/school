export type ScientificWrapMode = "superscript" | "subscript" | "caret" | "underscore";

export function insertAtSelection(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  insertText: string,
): { value: string; cursor: number } {
  const before = text.slice(0, selectionStart);
  const after = text.slice(selectionEnd);
  const value = `${before}${insertText}${after}`;
  const cursor = selectionStart + insertText.length;
  return { value, cursor };
}

export function wrapSelection(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  mode: ScientificWrapMode,
): { value: string; cursor: number } {
  const selected = text.slice(selectionStart, selectionEnd);
  const before = text.slice(0, selectionStart);
  const after = text.slice(selectionEnd);

  if (mode === "superscript") {
    const inner = selected || "n";
    const wrapped = `(superscript=${inner})`;
    return { value: `${before}${wrapped}${after}`, cursor: before.length + wrapped.length };
  }

  if (mode === "subscript") {
    const inner = selected || "n";
    const wrapped = `(subscript=${inner})`;
    return { value: `${before}${wrapped}${after}`, cursor: before.length + wrapped.length };
  }

  if (mode === "caret") {
    const wrapped = selected ? `^${selected}` : "^";
    return {
      value: `${before}${wrapped}${after}`,
      cursor: before.length + wrapped.length,
    };
  }

  const wrapped = selected ? `_${selected}` : "_";
  return {
    value: `${before}${wrapped}${after}`,
    cursor: before.length + wrapped.length,
  };
}
