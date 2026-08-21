import { useState } from "react";
import { supabase } from "./supabase";
import { emitRefresh } from "./useQuery";

export type UseMutationResult = {
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  remove: (id: string) => Promise<any>;
  error: Error | null;
  isPending: boolean;
};

export function useMutation(entityName: string): UseMutationResult {
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const create = async (record: any) => {
    setIsPending(true);
    setError(null);
    const { data, error: err } = await supabase
      .from(entityName)
      .insert(record)
      .select()
      .single();
    setIsPending(false);
    if (err) {
      setError(err as Error);
      throw err;
    }
    emitRefresh(entityName);
    return data;
  };

  const update = async (id: string, patch: any) => {
    setIsPending(true);
    setError(null);
    const { data, error: err } = await supabase
      .from(entityName)
      .update({ ...patch, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    setIsPending(false);
    if (err) {
      setError(err as Error);
      throw err;
    }
    emitRefresh(entityName);
    return data;
  };

  const remove = async (id: string) => {
    setIsPending(true);
    setError(null);
    const { error: err } = await supabase.from(entityName).delete().eq("id", id);
    setIsPending(false);
    if (err) {
      setError(err as Error);
      throw err;
    }
    emitRefresh(entityName);
    return true;
  };

  return { create, update, remove, error, isPending };
}
