'use client';

import { useState } from 'react';
import { generatePDF } from '@/lib/pdf-generator';

interface DocumentPreviewProps {
  name: string;
  onReset: () => void;
}

// 今日の日付をフォーマット
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  // 和暦変換（令和）
  const reiwaYear = y - 2018;
  return `令和${reiwaYear}年${m}月${d}日`;
}

// 運輸支局のプレースホルダー
const TRANSPORT_OFFICE = '○○運輸支局長';

export default function DocumentPreview({ name, onReset }: DocumentPreviewProps) {
  const today = new Date();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDoc, setActiveDoc] = useState(0);

  const docs = [
    { id: 0, title: '① 経営届出書', shortTitle: '経営届出書' },
    { id: 1, title: '② 運賃料金設定届出書', shortTitle: '運賃設定' },
    { id: 2, title: '③ 運賃料金表', shortTitle: '運賃表' },
    { id: 3, title: '④ 事業用自動車等連絡書', shortTitle: '連絡書' },
    { id: 4, title: '⑤ 安全管理者選任届出書', shortTitle: '安全管理者' },
  ];

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      await generatePDF(name, today);
    } catch (e) {
      console.error(e);
      alert('PDF生成中にエラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 成功バナー */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xl">✓</span>
        </div>
        <div>
          <p className="text-green-800 font-bold">書類プレビューを生成しました！</p>
          <p className="text-green-700 text-sm">
            <strong>「{name}」</strong> 様の情報が各書類に自動記入されました。
          </p>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>生成中...</span>
            </>
          ) : (
            <>
              <span>📄</span>
              <span>PDFで出力</span>
            </>
          )}
        </button>
        <button
          disabled
          className="flex items-center gap-2 bg-gray-100 text-gray-400 px-5 py-3 rounded-xl font-bold cursor-not-allowed"
          title="Phase 2で対応予定"
        >
          <span>📊</span>
          <span>Excelで出力（Phase 2）</span>
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 border border-gray-300 text-gray-600 px-5 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors ml-auto"
        >
          <span>←</span>
          <span>入力に戻る</span>
        </button>
      </div>

      {/* 書類タブ */}
      <div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
                activeDoc === doc.id
                  ? 'bg-white border border-gray-200 border-b-white text-black'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {doc.shortTitle}
            </button>
          ))}
        </div>

        {/* 書類プレビューエリア */}
        <div className="bg-white border border-gray-200 rounded-b-xl rounded-tr-xl p-1 shadow-sm">
          {/* 書類1: 経営届出書 */}
          {activeDoc === 0 && (
            <Document1 name={name} date={today} />
          )}
          {/* 書類2: 運賃料金設定届出書 */}
          {activeDoc === 1 && (
            <Document2 name={name} date={today} />
          )}
          {/* 書類3: 運賃料金表 */}
          {activeDoc === 2 && (
            <Document3 name={name} />
          )}
          {/* 書類4: 事業用自動車等連絡書 */}
          {activeDoc === 3 && (
            <Document4 name={name} date={today} />
          )}
          {/* 書類5: 安全管理者選任届出書 */}
          {activeDoc === 4 && (
            <Document5 name={name} date={today} />
          )}
        </div>
      </div>

      {/* 提出先チェックリスト */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
        <h3 className="font-bold text-yellow-800 mb-3">📋 提出先チェックリスト</h3>
        <ol className="space-y-2">
          {[
            { step: '①', text: '管轄の運輸支局へ書類①②③④⑤を提出（書類は正・控の2部）', sub: '平日9:00〜16:00' },
            { step: '②', text: '運輸支局で受付印をもらった「事業用自動車等連絡書④」を受け取る', sub: '' },
            { step: '③', text: '同日中に軽自動車検査協会へ持参し、黄色ナンバーを黒ナンバーに変更', sub: '手数料：約1,500円' },
            { step: '④', text: '新しい黒ナンバーを受け取って完了！', sub: '' },
          ].map((item) => (
            <li key={item.step} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-yellow-900">
                {item.step}
              </span>
              <div>
                <p className="text-sm text-yellow-900 font-medium">{item.text}</p>
                {item.sub && <p className="text-xs text-yellow-700 mt-0.5">{item.sub}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ===== 書類コンポーネント ===== */

function FilledText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-blue-700 font-bold underline decoration-blue-300 decoration-dotted ${className}`}>
      {children}
    </span>
  );
}

function EmptyField({ label, width = 'w-32' }: { label: string; width?: string }) {
  return (
    <span className={`inline-block ${width} border-b-2 border-gray-400 text-center text-gray-400 text-sm`}>
      {label}
    </span>
  );
}

// ① 貨物軽自動車運送事業経営届出書
function Document1({ name, date }: { name: string; date: Date }) {
  return (
    <div className="p-8 font-serif text-sm leading-relaxed" style={{ minHeight: '700px' }}>
      <div className="text-right text-xs text-gray-400 mb-2">様式第1号</div>
      <h2 className="text-center text-lg font-bold mb-1 tracking-widest">貨物軽自動車運送事業経営届出書</h2>
      <p className="text-right text-sm mb-6">
        <FilledText>{formatDate(date)}</FilledText>
      </p>
      <p className="mb-6">
        <EmptyField label="○○" width="w-40" /> 運輸支局長　殿
      </p>
      <div className="border border-gray-300 p-4 mb-6 text-right">
        <p>届出者</p>
        <p className="mt-2">
          住所　<EmptyField label="住所を入力" width="w-64" />
        </p>
        <p className="mt-2">
          氏名　<FilledText>{name}</FilledText>　　　　印
        </p>
        <p className="text-xs text-gray-400 mt-1">（法人にあっては、その名称及び代表者の氏名）</p>
      </div>
      <p className="mb-4 text-sm">
        貨物軽自動車運送事業を経営しようとするので、貨物自動車運送事業法第36条第1項の規定により、
        下記のとおり届け出ます。
      </p>
      <table className="w-full border-collapse border border-gray-400 text-sm">
        <tbody>
          <tr>
            <td className="border border-gray-400 px-3 py-2 bg-gray-50 w-1/3 font-semibold">氏名又は名称</td>
            <td className="border border-gray-400 px-3 py-2">
              <FilledText>{name}</FilledText>
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-3 py-2 bg-gray-50 font-semibold">営業所の名称及び所在地</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">（Phase 2で入力）</td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-3 py-2 bg-gray-50 font-semibold">事業用自動車の種別及び台数</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">軽貨物自動車　（Phase 2）台</td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-3 py-2 bg-gray-50 font-semibold">事業の開始予定日</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">（Phase 2で入力）</td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-3 py-2 bg-gray-50 font-semibold">車庫の所在地及び収容能力</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">（Phase 2で入力）</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-6 text-xs text-gray-400 text-center">
        ※ 青色太字・下線部分が自動入力された箇所です（MVP版）
      </div>
    </div>
  );
}

// ② 運賃料金設定届出書
function Document2({ name, date }: { name: string; date: Date }) {
  return (
    <div className="p-8 font-serif text-sm leading-relaxed" style={{ minHeight: '700px' }}>
      <div className="text-right text-xs text-gray-400 mb-2">様式第3号</div>
      <h2 className="text-center text-lg font-bold mb-1 tracking-widest">運賃料金設定届出書</h2>
      <p className="text-right text-sm mb-6">
        <FilledText>{formatDate(date)}</FilledText>
      </p>
      <p className="mb-6">
        <EmptyField label="○○" width="w-40" /> 運輸支局長　殿
      </p>
      <div className="border border-gray-300 p-4 mb-6 text-right">
        <p>届出者</p>
        <p className="mt-2">
          住所　<EmptyField label="住所を入力" width="w-64" />
        </p>
        <p className="mt-2">
          氏名　<FilledText>{name}</FilledText>　　　　印
        </p>
      </div>
      <p className="mb-4 text-sm">
        貨物軽自動車運送事業の運賃及び料金を下記のとおり設定したので、
        貨物自動車運送事業法第36条第2項の規定により届け出ます。
      </p>
      <table className="w-full border-collapse border border-gray-400 text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-400 px-3 py-2">種別</th>
            <th className="border border-gray-400 px-3 py-2">距離（時間）</th>
            <th className="border border-gray-400 px-3 py-2">運賃・料金</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 px-3 py-2">距離制運賃（初乗り）</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">〜2km</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">（Phase 2）円</td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-3 py-2">距離制運賃（加算）</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">以降1kmごと</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">（Phase 2）円</td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-3 py-2">時間制運賃</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">1時間ごと</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">（Phase 2）円</td>
          </tr>
        </tbody>
      </table>
      <p className="text-sm mt-4">
        届出者：<FilledText>{name}</FilledText>
      </p>
    </div>
  );
}

// ③ 運賃料金表
function Document3({ name }: { name: string }) {
  return (
    <div className="p-8 font-serif text-sm leading-relaxed" style={{ minHeight: '700px' }}>
      <h2 className="text-center text-lg font-bold mb-1 tracking-widest">運　賃　料　金　表</h2>
      <p className="text-center text-sm text-gray-500 mb-6">（貨物軽自動車運送事業）</p>
      <div className="text-right mb-4">
        <p>事業者名：<FilledText>{name}</FilledText></p>
      </div>
      <table className="w-full border-collapse border border-gray-800 text-sm mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-800 px-4 py-3 text-center" colSpan={3}>距離制運賃</th>
          </tr>
          <tr className="bg-gray-50">
            <th className="border border-gray-800 px-3 py-2">区　間</th>
            <th className="border border-gray-800 px-3 py-2">運　賃</th>
            <th className="border border-gray-800 px-3 py-2">備　考</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['初乗り（2kmまで）', '●,●●●円', '—'],
            ['2km超〜10km', '以降1kmごと ●●●円加算', '—'],
            ['10km超〜20km', '以降1kmごと ●●●円加算', '—'],
            ['20km超', '別途協議', '—'],
          ].map(([zone, fare, note], i) => (
            <tr key={i}>
              <td className="border border-gray-800 px-3 py-2 text-gray-400">{zone}</td>
              <td className="border border-gray-800 px-3 py-2 text-gray-400">{fare}</td>
              <td className="border border-gray-800 px-3 py-2 text-gray-400">{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="w-full border-collapse border border-gray-800 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-800 px-4 py-3 text-center" colSpan={2}>時間制運賃・料金</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-800 px-3 py-2">時間制運賃（1時間）</td>
            <td className="border border-gray-800 px-3 py-2 text-gray-400">●,●●●円</td>
          </tr>
          <tr>
            <td className="border border-gray-800 px-3 py-2">待機料金（30分ごと）</td>
            <td className="border border-gray-800 px-3 py-2 text-gray-400">●●●円</td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-4 text-center">
        ※ 運賃はPhase 2でテンプレート選択または手動設定が可能になります
      </p>
    </div>
  );
}

// ④ 事業用自動車等連絡書
function Document4({ name, date }: { name: string; date: Date }) {
  return (
    <div className="p-8 font-serif text-sm leading-relaxed" style={{ minHeight: '700px' }}>
      <h2 className="text-center text-lg font-bold mb-1 tracking-widest">事業用自動車等連絡書</h2>
      <div className="flex justify-between mb-6">
        <p className="text-sm">
          <FilledText>{formatDate(date)}</FilledText>
        </p>
        <p className="text-sm">番号：<EmptyField label="運輸支局記入" width="w-24" /></p>
      </div>
      <div className="border border-gray-300 p-4 mb-6">
        <p className="font-semibold mb-3">事業者情報</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">氏名・名称：</span>
            <FilledText>{name}</FilledText>
          </div>
          <div>
            <span className="text-gray-500">住所：</span>
            <span className="text-gray-400">（Phase 2で入力）</span>
          </div>
        </div>
      </div>
      <table className="w-full border-collapse border border-gray-400 text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-400 px-3 py-2">車台番号</th>
            <th className="border border-gray-400 px-3 py-2">登録番号</th>
            <th className="border border-gray-400 px-3 py-2">用途区分</th>
            <th className="border border-gray-400 px-3 py-2">異動内容</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">（Phase 2）</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">（Phase 2）</td>
            <td className="border border-gray-400 px-3 py-2">貨物</td>
            <td className="border border-gray-400 px-3 py-2">自家用→事業用</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-8 flex justify-end">
        <div className="border border-gray-400 p-4 text-center w-40">
          <p className="text-xs text-gray-500 mb-6">運輸支局　受付印</p>
          <div className="h-12"></div>
        </div>
      </div>
    </div>
  );
}

// ⑤ 安全管理者選任届出書
function Document5({ name, date }: { name: string; date: Date }) {
  return (
    <div className="p-8 font-serif text-sm leading-relaxed" style={{ minHeight: '700px' }}>
      <div className="flex justify-between items-start mb-2">
        <div></div>
        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">2025年4月義務化</span>
      </div>
      <h2 className="text-center text-lg font-bold mb-1 tracking-widest">貨物軽自動車安全管理者選任届出書</h2>
      <p className="text-right text-sm mb-6">
        <FilledText>{formatDate(date)}</FilledText>
      </p>
      <p className="mb-6">
        <EmptyField label="○○" width="w-40" /> 運輸支局長　殿
      </p>
      <div className="border border-gray-300 p-4 mb-6 text-right">
        <p>届出者</p>
        <p className="mt-2">
          住所　<EmptyField label="住所を入力" width="w-64" />
        </p>
        <p className="mt-2">
          氏名　<FilledText>{name}</FilledText>　　　　印
        </p>
      </div>
      <p className="mb-4 text-sm">
        貨物軽自動車安全管理者を下記のとおり選任したので、
        貨物自動車運送事業法第36条の2第3項の規定により届け出ます。
      </p>
      <table className="w-full border-collapse border border-gray-400 text-sm">
        <tbody>
          <tr>
            <td className="border border-gray-400 px-3 py-2 bg-gray-50 w-1/3 font-semibold">事業者の氏名・名称</td>
            <td className="border border-gray-400 px-3 py-2">
              <FilledText>{name}</FilledText>
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-3 py-2 bg-gray-50 font-semibold">安全管理者の氏名</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">（Phase 2で入力）</td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-3 py-2 bg-gray-50 font-semibold">生年月日</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">（Phase 2で入力）</td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-3 py-2 bg-gray-50 font-semibold">選任年月日</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">（Phase 2で入力）</td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-3 py-2 bg-gray-50 font-semibold">講習修了年月日</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">（Phase 2で入力）</td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-3 py-2 bg-gray-50 font-semibold">修了証番号</td>
            <td className="border border-gray-400 px-3 py-2 text-gray-400">（Phase 2で入力）</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-4 bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
        ⚠️ 安全管理者はNASVA（自動車事故対策機構）の講習を受講した方を選任する必要があります。
        個人事業主の場合は届出者本人が受講するのが一般的です。
      </div>
    </div>
  );
}
