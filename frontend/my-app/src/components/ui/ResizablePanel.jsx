import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ResizablePanel.module.css';

const ResizablePanel = ({ 
  children, 
  initialWidth = 400, 
  initialHeight = 300,
  minWidth = 200,
  minHeight = 150,
  maxWidth = 800,
  maxHeight = 600,
  resizable = { right: true, bottom: true, corner: true },
  className = ''
}) => {
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState(null);
  const panelRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startDimensions = useRef({ width: 0, height: 0 });

  const handleMouseDown = useCallback((e, type) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeType(type);
    startPos.current = { x: e.clientX, y: e.clientY };
    startDimensions.current = { ...dimensions };
    document.body.style.cursor = getCursor(type);
    document.body.style.userSelect = 'none';
  }, [dimensions]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !resizeType) return;

    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    
    let newWidth = startDimensions.current.width;
    let newHeight = startDimensions.current.height;

    if (resizeType.includes('right')) {
      newWidth = Math.max(minWidth, Math.min(maxWidth, startDimensions.current.width + deltaX));
    }
    
    if (resizeType.includes('bottom')) {
      newHeight = Math.max(minHeight, Math.min(maxHeight, startDimensions.current.height + deltaY));
    }

    setDimensions({ width: newWidth, height: newHeight });
  }, [isResizing, resizeType, minWidth, maxWidth, minHeight, maxHeight]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeType(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const getCursor = (type) => {
    switch (type) {
      case 'right': return 'ew-resize';
      case 'bottom': return 'ns-resize';
      case 'corner': return 'nw-resize';
      default: return 'default';
    }
  };

  return (
    <div
      ref={panelRef}
      className={`${styles.resizablePanel} ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight
      }}
    >
      <div className={styles.content}>
        {children}
      </div>

      {/* Right resize handle */}
      {resizable.right && (
        <div
          className={`${styles.resizeHandle} ${styles.resizeRight}`}
          onMouseDown={(e) => handleMouseDown(e, 'right')}
        />
      )}

      {/* Bottom resize handle */}
      {resizable.bottom && (
        <div
          className={`${styles.resizeHandle} ${styles.resizeBottom}`}
          onMouseDown={(e) => handleMouseDown(e, 'bottom')}
        />
      )}

      {/* Corner resize handle */}
      {resizable.corner && (
        <div
          className={`${styles.resizeHandle} ${styles.resizeCorner}`}
          onMouseDown={(e) => handleMouseDown(e, 'corner')}
        />
      )}

      {isResizing && <div className={styles.resizeOverlay} />}
    </div>
  );
};

export default ResizablePanel;