'use client';

import Modal from '@/components/ui/Modal';
import SlideOver from '@/components/ui/SlideOver';

export default function DashboardModalHost({ stack = [], onCloseTop, renderers = {} }) {
  if (!stack.length) return null;

  return (
    <>
      {stack.map((layer, index) => {
        const renderer = renderers[layer.key];
        if (!renderer) return null;
        const content = renderer(layer.payload, layer);
        const isTopLayer = index === stack.length - 1;
        if (layer.type === 'slideover') {
          return (
            <SlideOver
              key={layer.id}
              open
              onClose={() => isTopLayer && onCloseTop?.()}
              title={content.title}
              description={content.description}
              size={content.size}
              footer={content.footer}
            >
              {content.body}
            </SlideOver>
          );
        }

        return (
          <Modal
            key={layer.id}
            open
            onClose={() => isTopLayer && onCloseTop?.()}
            title={content.title}
            description={content.description}
            footer={content.footer}
            maxWidth={content.maxWidth}
          >
            {content.body}
          </Modal>
        );
      })}
    </>
  );
}
