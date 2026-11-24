import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    THREE?: typeof THREE;
    __HC_BOOTING__?: boolean;
  }
}

async function bootHyperClash() {
  if (window.__HC_BOOTING__) return;
  window.__HC_BOOTING__ = true;

  try {
    // Provide mutable namespace clone so Three.js classes/helpers work reliably across scripts
    window.THREE = Object.assign({}, THREE) as typeof THREE;

    const [engineRes, extRes] = await Promise.all([
      fetch('/hc-engine.js'),
      fetch('/hc-extensions.js'),
    ]);

    if (!engineRes.ok) {
      throw new Error(`Failed to load game engine (${engineRes.status})`);
    }
    if (!extRes.ok) {
      throw new Error(`Failed to load game extensions (${extRes.status})`);
    }

    const [engineCode, extCode] = await Promise.all([engineRes.text(), extRes.text()]);

    const finalCloseIdx = engineCode.lastIndexOf('})();');
    if (finalCloseIdx < 0) {
      throw new Error('Core engine bundle terminator not found.');
    }

    const stitchedScript =
      engineCode.slice(0, finalCloseIdx) +
      '\n\n' +
      extCode +
      '\n\n' +
      engineCode.slice(finalCloseIdx);

    const script = document.createElement('script');
    script.textContent = stitchedScript;
    script.onerror = () => {
      window.dispatchEvent(
        new CustomEvent('hc:booterror', {
          detail: 'The stitched game engine script failed to execute.',
        })
      );
    };
    document.body.appendChild(script);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[HYPER CLASH] boot error:', error);
    window.dispatchEvent(new CustomEvent('hc:booterror', { detail: message }));
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}

void bootHyperClash();
