'use client';

import { useState } from 'react';

interface NameFormProps {
  onSubmit: (name: string) => void;
}

export default function NameForm({ onSubmit }: NameFormProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('氏名または法人名を入力してください');
      return;
    }
    if (name.trim().length < 2) {
      setError('2文字以上で入力してください');
      return;
    }
    setError('');
    onSubmit(name.trim());
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* カードヘッダー */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-6 py-5">
        <h2 className="text-white font-bold text-lg">STEP 1 — 基本情報の入力</h2>
        <p className="text-gray-300 text-sm mt-1">届出者の氏名（または法人名）を入力してください</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            氏名 または 法人名
            <span className="ml-2 text-red-500 text-xs">必須</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="例：山田 太郎　／　株式会社〇〇運送"
            className={`w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 transition-colors ${
              error
                ? 'border-red-400 focus:ring-red-200'
                : 'border-gray-300 focus:ring-yellow-300 focus:border-yellow-400'
            }`}
          />
          {error && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
              <span>⚠️</span> {error}
            </p>
          )}
          <p className="text-gray-400 text-xs mt-2">
            個人事業主の方は「山田 太郎」、法人の方は「株式会社〇〇運送」のように入力してください
          </p>
        </div>

        {/* 今後追加予定の項目プレビュー */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-dashed border-gray-300">
          <p className="text-xs font-semibold text-gray-500 mb-3">📌 Phase 2で追加予定の入力項目</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              '住所・郵便番号',
              '電話番号',
              '営業所情報',
              '車庫情報',
              '車両情報（車台番号等）',
              '安全管理者情報',
              '事業開始予定日',
              '運賃設定',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-3 h-3 bg-gray-300 rounded-full flex-shrink-0"></span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 active:bg-gray-900 transition-colors flex items-center justify-center gap-2"
        >
          <span>書類プレビューを生成</span>
          <span>→</span>
        </button>
      </form>
    </div>
  );
}
