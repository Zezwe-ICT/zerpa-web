import { getVerticalManifest, normalizeVerticalId, type VerticalManifest } from "@zerpa/vertical-manifests";

export type { VerticalManifest };
export { getVerticalManifest, normalizeVerticalId };

export function workItemLabel(vertical?: string | null): string {
  return getVerticalManifest(vertical).workItemLabel;
}

export function packNavigation(vertical?: string | null) {
  return getVerticalManifest(vertical).navigation;
}
