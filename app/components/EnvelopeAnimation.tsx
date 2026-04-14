'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate, animate } from 'framer-motion';

// 粒子系统组件
function ParticleBurst({ active }: { active: boolean }) {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 360 - 180,
    y: Math.random() * 360 - 180,
    scale: Math.random() * 0.5 + 0.5,
    delay: Math.random() * 0.5,
    duration: Math.random() * 1 + 1.5,
    color: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'][Math.floor(Math.random() * 5)],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={active ? {
            opacity: [0, 1, 0],
            scale: [0, p.scale, 0],
            x: p.x,
            y: p.y,
          } : {}}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
          style={{ backgroundColor: p.color, boxShadow: `0 0 10px ${p.color}` }}
        />
      ))}
    </div>
  );
}

// 3D 火漆印组件
function WaxSeal({ isOpen }: { isOpen: boolean }) {
  return (
    <motion.div
      animate={{ 
        scale: isOpen ? [1, 1.2, 0] : 1,
        rotateY: isOpen ? 360 : 0,
        opacity: isOpen ? [1, 1, 0] : 1,
      }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30"
    >
      <div className="relative w-14 h-14">
        {/* 火漆主体 */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-full shadow-2xl border-2 border-red-800">
          {/* 3D 高光 */}
          <div className="absolute top-2 left-3 w-4 h-3 bg-white/20 rounded-full blur-sm transform -rotate-12" />
          {/* 纹理 */}
          <div className="absolute inset-1 bg-gradient-to-br from-transparent via-red-800/30 to-transparent rounded-full" />
        </div>
        {/* 印章图案 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            animate={{ scale: isOpen ? 0 : 1 }}
            className="text-white font-bold text-lg drop-shadow-md"
          >
            ♥
          </motion.span>
        </div>
        {/* 边缘装饰 */}
        <div className="absolute -inset-1 border-2 border-red-500/30 rounded-full animate-pulse" />
      </div>
    </motion.div>
  );
}

// 信纸内容组件
function LetterContent({ progress }: { progress: number }) {
  const chars1 = 'TO董露小朋友，'.split('');
  const chars2 = '天天开心 ✨'.split('');

  return (
    <motion.div
      style={{ 
        y: useTransform(progress, [0.5, 0.8], [20, -100]),
        opacity: useTransform(progress, [0.5, 0.65], [0, 1]),
        scale: useTransform(progress, [0.5, 0.7], [0.8, 1]),
      }}
      className="absolute inset-3 md:inset-4 bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50 rounded-lg shadow-2xl flex flex-col items-center justify-center p-4 md:p-8 border border-amber-200/50 overflow-hidden"
    >
      {/* 纸张纹理 */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
      }} />
      
      {/* 装饰边框 */}
      <div className="absolute inset-2 border border-amber-300/30 rounded-md pointer-events-none" />
      <div className="absolute inset-4 border border-amber-300/20 rounded-sm pointer-events-none" />

      {/* 内容 */}
      <div className="relative z-10 text-center space-y-4">
        <div className="flex flex-wrap justify-center gap-0.5">
          {chars1.map((char, i) => (
            <motion.span
              key={`line1-${i}`}
              initial={{ opacity: 0, y: 20, rotateX: -90 }}
              animate={progress > 0.7 ? {
                opacity: 1,
                y: 0,
                rotateX: 0,
              } : {}}
              transition={{ 
                duration: 0.5, 
                delay: 0.8 + i * 0.05,
                type: 'spring',
                stiffness: 200,
              }}
              className="text-base md:text-xl font-serif text-slate-800 font-medium inline-block"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        <motion.div 
          initial={{ width: 0 }}
          animate={progress > 0.85 ? { width: '80px' } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent mx-auto"
        />

        <div className="flex flex-wrap justify-center gap-0.5">
          {chars2.map((char, i) => (
            <motion.span
              key={`line2-${i}`}
              initial={{ opacity: 0, y: 20, scale: 0.5 }}
              animate={progress > 0.8 ? {
                opacity: 1,
                y: 0,
                scale: 1,
              } : {}}
              transition={{ 
                duration: 0.6, 
                delay: 1.0 + i * 0.08,
                type: 'spring',
                stiffness: 150,
              }}
              className="text-2xl md:text-4xl font-bold inline-block bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent"
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* 装饰星星 */}
        <motion.div 
          initial={{ opacity: 0, rotate: 0 }}
          animate={progress > 0.9 ? { opacity: 1, rotate: 360 } : {}}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute top-4 right-4 text-2xl"
        >
          ⭐
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, rotate: 0 }}
          animate={progress > 0.9 ? { opacity: 1, rotate: -360 } : {}}
          transition={{ duration: 1, delay: 1.7 }}
          className="absolute bottom-4 left-4 text-xl"
        >
          ✨
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function EnvelopeAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseOver, setIsMouseOver] = useState(false);
  
  // 鼠标位置跟踪
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      mouseX.set((e.clientX - rect.left - rect.width / 2) / 20);
      mouseY.set((e.clientY - rect.top - rect.height / 2) / 20);
    }
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, { 
    damping: 40, 
    stiffness: 120,
    mass: 0.8,
  });

  // 动画阶段
  const envelopeY = useTransform(smoothProgress, [0, 0.15], [150, 0]);
  const envelopeOpacity = useTransform(smoothProgress, [0, 0.1], [0, 1]);
  const envelopeScale = useTransform(smoothProgress, [0, 0.15], [0.7, 1]);
  const envelopeRotateX = useTransform(mouseY, [-10, 10], [8, -8]);
  const envelopeRotateY = useTransform(mouseX, [-10, 10], [-8, 8]);

  // 口盖动画
  const flapRotateX = useTransform(smoothProgress, [0.25, 0.45], [0, -180]);
  const flapOpacity = useTransform(smoothProgress, [0.4, 0.45], [1, 0.8]);

  // 信纸动画
  const letterY = useTransform(smoothProgress, [0.45, 0.75], [0, -140]);
  const letterScale = useTransform(smoothProgress, [0.45, 0.6], [0.9, 1]);

  // 背景光晕
  const glowScale = useTransform(smoothProgress, [0.3, 0.6], [1, 1.5]);
  const glowOpacity = useTransform(smoothProgress, [0.3, 0.5, 0.8], [0.3, 0.6, 0.2]);

  const isOpen = smoothProgress.get() > 0.5;

  return (
    <div 
      ref={containerRef} 
      className="relative h-[250vh] w-full"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsMouseOver(true)}
      onMouseLeave={() => setIsMouseOver(false)}
    >
      <div className="sticky top-0 left-0 w-full h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950">
        
        {/* 动态背景粒子 */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -100 - Math.random() * 100],
                x: [0, (Math.random() - 0.5) * 100],
                opacity: [0, 0.5, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: 'easeOut',
              }}
              className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: `${Math.random() * 50}%`,
              }}
            />
          ))}
        </div>

        {/* 中心光晕 */}
        <motion.div
          style={{ scale: glowScale, opacity: glowOpacity }}
          className="absolute w-[800px] h-[800px] bg-gradient-radial from-purple-500/30 via-pink-500/20 to-transparent rounded-full blur-3xl pointer-events-none"
        />

        {/* 信封容器 */}
        <motion.div
          style={{
            y: envelopeY,
            opacity: envelopeOpacity,
            scale: envelopeScale,
            rotateX: envelopeRotateX,
            rotateY: envelopeRotateY,
          }}
          className="relative perspective-[1500px]"
          style={{ perspective: '1500px', transformStyle: 'preserve-3d' }}
        >
          <div className="relative w-[340px] h-[240px] md:w-[420px] md:h-[300px]" style={{ transformStyle: 'preserve-3d' }}>
            
            {/* 粒子爆发效果 */}
            <ParticleBurst active={isOpen} />

            {/* 信纸 */}
            <LetterContent progress={smoothProgress.get()} />

            {/* 信封下半部分 */}
            <motion.div
              className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* 折痕装饰 */}
              <div className="absolute inset-0">
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900/80 to-transparent transform skew-y-2 origin-bottom-right" />
                <div className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-l from-slate-800/60 to-transparent transform skew-x-3 origin-bottom-right" />
                <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-slate-800/40 to-transparent transform -skew-x-3 origin-bottom-left" />
              </div>
              
              {/* 纹理 */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)`,
              }} />
              
              {/* 边框高光 */}
              <div className="absolute inset-0 rounded-xl border border-white/10 pointer-events-none" />
              <div className="absolute inset-[2px] rounded-[10px] border border-white/5 pointer-events-none" />
            </motion.div>

            {/* 口盖 */}
            <motion.div
              style={{
                rotateX: flapRotateX,
                opacity: flapOpacity,
                transformOrigin: 'top center',
              }}
              className="absolute top-0 left-0 w-full h-[58%] z-20"
            >
              <div
                className="w-full h-full rounded-t-xl"
                style={{
                  background: 'linear-gradient(180deg, #475569 0%, #334155 60%, #1e293b 100%)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* 口盖纹理 */}
                <div className="absolute inset-0 rounded-t-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent" />
                </div>
                
                {/* V 形折痕 */}
                <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-slate-900/50 to-transparent" />
              </div>
            </motion.div>

            {/* 火漆印 */}
            <WaxSeal isOpen={isOpen} />

            {/* 鼠标悬停光效 */}
            {isMouseOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none z-30"
                style={{
                  background: useMotionTemplate`radial-gradient(300px circle at ${mouseX.get() + 200}px ${mouseY.get() + 150}px, rgba(255,255,255,0.1), transparent)`,
                }}
              />
            )}
          </div>
        </motion.div>

        {/* 滚动提示 */}
        <motion.div 
          style={{ opacity: useTransform(smoothProgress, [0, 0.08, 0.25], [1, 1, 0]) }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-slate-400"
        >
          <span className="text-sm tracking-widest uppercase">Scroll to Open</span>
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-8 h-12 border-2 border-slate-500 rounded-full flex justify-center pt-2"
          >
            <motion.div 
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-3 bg-slate-400 rounded-full" 
            />
          </motion.div>
        </motion.div>

        {/* 完成提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isOpen ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500 text-sm"
        >
          继续下滑探索更多 ↓
        </motion.div>
      </div>
    </div>
  );
                       }
