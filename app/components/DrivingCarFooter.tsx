'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// 速度仪表盘组件
function Speedometer({ speed }: { speed: number }) {
  const rotation = (speed / 300) * 270 - 135;
  
  return (
    <div className="absolute top-4 right-4 w-16 h-16 bg-slate-900/80 rounded-full border-2 border-slate-700 flex items-center justify-center backdrop-blur-sm">
      <div className="relative w-12 h-12">
        {/* 刻度 */}
        {[...Array(9)].map((_, i) => {
          const angle = -135 + (i * 33.75);
          return (
            <div
              key={i}
              className="absolute w-0.5 h-1 bg-slate-500 origin-bottom"
              style={{
                left: '50%',
                bottom: '50%',
                transform: `rotate(${angle}deg) translateY(-20px)`,
              }}
            />
          );
        })}
        {/* 指针 */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="absolute left-1/2 bottom-1/2 w-0.5 h-4 bg-red-500 origin-bottom -translate-x-1/2"
          style={{ transformOrigin: 'center bottom' }}
        />
        {/* 中心 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-slate-300 rounded-full" />
      </div>
      <span className="absolute -bottom-1 text-[8px] text-slate-400">{Math.round(speed)}</span>
    </div>
  );
}

// 路灯掠影组件
function StreetLights() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ x: ['110vw', '-20vw'] }}
          transition={{ 
            repeat: Infinity, 
            duration: 2 + i * 0.4, 
            delay: i * 0.8,
            ease: 'linear',
          }}
          className="absolute top-0 h-full w-1 bg-gradient-to-b from-yellow-400/20 via-transparent to-transparent blur-sm"
          style={{ left: `${i * 20}%` }}
        />
      ))}
    </div>
  );
}

// 尾气粒子系统
function ExhaustParticles() {
  return (
    <div className="absolute -left-8 top-8">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            x: [-5 - i * 3, -60 - i * 8],
            y: [0, (Math.random() - 0.5) * 20],
            scale: [0.3 + i * 0.1, 1.5 + i * 0.2],
            opacity: [0.8, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.2 + i * 0.15,
            delay: i * 0.15,
            ease: 'easeOut',
          }}
          className="absolute w-3 h-3 bg-slate-400/40 rounded-full blur-md"
        />
      ))}
      {/* 热浪扭曲效果 */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="absolute -left-4 top-2 w-8 h-12 bg-gradient-to-t from-transparent via-orange-500/20 to-transparent blur-xl"
      />
    </div>
  );
}

// 车轮组件
function Wheel({ isFront }: { isFront: boolean }) {
  return (
    <div className="relative">
      {/* 轮胎 */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.4, ease: 'linear' }}
        className="w-12 h-12 md:w-14 md:h-14 bg-slate-950 rounded-full border-2 border-slate-800 flex items-center justify-center relative overflow-hidden"
      >
        {/* 胎纹 */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-0.5 bg-slate-800"
            style={{ transform: `rotate(${i * 22.5}deg)` }}
          />
        ))}
        
        {/* 轮毂 */}
        <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full border border-slate-600 flex items-center justify-center">
          {/* 辐条 */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-6 bg-slate-500 origin-bottom"
              style={{ 
                bottom: '50%',
                left: '50%',
                transform: `translateX(-50%) rotate(${i * 72}deg)`,
                transformOrigin: 'center bottom',
              }}
            />
          ))}
          {/* 中心盖 */}
          <div className="w-3 h-3 bg-slate-400 rounded-full border border-slate-300" />
        </div>
        
        {/* 刹车盘发光效果 */}
        <motion.div
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ repeat: Infinity, duration: 0.2 }}
          className="absolute inset-1 bg-orange-500/20 rounded-full blur-md"
        />
      </motion.div>
      
      {/* 地面接触阴影 */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-2 bg-black/60 blur-sm rounded-full" />
    </div>
  );
}

