import type { TranslateFn } from "@/utils/helpers";

// Management creates a handful of built-in records with English names
// (management/server/types/policy.go, types/group.go). They arrive as data, but
// operators only ever read them as Cloink UI chrome, so the dashboard renders the
// localized label instead. Renaming a record in the UI keeps its own name.
const ALL_GROUP_NAME = "All";

const DEFAULT_POLICY_NAMES = new Set(["Default"]);

const DEFAULT_POLICY_DESCRIPTIONS = new Set([
  "This is a default rule that allows connections between all the resources",
  "This is a default policy that allows connections between all the resources",
]);

export function localizeGroupName(
  name: string | undefined,
  t: TranslateFn,
): string {
  if (!name) return "";
  return name === ALL_GROUP_NAME ? t("groups.allGroupName") : name;
}

export function localizePolicyName(
  name: string | undefined,
  t: TranslateFn,
): string {
  if (!name) return "";
  return DEFAULT_POLICY_NAMES.has(name)
    ? t("accessControl.defaultPolicyName")
    : name;
}

export function localizePolicyDescription(
  name: string | undefined,
  description: string | undefined,
  t: TranslateFn,
): string {
  if (!description) return "";
  if (!DEFAULT_POLICY_NAMES.has(name ?? "")) return description;
  return DEFAULT_POLICY_DESCRIPTIONS.has(description)
    ? t("accessControl.defaultPolicyDescription")
    : description;
}
