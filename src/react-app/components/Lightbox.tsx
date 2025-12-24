import { useEffect } from "react";

export default function Lightbox({
  src,
  onClose
}: {
  src: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="pp-lightbox" onClick={onClose}>
      <img src={src} alt="" />
    </div>
  );
}
