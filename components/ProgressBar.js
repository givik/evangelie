'use client';

export default function ProgressBar({ progress, visible }) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '3px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: '#0070f3',
          boxShadow: '0 0 10px #0070f3',
          transition: 'width 0.3s ease-out',
        }}
      />
    </div>
  );
}
