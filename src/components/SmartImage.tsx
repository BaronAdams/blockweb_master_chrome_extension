import { useEffect, useRef, useState } from "react";

type SmartImageProps = {
  src: string;
  fallbackSrc: string;
  alt?: string;
  className?: string;
  retryDelay?: number; // ms (default: 10s)
  maxRetries?: number; // limite pour éviter boucle infinie
};

export default function SmartImage({
  src,
  fallbackSrc,
  alt = "",
  className,
  retryDelay = 5000,
  maxRetries = 10,
}: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const retryCount = useRef(0);
  const intervalRef = useRef<number | null>(null);

  // 🔥 Gestion erreur image
  const handleError = () => {
    if (!hasError) {
      setCurrentSrc(fallbackSrc);
      setHasError(true);
    }
  };

  // 🔁 Retry quand internet revient
  useEffect(() => {
    const handleOnline = () => {
      if (hasError && retryCount.current < maxRetries) {
        retryCount.current++;
        setCurrentSrc(`${src}?t=${Date.now()}`);
        setHasError(false);
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [hasError, src, maxRetries]);

  // 🔁 Retry périodique (même si event online ne trigger pas)
  useEffect(() => {
    if (!hasError) return;

    intervalRef.current = window.setInterval(() => {
      if (retryCount.current >= maxRetries) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      retryCount.current++;
      setCurrentSrc(`${src}?t=${Date.now()}`);
      setHasError(false);
    }, retryDelay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasError, retryDelay, src, maxRetries]);

  // 🔄 Si le src change (important en React)
  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    retryCount.current = 0;
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className + " text-white"}
      onError={handleError}
    />
  );
}