import {
  defaultLinksDisplayProperties,
  LinksDisplayProperty,
  linksSortOptions,
  LinksSortSlug,
  LinksViewMode,
  linksViewModes,
} from "@/lib/links/links-display";
import { useWorkspacePreferences } from "@/lib/swr/use-workspace-preferences";
import { linksDisplaySchema } from "@/lib/zod/schemas/workspace-preferences";
import { useSearchParams } from "next/navigation";
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as z from "zod/v4";

type LinksDisplayKey = keyof z.infer<typeof linksDisplaySchema>;
type LinksDisplayValue<K extends LinksDisplayKey> = z.infer<
  typeof linksDisplaySchema
>[K];

function useLinksDisplayOption<K extends LinksDisplayKey>(
  key: K,
  persisted: z.infer<typeof linksDisplaySchema>,
  overrideValue?: LinksDisplayValue<K>,
): [
  LinksDisplayValue<K>,
  Dispatch<SetStateAction<LinksDisplayValue<K>>>,
  () => void,
] {
  const [value, setValue] = useState(overrideValue ?? persisted[key]);
  const lastOverrideValue = useRef(overrideValue);

  useEffect(() => {
    if (overrideValue !== lastOverrideValue.current) {
      lastOverrideValue.current = overrideValue;
      if (overrideValue !== undefined) {
        setValue(overrideValue);
      }
    }
  }, [overrideValue]);

  return [value, setValue, () => setValue(persisted[key])];
}

export const LinksDisplayContext = createContext<{
  viewMode: LinksViewMode;
  setViewMode: Dispatch<SetStateAction<LinksViewMode>>;
  displayProperties: LinksDisplayProperty[];
  setDisplayProperties: Dispatch<SetStateAction<LinksDisplayProperty[]>>;
  sortBy: LinksSortSlug;
  setSort: Dispatch<SetStateAction<LinksSortSlug>>;
  showArchived: boolean;
  setShowArchived: Dispatch<SetStateAction<boolean>>;
  isDirty: boolean;
  persist: () => void;
  reset: () => void;
}>({
  viewMode: "cards",
  setViewMode: () => {},
  displayProperties: defaultLinksDisplayProperties,
  setDisplayProperties: () => {},
  sortBy: linksSortOptions[0].slug,
  setSort: () => {},
  showArchived: false,
  setShowArchived: () => {},
  /** Whether the current values differ from the persisted values */
  isDirty: false,
  /** Updates the persisted values to the current values */
  persist: () => {},
  /** Resets the current values to the persisted values */
  reset: () => {},
});

function isValidSortSlug(slug: string): slug is LinksSortSlug {
  return linksSortOptions.some((option) => option.slug === slug);
}

function parseSortParam(sortParam: string | null): LinksSortSlug | undefined {
  if (!sortParam) return undefined;
  if (isValidSortSlug(sortParam)) {
    return sortParam;
  }
  return undefined;
}

function parseBooleanParam(
  param: string | null,
): boolean | undefined {
  if (!param) return undefined;
  const lower = param.toLowerCase().trim();
  if (lower === "true" || lower === "1" || lower === "yes") {
    return true;
  }
  if (lower === "false" || lower === "0" || lower === "no") {
    return false;
  }
  return undefined;
}

export function LinksDisplayProvider({ children }: PropsWithChildren) {
  const searchParams = useSearchParams();
  const sortRaw = searchParams?.get("sortBy");
  const sortLegacyRaw = searchParams?.get("sort");
  const showArchivedRaw = searchParams?.get("showArchived");

  const [persisted, setPersisted] = useWorkspacePreferences("linksDisplay", {
    viewMode: linksViewModes[0],
    sortBy: linksSortOptions[0].slug,
    showArchived: false,
    displayProperties: defaultLinksDisplayProperties,
  });

  const [viewMode, setViewMode, resetViewMode] = useLinksDisplayOption(
    "viewMode",
    persisted!,
  );

  const sortOverride = parseSortParam(sortRaw) ?? parseSortParam(sortLegacyRaw);

  const [sortBy, setSort, resetSort] = useLinksDisplayOption(
    "sortBy",
    persisted!,
    sortOverride,
  );

  const showArchivedOverride = parseBooleanParam(showArchivedRaw);

  const [showArchived, setShowArchived, resetShowArchived] =
    useLinksDisplayOption(
      "showArchived",
      persisted!,
      showArchivedOverride,
    );

  const [displayProperties, setDisplayProperties, resetDisplayProperties] =
    useLinksDisplayOption("displayProperties", persisted!);

  const isDirty = useMemo(() => {
    if (viewMode !== persisted?.viewMode) return true;
    if (sortBy !== persisted?.sortBy) return true;
    if (showArchived !== persisted?.showArchived) return true;
    if (
      displayProperties.slice().sort().join(",") !==
      persisted?.displayProperties.slice().sort().join(",")
    )
      return true;

    return false;
  }, [
    JSON.stringify(persisted),
    viewMode,
    sortBy,
    showArchived,
    displayProperties,
  ]);

  return (
    <LinksDisplayContext.Provider
      value={{
        viewMode: viewMode as LinksViewMode,
        setViewMode,
        displayProperties,
        setDisplayProperties,
        sortBy: sortBy as LinksSortSlug,
        setSort,
        showArchived,
        setShowArchived,
        isDirty,
        persist: () =>
          setPersisted({
            viewMode,
            sortBy,
            showArchived,
            displayProperties,
          }),
        reset: () => {
          resetViewMode();
          resetDisplayProperties();
          resetSort();
          resetShowArchived();
        },
      }}
    >
      {children}
    </LinksDisplayContext.Provider>
  );
}
