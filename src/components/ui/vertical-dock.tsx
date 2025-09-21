'use client';

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from 'framer-motion';
import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

const DOCK_WIDTH = 128;
const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 150;
const DEFAULT_PANEL_WIDTH = 64;

type VerticalDockProps = {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  panelWidth?: number;
  magnification?: number;
  spring?: SpringOptions;
};

type VerticalDockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

type VerticalDockLabelProps = {
  className?: string;
  children: React.ReactNode;
  itemRef?: React.RefObject<HTMLDivElement>;
};

type VerticalDockIconProps = {
  className?: string;
  children: React.ReactNode;
};

type VerticalDocContextType = {
  mouseY: MotionValue;
  spring: SpringOptions;
  magnification: number;
  distance: number;
};

type VerticalDockProviderProps = {
  children: React.ReactNode;
  value: VerticalDocContextType;
};

const VerticalDockContext = createContext<VerticalDocContextType | undefined>(undefined);

function VerticalDockProvider({ children, value }: VerticalDockProviderProps) {
  return <VerticalDockContext.Provider value={value}>{children}</VerticalDockContext.Provider>;
}

function useVerticalDock() {
  const context = useContext(VerticalDockContext);
  if (!context) {
    throw new Error('useVerticalDock must be used within a VerticalDockProvider');
  }
  return context;
}

function VerticalDock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelWidth = DEFAULT_PANEL_WIDTH,
}: VerticalDockProps) {
  const mouseY = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxWidth = useMemo(() => {
    return Math.max(DOCK_WIDTH, magnification + magnification / 2 + 4);
  }, [magnification]);

  const widthRow = useTransform(isHovered, [0, 1], [panelWidth, maxWidth]);
  const width = useSpring(widthRow, spring);

  return (
    <motion.div
      style={{
        width: width,
        scrollbarWidth: 'none',
      }}
      className='my-2 flex max-h-full flex-col items-center overflow-y-auto'
    >
      <motion.div
        onMouseMove={({ pageY }) => {
          isHovered.set(1);
          mouseY.set(pageY);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseY.set(Infinity);
        }}
        className={cn(
          'mx-auto flex h-fit w-fit flex-col gap-4 rounded-2xl bg-gray-50 py-4 dark:bg-neutral-900',
          className
        )}
        style={{ width: panelWidth }}
        role='toolbar'
        aria-label='Feature dock'
      >
        <VerticalDockProvider value={{ mouseY, spring, distance, magnification }}>
          {children}
        </VerticalDockProvider>
      </motion.div>
    </motion.div>
  );
}

function VerticalDockItem({ children, className, onClick }: VerticalDockItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { distance, magnification, mouseY, spring } = useVerticalDock();

  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseY, (val) => {
    const domRect = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - domRect.y - domRect.height / 2;
  });

  const heightTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [40, magnification, 40]
  );

  const height = useSpring(heightTransform, spring);

  return (
    <motion.div
      ref={ref}
      style={{ height }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={cn(
        'relative inline-flex cursor-pointer items-center justify-center',
        className
      )}
      tabIndex={0}
      role='button'
      aria-haspopup='true'
    >
      {Children.map(children, (child) =>
        cloneElement(child as React.ReactElement, { height, isHovered, itemRef: ref })
      )}
    </motion.div>
  );
}

function VerticalDockLabel({ children, className, ...rest }: VerticalDockLabelProps) {
  const restProps = rest as Record<string, unknown>;
  const isHovered = restProps['isHovered'] as MotionValue<number>;
  const itemRef = restProps['itemRef'] as React.RefObject<HTMLDivElement>;

  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = isHovered.on('change', (latest) => {
      setIsVisible(latest === 1);

      if (latest === 1 && itemRef.current) {
        // Calculate optimal tooltip position
        const rect = itemRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const tooltipWidth = 120; // Estimated tooltip width

        // Position to the left of the dock item with some padding
        let x = rect.left - tooltipWidth - 16;
        let y = rect.top + rect.height / 2;

        // If tooltip would go off the left edge, position it to the right
        if (x < 16) {
          x = rect.right + 16;
        }

        // Ensure tooltip doesn't go off the right edge either
        if (x + tooltipWidth > viewportWidth - 16) {
          x = viewportWidth - tooltipWidth - 16;
        }

        // Ensure tooltip doesn't go off the top or bottom
        if (y < 30) {
          y = 30;
        } else if (y > window.innerHeight - 30) {
          y = window.innerHeight - 30;
        }

        setPosition({ x, y });
      }
    });

    return () => unsubscribe();
  }, [isHovered, itemRef]);

  if (!mounted || typeof window === 'undefined') return null;

  const tooltipElement = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'fixed pointer-events-none select-none rounded-md border border-gray-200 bg-white/95 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-gray-900 shadow-lg dark:border-gray-700 dark:bg-gray-800/95 dark:text-gray-100',
            'z-[9999]', // Very high z-index to appear above everything
            className
          )}
          style={{
            left: position.x,
            top: position.y,
            transform: 'translateY(-50%)',
          }}
          role='tooltip'
          aria-hidden='true'
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(tooltipElement, document.body);
}

function VerticalDockIcon({ children, className, ...rest }: VerticalDockIconProps) {
  const restProps = rest as Record<string, unknown>;
  const height = restProps['height'] as MotionValue<number>;

  const heightTransform = useTransform(height, (val) => val / 2);

  return (
    <motion.div
      style={{ height: heightTransform }}
      className={cn('flex items-center justify-center', className)}
    >
      {children}
    </motion.div>
  );
}

export { VerticalDock, VerticalDockIcon, VerticalDockItem, VerticalDockLabel };