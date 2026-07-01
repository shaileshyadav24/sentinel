import type { JsonApiDocument, JsonApiResource } from "../types/ring";

type Normalized<T> = T & { id: string };

export function normalizeResource<T extends Record<string, unknown>>(
  resource: JsonApiResource<T>,
): Normalized<T> {
  return { id: resource.id, ...resource.attributes };
}

export function normalizeCollection<T extends Record<string, unknown>>(
  resources: JsonApiResource<T>[] | undefined,
): Normalized<T>[] {
  return (resources ?? []).map(normalizeResource);
}

/** Normalizes a single-resource JSON:API document into a plain object. */
export function normalizeOne<T extends Record<string, unknown>>(
  document: JsonApiDocument<T> | undefined,
): Normalized<T> | undefined {
  if (!document?.data || Array.isArray(document.data)) return undefined;
  return normalizeResource(document.data);
}

/** Normalizes a collection JSON:API document into an array of plain objects. */
export function normalizeMany<T extends Record<string, unknown>>(
  document: JsonApiDocument<T> | undefined,
): Normalized<T>[] {
  if (!document?.data) return [];
  return normalizeCollection(Array.isArray(document.data) ? document.data : [document.data]);
}
