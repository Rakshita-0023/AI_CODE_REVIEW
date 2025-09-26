import { useRef, useEffect } from 'react';
import lottie from 'lottie-web';
import animationData from '../../assets/Welcome Animation.json';

const WelcomeAnimation = () => {
  const container = useRef(null);

  useEffect(() => {
    if (container.current) {
      const animation = lottie.loadAnimation({
        container: container.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: animationData
      });

      return () => {
        if (animation) {
          animation.destroy();
        }
      };
    }
  }, []);

  return <div ref={container} className="w-full h-full" />;
};

export default WelcomeAnimation;