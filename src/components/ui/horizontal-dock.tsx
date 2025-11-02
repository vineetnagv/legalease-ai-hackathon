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

const DOCK_HEIGHT = 128;
const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 150;
const DEFAULT_PANEL_HEIGHT = 64;

type HorizontalDockProps = {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  panelHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
};

type HorizontalDockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

type HorizontalDockLabelProps = {
  className?: string;
  children: React.ReactNode;
  itemRef?: React.RefObject<HTMLDivElement>;
};

type HorizontalDockIconProps = {
  className?: string;
  children: React.ReactNode;
};

type HorizontalDocContextType = {
  mouseX: MotionValue;
  spring: SpringOptions;
  magnification: number;
  distance: number;
};

type HorizontalDockProviderProps = {
  children: React.ReactNode;
  value: HorizontalDocContextType;
};

const HorizontalDockContext = createContext<HorizontalDocContextType | undefined>(undefined);

function HorizontalDockProvider({ children, value }: HorizontalDockProviderProps) {
  return <HorizontalDockContext.Provider value={value}>{children}</HorizontalDockContext.Provider>;
}

function useHorizontalDock() {
  const context = useContext(HorizontalDockContext);
  if (!context) {
    throw new Error('useHorizontalDock must be used within a HorizontalDockProvider');
  }
  return context;
}

function HorizontalDock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
}: HorizontalDockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(() => {
    return Math.max(DOCK_HEIGHT, magnification + magnification / 2 + 4);
  }, [magnification]);

  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div
      style={{
        height: height,
        scrollbarWidth: 'none',
      }}
      className='mx-2 flex max-w-full flex-row items-center overflow-x-auto'
    >
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={cn(
          'my-auto flex h-fit w-fit flex-row gap-4 rounded-2xl bg-gray-50 px-4 dark:bg-neutral-900',
          className
        )}
        style={{ height: panelHeight }}
        role='toolbar'
        aria-label='Feature dock'
      >
        <HorizontalDockProvider value={{ mouseX, spring, distance, magnification }}>
          {children}
        </HorizontalDockProvider>
      </motion.div>
    </motion.div>
  );
}

function HorizontalDockItem({ children, className, onClick }: HorizontalDockItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { distance, magnification, mouseX, spring } = useHorizontalDock();

  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const domRect = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - domRect.x - domRect.width / 2;
  });

  const widthTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [40, magnification, 40]
  );

  const width = useSpring(widthTransform, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width }}
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
        cloneElement(child as React.ReactElement, { width, isHovered, itemRef: ref })
      )}
    </motion.div>
  );
}

function HorizontalDockLabel({ children, className, ...rest }: HorizontalDockLabelProps) {
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
        // Calculate optimal tooltip position for horizontal dock
        const rect = itemRef.current.getBoundingClientRect();
        const tooltipWidth = 120; // Estimated tooltip width
        const tooltipHeight = 32; // Estimated tooltip height

        // Center the tooltip horizontally relative to the dock item
        let x = rect.left + rect.width / 2 - tooltipWidth / 2;

        // Position above the dock item with some padding
        let y = rect.top - tooltipHeight - 16;

        // If tooltip would go off the top edge, position it below
        if (y < 16) {
          y = rect.bottom + 16;
        }

        // Ensure tooltip doesn't go off the left or right edge
        if (x < 16) {
          x = 16;
        } else if (x + tooltipWidth > window.innerWidth - 16) {
          x = window.innerWidth - tooltipWidth - 16;
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

function HorizontalDockIcon({ children, className, ...rest }: HorizontalDockIconProps) {
  const restProps = rest as Record<string, unknown>;
  const width = restProps['width'] as MotionValue<number>;

  const widthTransform = useTransform(width, (val) => val / 2);

  return (
    <motion.div
      style={{ width: widthTransform }}
      className={cn('flex items-center justify-center', className)}
    >
      {children}
    </motion.div>
  );
}

export { HorizontalDock, HorizontalDockIcon, HorizontalDockItem, HorizontalDockLabel };
