import { DEFAULT_PAGINATION_LIMIT } from "@dub/utils";
import { useEffect, useMemo, useRef } from "react";
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

  const currentUrlPage = useMemo(() => parsePageParam(rawPage), [rawPage]);

  const lastSyncedPage = useRef(currentUrlPage);

  const { pagination, setPagination } = useTablePagination({
    pageSize,
    page: currentUrlPage,
  });

  useEffect(() => {
    lastSyncedPage.current = currentUrlPage;
  }, [currentUrlPage]);

  useEffect(() => {
    if (pagination.pageIndex !== lastSyncedPage.current) {
      lastSyncedPage.current = pagination.pageIndex;
      queryParams(
        pagination.pageIndex === 1
          ? { del: "page", scroll: false }
          : {
              set: {
                page: pagination.pageIndex.toString(),
              },
              scroll: false,
            },
      );
    }
  }, [pagination.pageIndex]);

  return { pagination, setPagination };
}
