"use client"

import { useEffect, useRef } from 'react';

export function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Star particle properties
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      pulse: number;
    }> = [];
    
    // Create particles
    const createParticles = () => {
      const particleCount = Math.floor(canvas.width * canvas.height / 15000);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.2 + 0.05,
          opacity: Math.random() * 0.5 + 0.2,
          pulse: Math.random() * 0.01
        });
      }
    };
    
    createParticles();
    
    // Animation loop
    let animationFrameId: number;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw cosmic background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0f172a'); // Dark blue
      gradient.addColorStop(0.5, '#1e293b'); // Slate
      gradient.addColorStop(1, '#0f172a'); // Dark blue
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw nebula effects
      const nebulaGradient = ctx.createRadialGradient(
        canvas.width * 0.8,
        canvas.height * 0.2,
        0,
        canvas.width * 0.8,
        canvas.height * 0.2,
        canvas.width * 0.5
      );
      
      nebulaGradient.addColorStop(0, 'rgba(79, 70, 229, 0.15)'); // Indigo
      nebulaGradient.addColorStop(0.5, 'rgba(79, 70, 229, 0.05)');
      nebulaGradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
      
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Second nebula
      const nebulaGradient2 = ctx.createRadialGradient(
        canvas.width * 0.2,
        canvas.height * 0.8,
        0,
        canvas.width * 0.2,
        canvas.height * 0.8,
        canvas.width * 0.4
      );
      
      nebulaGradient2.addColorStop(0, 'rgba(139, 92, 246, 0.1)'); // Purple
      nebulaGradient2.addColorStop(0.5, 'rgba(139, 92, 246, 0.03)');
      nebulaGradient2.addColorStop(1, 'rgba(139, 92, 246, 0)');
      
      ctx.fillStyle = nebulaGradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        // Update position
        particle.y -= particle.speed;
        if (particle.y < -10) {
          particle.y = canvas.height + 10;
          particle.x = Math.random() * canvas.width;
        }
        
        // Pulsating effect
        particle.opacity += particle.pulse;
        if (particle.opacity > 0.7 || particle.opacity < 0.2) {
          particle.pulse = -particle.pulse;
        }
        
        // Draw star
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden rounded-2xl">
      {/* Animated canvas background */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-slate-900/30" />
      
     

      
      {/* Grid overlay */}
      {/* <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(to_right,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" /> */}
    </div>
  );
}
