export type ScientificToken =
  | { type: "text"; value: string }
  | { type: "sup"; value: string }
  | { type: "sub"; value: string }
  | { type: "stacked"; sup: string; sub: string };

export interface ScientificSnippet {
  id: string;
  label: string;
  insert: string;
  group: "math" | "chemistry" | "format" | "greek";
}
