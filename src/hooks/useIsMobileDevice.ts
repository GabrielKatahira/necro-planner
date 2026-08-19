import { useState, useEffect } from "react";

export function useIsMobileDevice(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIsMobile = () => {
      if (typeof window === "undefined") return false;

      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const isMobileUA = mobileRegex.test(userAgent);

      const isCoarseTouch = window.matchMedia("(pointer: coarse)").matches;

      return isMobileUA && isCoarseTouch;
    };

    setIsMobile(checkIsMobile());
  }, []);

  return isMobile;
}