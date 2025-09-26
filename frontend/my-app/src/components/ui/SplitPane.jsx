import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './SplitPane.module.css';

const SplitPane = ({ 
  leftPane, 
  rightPane, 
  defaultSplit = 50,
  minSplit = 20,
  maxSplit = 80,
  direction = 'horizontal'
}) => {
  const [splitPercentage, setSplitPercentage] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const startPos = useRef(0);
  const startSplit = useRef(0);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSplit.current = splitPercentage;
    document.body.style.cursor = direction === 'horizontal' ? 'ew-resize' : 'ns-resize';
    document.body.style.userSelect = 'none';
  }, [splitPercentage, direction]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerSize = direction === 'horizontal' ? containerRect.width : containerRect.height;
    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const containerStart = direction === 'horizontal' ? containerRect.left : containerRect.top;
    
    const newPercentage = ((currentPos - containerStart) / containerSize) * 100;
    const clampedPercentage = Math.max(minSplit, Math.min(maxSplit, newPercentage));
    
    setSplitPercentage(clampedPercentage);
  }, [isDragging, direction, minSplit, maxSplit]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const splitStyle = direction === 'horizontal' 
    ? { width: `${splitPercentage}%` }
    : { height: `${splitPercentage}%` };

  const remainingStyle = direction === 'horizontal'
    ? { width: `${100 - splitPercentage}%` }
    : { height: `${100 - splitPercentage}%` };

  return (
    <div 
      ref={containerRef}
      className={`${styles.splitPane} ${direction === 'horizontal' ? styles.horizontal : styles.vertical}`}
    >
      <div className={styles.pane} style={splitStyle}>
        {leftPane}
      </div>
      
      <div 
        className={`${styles.splitter} ${isDragging ? styles.splitterActive : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.splitterHandle} />
      </div>
      
      <div className={styles.pane} style={remainingStyle}>
        {rightPane}
      </div>
      
      {isDragging && <div className={styles.dragOverlay} />}
    </div>
  );
};

export default SplitPane;