// 主跑车组件
function SportsCar() {
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    if (isHovered) {
      controls.start({
        y: [0, -3, 0],
        transition: { duration: 0.15, repeat: Infinity },
      });
    } else {
      controls.start({
        y: [0, -2, 0],
        transition: { duration: 0.6, repeat: Infinity },
      });
    }
  }, [isHovered, controls]);

  return (
    <motion.div
      animate={controls}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative z-20 cursor-pointer group"
    >
      {/* 车底动态阴影 */}
      <motion.div
        animate={{ 
          scale: isHovered ? [1, 0.9, 1] : [1, 0.95, 1],
          opacity: isHovered ? [0.7, 0.4, 0.7] : [0.6, 0.4, 0.6],
        }}
        transition={{ repeat: Infinity, duration: isHovered ? 0.15 : 0.6 }}
        className="absolute -bottom-3 left-4 w-48 h-6 bg-black/50 blur-xl rounded-full"
      />

      {/* 车灯光束 */}
      <motion.div
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute -right-32 top-4 w-32 h-16 bg-gradient-to-r from-yellow-300/40 to-transparent blur-xl rounded-full"
        style={{ clipPath: 'polygon(0 20%, 100% 0, 100% 100%, 0 80%)' }}
      />
      
      {/* 尾灯拖影 */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className="absolute -left-16 top-8 w-16 h-8 bg-gradient-to-l from-red-500/50 to-transparent blur-lg"
      />

      {/* 跑车 SVG */}
      <svg width="200" height="80" viewBox="0 0 200 80" className="drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="carBody" x1="0" y1="0" x2="200" y2="80">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="window" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 车身主体 */}
        <path 
          d="M20 55 L35 30 L60 18 L130 18 L160 28 L185 45 L195 55 L20 55 Z" 
          fill="url(#carBody)" 
          stroke="#1e3a8a" 
          strokeWidth="1.5"
        />
        
        {/* 车身高光 */}
        <path 
          d="M40 32 L65 20 L125 20 L150 30" 
          fill="none" 
          stroke="rgba(255,255,255,0.2)" 
          strokeWidth="1"
        />

        {/* 车窗 */}
        <path 
          d="M48 32 L70 21 L120 21 L145 32 L48 32 Z" 
          fill="url(#window)" 
          stroke="#334155" 
          strokeWidth="1"
        />
        
        {/* 车窗反光 */}
        <path 
          d="M52 30 L68 23 L80 23 L65 30 Z" 
          fill="rgba(255,255,255,0.1)" 
        />

        {/* 前大灯 */}
        <ellipse cx="188" cy="48" rx="4" ry="3" fill="#fef08a" filter="url(#glow)" />
        <ellipse cx="188" cy="48" rx="2" ry="1.5" fill="#ffffff" />

        {/* 尾灯 */}
        <rect x="18" y="46" width="6" height="4" rx="1" fill="#ef4444" filter="url(#glow)" />

        {/* 进气口 */}
        <path d="M160 50 L175 50 L175 53 L160 53 Z" fill="#0f172a" />

        {/* 扰流板 */}
        <path d="M25 28 L35 28 L35 26 L25 26 Z" fill="#1e3a8a" />
        <path d="M27 26 L33 26 L33 24 L27 24 Z" fill="#1e40af" />

        {/* 车门线 */}
        <line x1="90" y1="32" x2="90" y2="52" stroke="#1e3a8a" strokeWidth="0.5" opacity="0.5" />
      </svg>

      {/* 车轮 */}
      <div className="absolute bottom-0 left-8">
        <Wheel isFront={false} />
      </div>
      <div className="absolute bottom-0 right-12">
        <Wheel isFront={true} />
      </div>

      {/* 尾气 */}
      <ExhaustParticles />
    </motion.div>
  );
}

export default function DrivingCarFooter() {
  const [speed, setSpeed] = useState(120);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed(100 + Math.random() * 80);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[200px] md:h-[240px] overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800">
      {/* 星空背景 */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 + Math.random() * 2, delay: Math.random() * 2 }}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 40}%`,
            }}
          />
        ))}
      </div>

      {/* 远景山脉 */}
      <motion.div 
        animate={{ x: ['0%', '-25%'] }}
        transition={{ repeat: Infinity, duration: 50, ease: 'linear' }}
        className="absolute bottom-20 left-0 w-[200%] h-16 flex items-end opacity-20"
      >
        <svg viewBox="0 0 1200 100" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,100 L100,40 L200,70 L350,20 L500,60 L650,30 L800,50 L950,10 L1100,45 L1200,100 Z" fill="#1e293b" />
        </svg>
      </motion.div>

      {/* 城市天际线 */}
      <motion.div 
        animate={{ x: ['0%', '-50%'] }}
        transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
        className="absolute bottom-16 left-0 w-[200%] h-12 flex items-end opacity-10"
      >
        {[...Array(40)].map((_, i) => (
          <div 
            key={i} 
            className="flex-1 bg-slate-600 mx-0.5" 
            style={{ height: `${10 + Math.random() * 50}%` }} 
          />
        ))}
      </motion.div>

      {/* 云层 */}
      <motion.div 
        animate={{ x: ['0%', '-30%'] }}
        transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
        className="absolute top-8 left-0 w-[150%] h-10 flex items-center gap-16 opacity-5"
      >
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-32 h-8 bg-slate-300 rounded-full blur-sm" />
        ))}
      </motion.div>

      {/* 路灯掠影 */}
      <StreetLights />

      {/* 路面 */}
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-b from-slate-900 to-slate-950">
        {/* 路缘石 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-700" />
        
        {/* 车道线 */}
        <motion.div 
          animate={{ backgroundPosition: ['80px 0', '0px 0'] }}
          transition={{ repeat: Infinity, duration: 0.4, ease: 'linear' }}
          className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #fbbf24 0, #fbbf24 30px, transparent 30px, transparent 60px)',
            backgroundSize: '80px 100%',
          }}
        />
        
        {/* 路边虚线 */}
        <motion.div 
          animate={{ backgroundPosition: ['60px 0', '0px 0'] }}
          transition={{ repeat: Infinity, duration: 0.3, ease: 'linear' }}
          className="absolute top-2 left-0 w-full h-0.5"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #475569 0, #475569 10px, transparent 10px, transparent 30px)',
            backgroundSize: '60px 100%',
          }}
        />

        {/* 路面反光 */}
        <motion.div
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent"
        />
      </div>

      {/* 速度线 */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              x: ['110vw', '-10vw'],
              opacity: [0, 0.5, 0],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 1 + Math.random() * 0.5, 
              delay: i * 0.3,
              ease: 'linear',
            }}
            className="absolute top-[35%] h-px w-32 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent blur-[1px]"
          />
        ))}
      </div>

      {/* 跑车 */}
      <div className="absolute bottom-14 left-[10%] md:left-[15%]">
        <SportsCar />
      </div>

      {/* 仪表盘 */}
      <Speedometer speed={speed} />

      {/* 品牌标识 */}
      <motion.div 
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-600 text-xs tracking-widest uppercase"
      >
        MAGNET OMEGA • Powered by Speed
      </motion.div>
    </div>
  );
        }
