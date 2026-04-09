import { useRef } from 'react';
import { Player } from '@lordicon/react';

interface Props {
  icon: object;
  size?: number;
  /**
   * "hover"  — plays from beginning on mouse enter (default for nav items)
   * "loop"   — plays continuously
   * "once"   — plays once on mount
   * "none"   — manual control only
   */
  trigger?: 'hover' | 'loop' | 'once' | 'none';
  colors?: string;
  colorize?: string;
  className?: string;
}

export default function LordIcon({
  icon,
  size = 20,
  trigger = 'hover',
  colors,
  colorize,
  className,
}: Props) {
  const playerRef = useRef<Player>(null);

  function handleMouseEnter() {
    if (trigger === 'hover') {
      playerRef.current?.playFromBeginning();
    }
  }

  return (
    <span
      className={className}
      onMouseEnter={handleMouseEnter}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <Player
        ref={playerRef}
        icon={icon}
        size={size}
        colors={colors}
        colorize={colorize}
        onReady={() => {
          // Force full element initialization to prevent lottie-web destroy error on unmount
          playerRef.current?.seek(0);
          if (trigger === 'loop') playerRef.current?.play();
          if (trigger === 'once') playerRef.current?.playFromBeginning();
        }}
      />
    </span>
  );
}
