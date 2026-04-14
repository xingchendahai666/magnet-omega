'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Camera, Server, Settings, MessageSquare, Heart, LogOut, User,
  Crown, Share2, Shield, Zap, Star, TrendingUp, Clock, Award,
  ChevronRight, Copy, Check, HardDrive, Download
} from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { useStore } from '@/store/useStore';

export default function ProfilePage() {
  const router = useRouter();
  const { searchHistory, favorites, clearHistory } = useStore();
  const [copied, setCopied] = useState(false);

  const copyReferral = () => {
    navigator.clipboard.writeText('https://magnet-omega.app/invite/USER123');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const MenuItem = ({ icon, title, subtitle, onClick, badge, danger }: any) => (
    <motion.div
      whileHover={{ scale: 1.01, backgroundColor: danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(30, 41, 59, 0.4)' }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${danger ? 'text-red-400' : ''}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${danger ? 'bg-red-500/10' : 'bg-slate-800/50'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          {badge && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">{badge}</span>}
        </div>
        {subtitle && <div className="text-sm text-slate-500 mt-0.5">{subtitle}</div>}
      </div>
      <ChevronRight className="w-5 h-5 text-slate-600" />
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 pb-24">
      {/* 头部卡片 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
        
        <div className="relative p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 p-1">
                <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-400" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-900" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">已登录</h2>
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  普通会员
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">UID: 88492011 · 注册于 2026-01-15</p>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-3">
            <GlassCard className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{searchHistory.length}</div>
              <div className="text-xs text-slate-500 mt-1">搜索次数</div>
            </GlassCard>
            <GlassCard className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">{favorites.length}</div>
              <div className="text-xs text-slate-500 mt-1">收藏资源</div>
            </GlassCard>
            <GlassCard className="p-3 text-center">
              <div className="text-2xl font-bold text-green-400">12</div>
              <div className="text-xs text-slate-500 mt-1">下载完成</div>
            </GlassCard>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* 会员卡片 */}
        <GlassCard className="p-6 mb-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-lg">升级为 VIP</h3>
              </div>
              <p className="text-sm text-slate-400">解锁更多高级功能与极速通道</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-semibold text-sm shadow-lg shadow-yellow-500/25"
            >
              立即升级
            </motion.button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['无广告', '高速下载', '优先支持', '云存储 100GB'].map((feature, idx) => (
              <span key={idx} className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-full">
                {feature}
              </span>
            ))}
          </div>
        </GlassCard>

        {/* 快捷操作 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={copyReferral}
            className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
              {copied ? <Check className="w-5 h-5 text-blue-400" /> : <Share2 className="w-5 h-5 text-blue-400" />}
            </div>
            <div className="font-medium mb-1">邀请好友</div>
            <div className="text-xs text-slate-500">{copied ? '已复制链接' : '分享得 7 天 VIP'}</div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/settings')}
            className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <div className="font-medium mb-1">应用设置</div>
            <div className="text-xs text-slate-500">个性化配置</div>
          </motion.div>
        </div>

        {/* 功能列表 */}
        <div className="space-y-2">
          <MenuItem
            icon={<Star className="w-5 h-5 text-yellow-400" />}
            title="我的收藏"
            subtitle={`${favorites.length} 个已保存资源`}
            onClick={() => router.push('/favorites')}
          />
          
          <MenuItem
            icon={<Clock className="w-5 h-5 text-cyan-400" />}
            title="搜索历史"
            subtitle={`${searchHistory.length} 条记录`}
            onClick={() => router.push('/history')}
          />
          
          <MenuItem
            icon={<HardDrive className="w-5 h-5 text-green-400" />}
            title="离线下载"
            subtitle="云端任务管理"
            onClick={() => router.push('/downloads')}
          />
          
          <MenuItem
            icon={<Shield className="w-5 h-5 text-indigo-400" />}
            title="隐私与安全"
            subtitle="数据加密、无痕模式"
            onClick={() => router.push('/settings/privacy')}
          />
          
          <MenuItem
            icon={<MessageSquare className="w-5 h-5 text-pink-400" />}
            title="意见反馈"
            subtitle="帮助我们改进产品"
            onClick={() => router.push('/feedback')}
          />
          
          <MenuItem
            icon={<Heart className="w-5 h-5 text-red-400" />}
            title="商务合作"
            subtitle="联系我们洽谈合作"
            onClick={() => router.push('/business')}
          />
          
          <div className="h-px bg-slate-800/50 my-4" />
          
          <MenuItem
            icon={<LogOut className="w-5 h-5" />}
            title="退出登录"
            subtitle="安全退出当前账号"
            danger
            onClick={() => {
              localStorage.removeItem('omega_auth_token');
              router.push('/');
            }}
          />
        </div>
      </div>

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-800/50 bg-slate-950/80 backdrop-blur-xl pb-6 pt-2 px-6">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button 
            onClick={() => router.push('/')}
            className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">首页</span>
          </button>
          
          <button 
            onClick={() => router.push('/favorites')}
            className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-xs">收藏</span>
          </button>
          
          <div className="flex flex-col items-center gap-1 text-blue-400">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">我的</span>
          </div>
        </div>
      </div>
    </div>
  );
}
