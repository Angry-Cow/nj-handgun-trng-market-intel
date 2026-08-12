import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

type WhereFilterValue = string | number | boolean | Date | null;

type WhereFilter =
  | WhereFilterValue
  | {
      eq?: WhereFilterValue;
      ne?: WhereFilterValue;
      in?: WhereFilterValue[];
      nin?: WhereFilterValue[];
      contains?: WhereFilterValue;
      gte?: WhereFilterValue;
      lte?: WhereFilterValue;
      gt?: WhereFilterValue;
      lt?: WhereFilterValue;
    };

type WhereFilters = Record<string, WhereFilter>;

type OrderByFilters = Record<string, "asc" | "desc">;

export type Filters = {
  where?: WhereFilters;
  orderBy?: OrderByFilters;
  limit?: number;
  offset?: number;
};

export type UseQueryParams = string | Filters;

export type UseQueryResult = {
  data: any;
  error: Error | null;
  isPending: boolean;
  refetch: () => void;
};

function applyFilters(query: any, params?: UseQueryParams): any {
  if (!params || typeof params === "string") {
    return query;
  }

  let q = query;

  if (params.where) {
    for (const [column, filter] of Object.entries(params.where)) {
      if (filter === null || filter === undefined) {
        q = q.is(column, null);
        continue;
      }
      if (typeof filter !== "object" || filter instanceof Date) {
        q = q.eq(column, filter);
        continue;
      }
      const f = filter as Record<string, any>;
      if (f.eq !== undefined) q = q.eq(column, f.eq);
      if (f.ne !== undefined) q = q.neq(column, f.ne);
      if (f.in !== undefined) q = q.in(column, f.in);
      if (f.nin !== undefined) {
        for (const v of f.nin) {
          q = q.neq(column, v);
        }
      }
      if (f.contains !== undefined) {
        q = q.ilike(column, `%${f.contains}%`);
      }
      if (f.gte !== undefined) q = q.gte(column, f.gte);
      if (f.lte !== undefined) q = q.lte(column, f.lte);
      if (f.gt !== undefined) q = q.gt(column, f.gt);
      if (f.lt !== undefined) q = q.lt(column, f.lt);
    }
  }

  if (params.orderBy) {
    for (const [column, direction] of Object.entries(params.orderBy)) {
      q = q.order(column, { ascending: direction === "asc" });
    }
  }

  if (params.limit !== undefined) {
    q = q.limit(params.limit);
  }

  if (params.offset !== undefined) {
    q = q.range(params.offset, params.offset + (params.limit ?? 1000) - 1);
  }

  return q;
}

export function useQuery(entityName: string, params?: UseQueryParams): UseQueryResult {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsPending(true);

    let query = supabase.from(entityName).select("*");
    query = applyFilters(query, params);

    query
      .then(({ data: rows, error: err }: { data: any; error: any }) => {
        if (cancelled) return;
        if (err) {
          setError(err as Error);
          setData(null);
        } else {
          setError(null);
          setData(rows ?? []);
        }
        setIsPending(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e);
        setData(null);
        setIsPending(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entityName, JSON.stringify(params), refetchKey]);

  return { data, error, isPending, refetch };
}
