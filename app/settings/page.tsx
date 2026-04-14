'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Palette, Search, Cloud, Server, Info, 
  Bell, Shield, Zap, Moon, Sun, Monitor, Trash2, 
  Download, Upload, Check, ChevronRight
} from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { useStore } from '@/store/useStore';

export default function SettingsPage() {
  const router = useRouter();
  const { clearHistory, resetFilters, exportData, importData } = useStore();
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [notifications, setNotifications] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const success = importData(ev.target?.result as string);
      if (success) alert('数据导入成功');
      else alert('导入失败：格式错误');
    };
    reader.readAsText(file);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">{title}</h3>
      <GlassCard className="divide-y divide-slate-800/50">{children}</GlassCard>
    </div>
  );

  const SettingItem = ({ icon, title, subtitle, onClick, rightElement }: any) => (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.3)' }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 cursor-pointer transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-200">{title}</div>
        {subtitle && <div className="text-sm text-slate-500 mt-0.5">{subtitle}</div>}
      </div>
      {rightElement || <ChevronRight className="w-5 h-5 text-slate-600" />}
    </motion.div>
  );

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-slate-700'}`}
    >
      <motion.div animate={{ x: enabled ? 20 : 2 }} className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg" />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 pb-20">
      <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-slate-800/50">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">设置</h1>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <Section title="外观">
          <SettingItem
            icon={<Palette className="w-5 h-5" />}
            title="主题模式"
            subtitle="选择应用显示主题"
            rightElement={
              <div className="flex gap-2">
                {[
                  { id: 'dark', icon: <Moon className="w-4 h-4" /> },
                  { id: 'light', icon: <Sun className="w-4 h-4" /> },
                  { id: 'system', icon: <Monitor className="w-4 h-4" /> },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`p-2 rounded-lg transition-colors ${theme === t.id ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500'}`}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>
            }
          />
        </Section>

        <Section title="搜索与下载">
          <SettingItem
            icon={<Search className="w-5 h-5" />}
            title="搜索引擎管理"
            subtitle="启用/禁用/排序搜索源"
            onClick={() => router.push('/engines')}
          />
          <SettingItem
            icon={<Bell className="w-5 h-5" />}
            title="搜索提醒"
            subtitle="新资源可用时推送通知"
            rightElement={<Toggle enabled={notifications} onChange={setNotifications} />}
          />
          <SettingItem
            icon={<Download className="w-5 h-5" />}
            title="自动开始下载"
            subtitle="点击磁力链接后自动唤起客户端"
            rightElement={<Toggle enabled={autoDownload} onChange={setAutoDownload} />}
          />
        </Section>

        <Section title="网络与服务">
          <SettingItem
            icon={<Server className="w-5 h-5" />}
            title="服务器节点"
            subtitle="当前线路：动态优选 (延迟 45ms)"
            onClick={() => router.push('/settings/server')}
          />
          <SettingItem
            icon={<Cloud className="w-5 h-5" />}
            title="离线下载服务"
            subtitle="配置云端下载服务器"
            onClick={() => router.push('/settings/remote')}
          />
        </Section>

        <Section title="数据管理">
          <SettingItem
            icon={<Shield className="w-5 h-5" />}
            title="清除搜索历史"
            subtitle="移除本地保存的搜索记录"
            onClick={clearHistory}
            rightElement={<Check className="w-5 h-5 text-green-400" />}
          />
          <SettingItem
            icon={<Trash2 className="w-5 h-5 text-red-400" />}
            title="重置所有设置"
            subtitle="恢复默认过滤条件与排序"
            onClick={resetFilters}
          />
          <SettingItem
            icon={<Upload className="w-5 h-5" />}
            title="导出配置"
            subtitle="备份历史记录与收藏夹"
            onClick={() => {
              const blob = new Blob([exportData()], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `omega-backup-${Date.now()}.json`;
              a.click();
            }}
          />
          <SettingItem
            icon={<Download className="w-5 h-5" />}
            title="导入配置"
            subtitle="从备份文件恢复数据"
            rightElement={
              <label className="text-blue-400 hover:text-blue-300 cursor-pointer">
                选择文件
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            }
          />
        </Section>

        <Section title="关于">
          <SettingItem
            icon={<Info className="w-5 h-5" />}
            title="版本信息"
            subtitle="Magnet Omega v2.0.0 (Build 2026.04.14)"
          />
          <SettingItem
            icon={<Zap className="w-5 h-5" />}
            title="检查更新"
            subtitle="当前已是最新版本"
          />
        </Section>
      </div>
    </div>
  );
}
