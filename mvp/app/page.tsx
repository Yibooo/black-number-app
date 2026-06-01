'use client';

import { useState } from 'react';
import MultiStepForm from '@/components/form/MultiStepForm';
import DocumentPreview from '@/components/DocumentPreview';
import type { FormValues } from '@/types/form-data';

export default function Home() {
  const [data, setData] = useState<FormValues | null>(null);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-black text-white py-4 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-sm">黒</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">黒ナンバー書類自動生成アプリ</h1>
            <p className="text-gray-400 text-xs">貨物軽自動車運送事業届出書類を自動作成</p>
          </div>
          <div className="ml-auto">
            <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">β版</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-8 px-4">
        {!data ? (
          <>
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl">ℹ️</span>
                <div>
                  <p className="text-blue-800 font-semibold text-sm">必要項目を入力すると、5種類の届出書に自動記入されます</p>
                  <p className="text-blue-700 text-sm mt-1">
                    各ステップで入力 → 全書類のプレビューが自動生成されます（手続きの流れ案内はPhase Dで追加予定）。
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">生成される書類（全5種類）</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { num: '①', name: '貨物軽自動車運送事業\n経営届出書', icon: '📋', badge: null },
                  { num: '②', name: '運賃料金設定届出書', icon: '💴', badge: null },
                  { num: '③', name: '運賃料金表', icon: '📊', badge: null },
                  { num: '④', name: '事業用自動車等連絡書', icon: '🚗', badge: null },
                  { num: '⑤', name: '貨物軽自動車\n安全管理者選任届出書', icon: '🛡️', badge: '令和7年4月義務化' },
                ].map((doc) => (
                  <div key={doc.num} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                    <span className="text-2xl">{doc.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-500">{doc.num}</span>
                        {doc.badge && (
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            {doc.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-1 whitespace-pre-line">{doc.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <MultiStepForm onComplete={setData} />
          </>
        ) : (
          <DocumentPreview data={data} onReset={() => setData(null)} />
        )}
      </div>

      <footer className="border-t border-gray-200 mt-12 py-6 text-center text-gray-500 text-xs">
        <p>⚠️ 本アプリは書類作成補助ツールです。提出前に必ず内容をご確認ください。</p>
        <p className="mt-1">疑問点は管轄の運輸支局または行政書士にご相談ください。</p>
      </footer>
    </main>
  );
}
