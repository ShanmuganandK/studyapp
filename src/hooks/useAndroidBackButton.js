import { useEffect, useRef } from 'react';
import { registerBackButtonListener } from '../services/platform';
import { backAction } from '../services/backButton';

/**
 * useAndroidBackButton — wires the Android Back button to `backAction`. A no-op on the web.
 * `state` is read through a ref so the native listener is registered once, not on every render.
 *
 * @param {{ isGateOpen: boolean, currentView: string }} state
 * @param {{ closeGate: () => void, goToSkills: () => void }} handlers
 */
export default function useAndroidBackButton(state, handlers) {
  const latest = useRef({ state, handlers });
  latest.current = { state, handlers };

  useEffect(() => {
    return registerBackButtonListener((exitApp) => {
      const { state: cur, handlers: fns } = latest.current;
      const action = backAction(cur);
      if (action === 'close-gate') fns.closeGate();
      else if (action === 'go-skills') fns.goToSkills();
      else exitApp();
    });
  }, []);
}
