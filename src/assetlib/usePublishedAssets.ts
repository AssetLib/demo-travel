import type { DynamicAssetRef } from '@assetlib/sdk-core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAssetConnection } from './Connection';

type PageState = {
  owner: object | null;
  revision: number;
  items: DynamicAssetRef[];
  nextCursor: string | null;
  sequence: number | undefined;
  loading: boolean;
  error: string | null;
};
const initial: PageState = { owner: null, revision: -1, items: [], nextCursor: null, sequence: undefined, loading: false, error: null };

export function usePublishedAssets() {
  const { client, revision } = useAssetConnection();
  const [page, setPage] = useState<PageState>(initial);
  const pageRef = useRef(page);
  const generation = useRef(0);
  const request = useRef<AbortController | null>(null);

  const load = useCallback(async (first = false) => {
    if (!client || request.current) return;
    const current = pageRef.current;
    if (!first && current.sequence !== undefined && !current.nextCursor) return;
    const owner = generation.current;
    const controller = new AbortController();
    request.current = controller;
    setPage(previous => ({ ...(first ? initial : previous), owner: client, revision, loading: true, error: null }));
    try {
      const result = await client.loadAssetPage({
        limit: 12,
        cursor: first ? undefined : current.nextCursor ?? undefined,
        sequence: first ? undefined : current.sequence,
        signal: controller.signal,
      });
      if (controller.signal.aborted || owner !== generation.current) return;
      const previous = first ? [] : current.items;
      const seen = new Set(previous.map(item => item.assetId));
      const next = { owner: client, revision, items: [...previous, ...result.items.filter(item => !seen.has(item.assetId))], nextCursor: result.nextCursor, sequence: result.sequence, loading: false, error: null };
      pageRef.current = next;
      setPage(next);
    } catch {
      if (controller.signal.aborted || owner !== generation.current) return;
      setPage(previous => ({ ...previous, loading: false, error: 'More artwork could not be loaded. Try again when you have a connection.' }));
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, [client, revision]);

  useEffect(() => {
    generation.current += 1;
    request.current?.abort();
    request.current = null;
    pageRef.current = initial;
    void load(true);
    return () => {
      generation.current += 1;
      request.current?.abort();
      request.current = null;
    };
  }, [client, revision, load]);

  const currentPage = page.owner === client && page.revision === revision ? page : initial;
  return { ...currentPage, loadMore: () => void load(pageRef.current.sequence === undefined) };
}
