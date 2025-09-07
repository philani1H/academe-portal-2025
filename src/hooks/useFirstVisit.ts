import { useState, useEffect } from 'react';

const useFirstVisit = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      localStorage.setItem('hasVisited', 'true');
      setIsFirstVisit(true);
    } else {
      setIsFirstVisit(false);
    }
  }, []);

  return isFirstVisit;
};

export default useFirstVisit;