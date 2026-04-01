// Overlay modal dialog with backdrop, title bar, and close button.
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, children, wide = false }: ModalProps) {
  // Lock body scroll while the modal is open; restore on close or unmount.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div
        className={`relative bg-card rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] p-6
          ${wide ? 'max-w-2xl' : 'max-w-lg'} w-full mx-4 max-h-[90vh] overflow-y-auto
          animate-[popIn_0.2s_ease-out]`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-charcoal">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-bg rounded-lg flex items-center justify-center text-soft
              hover:bg-border transition-colors text-lg leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
