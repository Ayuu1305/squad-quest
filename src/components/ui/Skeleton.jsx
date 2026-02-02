const Skeleton = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse bg-white/10 rounded ${className}`}
      aria-hidden="true"
    />
  );
};

export default Skeleton;
