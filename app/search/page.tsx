'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, HardDrive, Clock, Users, ExternalLink } from 'lucide-react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      setLoading(true);
      // 模拟搜索
      setTimeout(() => {
        setResults([
          {
            id: '1',
            title: 'Ubuntu 22.04 LTS Desktop',
            size: '4.7 GB',
            seeds: 1245,
            date: '2024-01-15',
            engine: 'PirateBay',
          },
        ]);
        setLoading(false);
      }, 1000);
    }
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-xl">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{query}</h2>
            <p className="text-xs text-slate-400">{results.length} 个结果</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">正在搜索...</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {results.map(result => (
              <div key={result.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-all">
                <h3 className="font-semibold text-slate-100 mb-3">{result.title}</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                    <HardDrive className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-200">{result.size}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">{result.seeds}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-slate-200">{result.date}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{result.engine}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
