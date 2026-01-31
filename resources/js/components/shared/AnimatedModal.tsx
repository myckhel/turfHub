import { useGSAP } from '@gsap/react';
import { Modal } from 'antd';
import { gsap } from 'gsap';
import React, { useRef } from 'react';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (isOpen && modalRef.current && overlayRef.current) {
      // Entrance animation
      gsap.set(modalRef.current, { scale: 0.8, opacity: 0 });
      gsap.set(overlayRef.current, { opacity: 0 });

      const tl = gsap.timeline();

      tl.to(overlayRef.current, {
        opacity: 1,
        duration: 0.2,
        ease: 'power2.out',
      }).to(
        modalRef.current,
        {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: 'back.out(1.7)',
        },
        '-=0.1',
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    if (modalRef.current && overlayRef.current) {
      const tl = gsap.timeline({
        onComplete: onClose,
      });

      tl.to(modalRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
      }).to(
        overlayRef.current,
        {
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in',
        },
        '-=0.1',
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      title={title}
      footer={null}
      destroyOnClose
      maskClosable
      className="animated-modal"
      getContainer={() => document.body}
      mask={false} // We'll handle our own mask for animation
      modalRender={(modal) => (
        <div className="fixed inset-0 z-50">
          {/* Custom animated overlay */}
          <div ref={overlayRef} className="bg-opacity-50 absolute inset-0 bg-black" onClick={handleClose} />

          {/* Modal content */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <div ref={modalRef} className="relative">
              {modal}
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </Modal>
  );
};

// Example usage component
export const ModalExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>Open Animated Modal</button>

      <AnimatedModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Animated Modal">
        <div className="p-6">
          <p>This modal has smooth GSAP animations!</p>
          <p>The entrance uses a scale and opacity animation with a back ease.</p>
          <p>The exit uses a reverse scale and fade animation.</p>
        </div>
      </AnimatedModal>
    </div>
  );
};
