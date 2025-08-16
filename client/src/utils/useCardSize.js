import { useEffect, useState } from 'react';

const calcSize = (w = typeof window !== 'undefined' ? window.innerWidth : 1280) => {
  if (w >= 1280) return { width: 88, height: 132, rank: 18, corner: 20, pip: 32 };
  if (w >= 768) return { width: 76, height: 114, rank: 16, corner: 18, pip: 28 };
  return { width: 64, height: 96, rank: 14, corner: 16, pip: 24 };
};

export default function useCardSize() {
  const [size, setSize] = useState(calcSize());
  useEffect(() => {
    const onResize = () => setSize(calcSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

export { calcSize };
