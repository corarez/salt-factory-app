import { useEffect, useState } from 'react';

export default function Titlebar({ title = 'Salt Factory' }) {
  const [isMax, setIsMax] = useState(false);

  useEffect(() => {
    const off = window.windowControls?.onMaximizedChanged?.((v) => setIsMax(!!v));
    return () => { if (typeof off === 'function') off(); };
  }, []);

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 36,
        WebkitAppRegion: 'drag',
        background: '#0f172a',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        userSelect: 'none',
        zIndex: 1000,
        direction:'ltr'

      }}
    >
      {/* Right side: app icon + title (RTL) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 4,
            background: '#22d3ee'
          }}
        />
        <span style={{ fontSize: 12, opacity: 0.85 }}>{title}</span>
      </div>

      {/* Left side: window buttons (no-drag) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          WebkitAppRegion: 'no-drag'
        }}
      >
        <TitlebarBtn onClick={() => window.windowControls?.minimize()} label="—" title="Minimize" />
        <TitlebarBtn
          onClick={() => window.windowControls?.toggleMaximize()}
          label={isMax ? '🗗' : '🗖'}
          title={isMax ? 'Restore' : 'Maximize'}
        />
        <TitlebarBtn
          onClick={() => window.windowControls?.close()}
          label="×"
          title="Close"
          danger
        />
      </div>
    </div>
  );
}

function TitlebarBtn({ onClick, label, title, danger = false }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 46,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        color: 'white',
        border: 'none',
        outline: 'none',
        borderRadius: 6,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = danger ? '#ef4444' : '#1f2937';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span style={{ fontSize: 14 }}>{label}</span>
    </button>
  );
}
