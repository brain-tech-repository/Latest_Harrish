import { useState, useEffect, useCallback } from 'react';

export function useHiddenHistory(tableId: string, defaultParams: Record<string, any> = {}) {

    // Helper to get state from history
    const getInitialState = (): Record<string, any> => {
        if (typeof window === 'undefined') return defaultParams;

        // 1. Check History State (Navigation Priority)
        const historyState = window.history.state?.[tableId] || {};

        // 2. Merge: Default < History
        // We explicitly ignore window.location.search as per user request to avoid URL params pollution
        const merged = { ...defaultParams, ...historyState };
        return Object.keys(merged).length > 0 ? merged : defaultParams;
    };

    const [params, setParamsState] = useState<Record<string, any>>(getInitialState);

    // Sync with external events (popstate, custom events)
    useEffect(() => {
        const handleStateChange = (e: PopStateEvent | CustomEvent) => {
            // If popstate (Back/Forward), read from history
            if (e.type === 'popstate') {
                const state = window.history.state?.[tableId];
                // If back to a state without this table's data, check if we should fallback? 
                // No, history state is authoritative for navigation.
                // However, if history state is null, it might mean we went back to a page where we hadn't set state yet?
                // But if we are mounting this component, we likely want *some* state.
                // If history.state is null/undefined for this key, it means "no filter".
                // We should NOT fallback to sessionStorage here because sessionStorage might have "future" state.
                setParamsState(state || {});
            }
            // If custom event, read from detail (for cross-component sync)
            else if (e instanceof CustomEvent && e.detail?.tableId === tableId) {
                setParamsState(e.detail.params);
            }
        };

        window.addEventListener('popstate', handleStateChange);
        window.addEventListener(`hidden-history-change`, handleStateChange as EventListener);

        return () => {
            window.removeEventListener('popstate', handleStateChange);
            window.removeEventListener(`hidden-history-change`, handleStateChange as EventListener);
        };
    }, [tableId]);



    // Removed URL Search Params useEffect as per user request to strictly use Hidden History


    const setParams = useCallback((newParams: Record<string, any>, options?: { replace?: boolean }) => {
        // 1. Update Local State
        setParamsState(newParams);

        // 2. Update History (Push or Replace)
        const currentState = window.history.state || {};
        const nextState = { ...currentState, [tableId]: newParams };

        if (options?.replace) {
            window.history.replaceState(nextState, "", window.location.pathname);
        } else {
            window.history.pushState(nextState, "", window.location.pathname);
        }

        // 3. Dispatch Event
        window.dispatchEvent(new CustomEvent('hidden-history-change', {
            detail: { tableId, params: newParams }
        }));
    }, [tableId]); // Add tableId dependency

    return { params, setParams };
}
