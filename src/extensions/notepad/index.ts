// src/extensions/index.ts
import type { WikiExtension } from "./types";
import { notepadExtension } from "./notepad";

export const extensions: WikiExtension[] = [
  notepadExtension,
  // novas extensões entram aqui
];

export function getExtensionsByFileExtension(ext: string): WikiExtension[] {
  const normalized = ext.startsWith(".") ? ext : `.${ext}`;
  return extensions.filter((e) =>
    e.manifest.fileExtensions?.includes(normalized),
  );
}

export function getExtensionById(id: string): WikiExtension | undefined {
  return extensions.find((e) => e.manifest.id === id);
}

export * from "./types";
