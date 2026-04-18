import { DEFAULT_PAGINATION_LIMIT } from "@dub/utils";
import { useMemo } from "react";
import { useTablePagination } from "../table/use-table-pagination";
import { useRouterStuff } from "./use-router-stuff";

export type PaginationState = {
  pageIndex: number;
  pageSize: number;
};

function parsePageParam(pageParam: string | null): number {
  if (!pageParam) return 1;
  const parsed = parseInt(pageParam, 10);
  if (isNaN(parsed) || parsed < 1 || !Number.isInteger(parsed)) {
    return 1;
  }
  return parsed;
}

export function usePagination(pageSize = DEFAULT_PAGINATION_LIMIT) {
  const { searchParams, queryParams } = useRouterStuff();
  const rawPage = searchParams.get("page");

  const page = useMemo(() => parsePageParam(rawPage), [rawPage]);

  const { pagination, setPagination } = useTablePagination({
    pageSize,
    page,
    onPageChange: (p) => {
      const validatedPage = parsePageParam(p.toString());
      if (validatedPage === page) {
        return;
      }
      queryParams(
        validatedPage === 1
          ? { del: "page", scroll: false }
          : {
              set: {
                page: validatedPage.toString(),
              },
              scroll: false,
            },
      );
    },
  });

  return { pagination, setPagination };
}
