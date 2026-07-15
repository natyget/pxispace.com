'use client';

import { useSyncExternalStore } from 'react';

const initialState = {
  sidebarCollapsed: false,
  accountPopoverOpen: false,
  activeEventId: null,
  isLiveEvent: false,
  modalStack: [],
};

let state = { ...initialState };
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(partial) {
  state = { ...state, ...partial };
  emit();
}

function getSnapshot() {
  return state;
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Global dashboard shell UI state.
 * Keeps nav, popovers, and overlays in sync.
 */
export function useDashboardShellStore(selector = (value) => value) {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()), () => selector(initialState));
}

export const dashboardShellActions = {
  toggleSidebar() {
    setState({ sidebarCollapsed: !state.sidebarCollapsed });
  },
  setSidebarCollapsed(value) {
    setState({ sidebarCollapsed: !!value });
  },
  setAccountPopoverOpen(value) {
    setState({ accountPopoverOpen: !!value });
  },
  setActiveEventId(eventId) {
    setState({ activeEventId: eventId || null });
  },
  setIsLiveEvent(value) {
    setState({ isLiveEvent: !!value });
  },
  openModal(key, payload = {}) {
    setState({
      modalStack: [...state.modalStack, { id: `${key}-${Date.now()}`, type: 'modal', key, payload }],
    });
  },
  openSlideOver(key, payload = {}) {
    setState({
      modalStack: [...state.modalStack, { id: `${key}-${Date.now()}`, type: 'slideover', key, payload }],
    });
  },
  closeTopLayer() {
    setState({ modalStack: state.modalStack.slice(0, -1) });
  },
  closeLayerById(id) {
    setState({ modalStack: state.modalStack.filter((layer) => layer.id !== id) });
  },
  reset() {
    state = { ...initialState };
    emit();
  },
};
