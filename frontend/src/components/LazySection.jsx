import React, { useState, useEffect, useRef, Suspense } from "react";

/**
 * A wrapper component that delays the rendering (and thus the loading) of its contents
 * until it is close to the viewport. This dramatically reduces 'Unused JavaScript' 
 * and initial payload size for long landing pages.
 */
const LazySection = ({ children, threshold = 0.1, rootMargin = "200px" }) => {
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    // If the browser doesn't support IntersectionObserver, just show it immediately
    if (!window.IntersectionObserver) {
      setHasBeenVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={sectionRef} className="min-h-[100px]">
      {hasBeenVisible ? (
        <Suspense fallback={<div className="h-20" />}>
          {children}
        </Suspense>
      ) : (
        <div className="h-20" /> /* Placeholder while waiting for scroll */
      )}
    </div>
  );
};

export default LazySection;
