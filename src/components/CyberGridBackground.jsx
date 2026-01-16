import { useEffect, useRef } from "react";

const CyberGridBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let width, height;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    // Grid properties
    const gridSize = 40;
    const perspective = 300;
    let offset = 0;

    // Mouse interaction
    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const drawGrid = () => {
      ctx.fillStyle = "#030014"; // Dark background
      ctx.fillRect(0, 0, width, height);

      // Animation speed
      offset = (offset + 0.5) % gridSize;

      ctx.save();

      // Horizon gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(168, 85, 247, 0)"); // Transparent purple top
      gradient.addColorStop(0.2, "rgba(168, 85, 247, 0.05)");
      gradient.addColorStop(1, "rgba(168, 85, 247, 0.15)"); // Stronger purple bottom

      ctx.strokeStyle = "#a855f7"; // Neon Purple
      ctx.lineWidth = 1;

      // Draw Vertical Lines with Perspective
      // We start from center and go outwards
      const centerX = width / 2;
      const fov = 600;

      for (let x = -width; x < width * 2; x += gridSize) {
        // Perspective distortion
        // Simple 3D projection approximation
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);

        // Dynamic opacity based on mouse proximity
        const distX = Math.abs(x - mouse.x);
        const opacity = Math.max(0.05, 1 - distX / 500) * 0.3; // Highlight near mouse

        ctx.strokeStyle = `rgba(168, 85, 247, ${opacity})`;
        ctx.stroke();
      }

      // Draw Horizontal Lines (Moving down)
      for (let y = -gridSize + offset; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);

        const distY = Math.abs(y - mouse.y);
        const opacity = Math.max(0.05, 1 - distY / 500) * 0.3;

        ctx.strokeStyle = `rgba(168, 85, 247, ${opacity})`;
        ctx.stroke();
      }

      // Digital Rain / Particles effect
      // Random shimmering pixels
      for (let i = 0; i < 20; i++) {
        const px = Math.random() * width;
        const py = Math.random() * height;
        if (Math.random() > 0.95) {
          ctx.fillStyle = "rgba(168, 85, 247, 0.8)";
          ctx.fillRect(px, py, 2, 2);
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(drawGrid);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    resize();
    drawGrid();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
};

export default CyberGridBackground;
