export default function Lightbox({ src, onClose }: any) {
  return (
    <div className="pp-lightbox" onClick={onClose}>
      <img src={src} alt="" />
    </div>
  );
}
