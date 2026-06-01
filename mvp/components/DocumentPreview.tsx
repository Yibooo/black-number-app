'use client';

import { useState } from 'react';
import { generatePDF } from '@/lib/pdf-generator';
import type { FormValues } from '@/types/form-data';
import { toWareki } from '@/lib/wareki';
import { officeAddressLine, getPrefecture } from '@/lib/prefectures';
import { yen } from '@/lib/format';

interface Props {
  data: FormValues;
  onReset: () => void;
}

export default function DocumentPreview({ data, onReset }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDoc, setActiveDoc] = useState(0);

  const displayName =
    data.applicantType === 'corporation' && data.representativeName
      ? `${data.name}（代表者 ${data.representativeName}）`
      : data.name;
  const fullAddress = data.postalCode ? `〒${data.postalCode} ${data.address}` : data.address;
  const ate = officeAddressLine(data.prefecture);

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
      await generatePDF(data.name, new Date());
    } catch (e) {
      console.error(e);
      alert('PDF生成中にエラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xl">✓</span>
        </div>
        <div>
          <p className="text-green-800 font-bold">書類プレビューを生成しました！</p>
          <p className="text-green-700 text-sm">
            <strong>「{data.name}」</strong> 様の情報が全書類に自動記入されました。
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50"
        >
          {isGenerating ? <span className="animate-spin">⏳</span> : <span>📄</span>}
          <span>{isGenerating ? '生成中...' : 'PDFで出力'}</span>
        </button>
        <span className="text-xs text-gray-400 self-center">※ 所定様式PDFはPhase Cで対応</span>
        <button
          onClick={onReset}
          className="flex items-center gap-2 border border-gray-300 text-gray-600 px-5 py-3 rounded-xl font-bold hover:bg-gray-50 ml-auto"
        >
          <span>←</span>
          <span>入力に戻る</span>
        </button>
      </div>

      <div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-t-lg text-sm font-semibold ${
                activeDoc === doc.id
                  ? 'bg-white border border-gray-200 border-b-white text-black'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {doc.shortTitle}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-b-xl rounded-tr-xl shadow-sm">
          {activeDoc === 0 && <Document1 data={data} displayName={displayName} fullAddress={fullAddress} ate={ate} />}
          {activeDoc === 1 && <Document2 data={data} displayName={displayName} fullAddress={fullAddress} ate={ate} />}
          {activeDoc === 2 && <Document3 data={data} displayName={displayName} />}
          {activeDoc === 3 && <Document4 data={data} displayName={displayName} fullAddress={fullAddress} />}
          {activeDoc === 4 && <Document5 data={data} displayName={displayName} fullAddress={fullAddress} ate={ate} />}
        </div>
      </div>

      <SubmitChecklist data={data} />
    </div>
  );
}

/* ===== 共通パーツ ===== */
function F({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-blue-700 font-bold underline decoration-blue-300 decoration-dotted">
      {children}
    </span>
  );
}
function Empty({ label, width = 'w-32' }: { label: string; width?: string }) {
  return (
    <span className={`inline-block ${width} border-b-2 border-gray-400 text-center text-gray-400 text-sm`}>
      {label}
    </span>
  );
}
function ApplicantBox({ fullAddress, displayName }: { fullAddress: string; displayName: string }) {
  return (
    <div className="border border-gray-300 p-4 mb-6 text-right">
      <p>届出者</p>
      <p className="mt-2">住所　<F>{fullAddress}</F></p>
      <p className="mt-2">氏名　<F>{displayName}</F>　　　　㊞</p>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <td className="border border-gray-400 px-3 py-2 bg-gray-50 w-1/3 font-semibold align-top">{children}</td>;
}

interface DocProps {
  data: FormValues;
  displayName: string;
  fullAddress: string;
  ate: string;
}

function Document1({ data, displayName, fullAddress, ate }: DocProps) {
  return (
    <div className="p-8 font-serif text-sm leading-relaxed" style={{ minHeight: '700px' }}>
      <div className="text-right text-xs text-gray-400 mb-2">様式第1号</div>
      <h2 className="text-center text-lg font-bold mb-1 tracking-widest">貨物軽自動車運送事業経営届出書</h2>
      <p className="text-right text-sm mb-6"><F>{toWareki(data.submitDate)}</F></p>
      <p className="mb-6">{ate ? <F>{ate}</F> : <Empty label="○○運輸支局長 殿" width="w-56" />}</p>
      <ApplicantBox fullAddress={fullAddress} displayName={displayName} />
      <p className="mb-4 text-sm">
        貨物軽自動車運送事業を経営しようとするので、貨物自動車運送事業法第36条第1項の規定により、下記のとおり届け出ます。
      </p>
      <table className="w-full border-collapse border border-gray-400 text-sm">
        <tbody>
          <tr><Th>氏名又は名称</Th><td className="border border-gray-400 px-3 py-2"><F>{displayName}</F></td></tr>
          <tr><Th>営業所の名称及び位置</Th><td className="border border-gray-400 px-3 py-2"><F>{data.officeName}</F>／<F>{data.officeAddress}</F></td></tr>
          <tr><Th>事業用自動車の種別及び台数</Th><td className="border border-gray-400 px-3 py-2">軽自動車（貨物）　<F>{data.vehicles.length}</F>両</td></tr>
          <tr><Th>事業の開始予定日</Th><td className="border border-gray-400 px-3 py-2"><F>{toWareki(data.businessStartDate)}</F></td></tr>
          <tr><Th>車庫の所在地及び収容能力</Th><td className="border border-gray-400 px-3 py-2"><F>{data.garageAddress}</F>／<F>{data.garageCapacity}</F>両</td></tr>
          <tr><Th>運送約款</Th><td className="border border-gray-400 px-3 py-2">☑ 標準貨物軽自動車運送約款を使用する</td></tr>
        </tbody>
      </table>
      <div className="mt-6 text-xs text-gray-400 text-center">※ 青色太字・下線部分が自動入力された箇所です</div>
    </div>
  );
}

function Document2({ data, displayName, fullAddress, ate }: DocProps) {
  return (
    <div className="p-8 font-serif text-sm leading-relaxed" style={{ minHeight: '700px' }}>
      <div className="text-right text-xs text-gray-400 mb-2">様式第3号</div>
      <h2 className="text-center text-lg font-bold mb-1 tracking-widest">運賃料金設定届出書</h2>
      <p className="text-right text-sm mb-6"><F>{toWareki(data.submitDate)}</F></p>
      <p className="mb-6">{ate ? <F>{ate}</F> : <Empty label="○○運輸支局長 殿" width="w-56" />}</p>
      <ApplicantBox fullAddress={fullAddress} displayName={displayName} />
      <p className="mb-4 text-sm">
        貨物軽自動車運送事業の運賃及び料金を下記のとおり設定したので、貨物自動車運送事業法第36条第2項の規定により届け出ます。
      </p>
      <p className="text-center mb-4">記</p>
      <table className="w-full border-collapse border border-gray-400 text-sm">
        <tbody>
          <tr><Th>1. 設定する運賃・料金</Th><td className="border border-gray-400 px-3 py-2">別紙「運賃料金表」のとおり</td></tr>
          <tr><Th>2. 実施年月日</Th><td className="border border-gray-400 px-3 py-2"><F>{toWareki(data.businessStartDate)}</F></td></tr>
        </tbody>
      </table>
    </div>
  );
}

function Document3({ data, displayName }: { data: FormValues; displayName: string }) {
  const f = data.fareSettings;
  return (
    <div className="p-8 font-serif text-sm leading-relaxed" style={{ minHeight: '700px' }}>
      <h2 className="text-center text-lg font-bold mb-1 tracking-widest">運　賃　料　金　表</h2>
      <p className="text-center text-sm text-gray-500 mb-6">（貨物軽自動車運送事業）</p>
      <div className="text-right mb-4"><p>事業者名：<F>{displayName}</F></p></div>
      <table className="w-full border-collapse border border-gray-800 text-sm mb-6">
        <thead>
          <tr className="bg-gray-100"><th className="border border-gray-800 px-4 py-3 text-center" colSpan={2}>距離制運賃</th></tr>
        </thead>
        <tbody>
          <tr><td className="border border-gray-800 px-3 py-2">初乗り（2kmまで）</td><td className="border border-gray-800 px-3 py-2"><F>{yen(f.distanceFareBase)}</F></td></tr>
          <tr><td className="border border-gray-800 px-3 py-2">2km超 1kmごと</td><td className="border border-gray-800 px-3 py-2"><F>{yen(f.distanceFareIncrement)}</F> 加算</td></tr>
        </tbody>
      </table>
      <table className="w-full border-collapse border border-gray-800 text-sm">
        <thead>
          <tr className="bg-gray-100"><th className="border border-gray-800 px-4 py-3 text-center" colSpan={2}>時間制運賃・料金</th></tr>
        </thead>
        <tbody>
          <tr><td className="border border-gray-800 px-3 py-2">時間制運賃（1時間）</td><td className="border border-gray-800 px-3 py-2"><F>{yen(f.timeFare)}</F></td></tr>
          <tr><td className="border border-gray-800 px-3 py-2">待機料金（30分ごと）</td><td className="border border-gray-800 px-3 py-2"><F>{yen(f.waitingFee)}</F></td></tr>
        </tbody>
      </table>
    </div>
  );
}

function Document4({ data, displayName, fullAddress }: { data: FormValues; displayName: string; fullAddress: string }) {
  return (
    <div className="p-8 font-serif text-sm leading-relaxed" style={{ minHeight: '700px' }}>
      <h2 className="text-center text-lg font-bold mb-1 tracking-widest">事業用自動車等連絡書</h2>
      <div className="flex justify-between mb-6">
        <p className="text-sm"><F>{toWareki(data.submitDate)}</F></p>
        <p className="text-sm">番号：<Empty label="運輸支局記入" width="w-24" /></p>
      </div>
      <div className="border border-gray-300 p-4 mb-6">
        <p className="font-semibold mb-3">事業者情報</p>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div><span className="text-gray-500">氏名・名称：</span><F>{displayName}</F></div>
          <div><span className="text-gray-500">住所：</span><F>{fullAddress}</F></div>
          <div><span className="text-gray-500">使用の本拠：</span><F>{data.officeAddress}</F></div>
        </div>
      </div>
      <table className="w-full border-collapse border border-gray-400 text-xs">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-400 px-2 py-2">車名/型式</th>
            <th className="border border-gray-400 px-2 py-2">車台番号</th>
            <th className="border border-gray-400 px-2 py-2">登録番号</th>
            <th className="border border-gray-400 px-2 py-2">用途</th>
            <th className="border border-gray-400 px-2 py-2">異動</th>
          </tr>
        </thead>
        <tbody>
          {data.vehicles.map((v, i) => (
            <tr key={i}>
              <td className="border border-gray-400 px-2 py-2"><F>{v.vehicleName}</F>/<F>{v.model}</F></td>
              <td className="border border-gray-400 px-2 py-2"><F>{v.chassisNumber}</F></td>
              <td className="border border-gray-400 px-2 py-2"><F>{v.plateNumber}</F></td>
              <td className="border border-gray-400 px-2 py-2">貨物</td>
              <td className="border border-gray-400 px-2 py-2">自家用→事業用</td>
            </tr>
          ))}
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

function Document5({ data, displayName, fullAddress, ate }: DocProps) {
  const sm = data.safetyManager;
  return (
    <div className="p-8 font-serif text-sm leading-relaxed" style={{ minHeight: '700px' }}>
      <div className="flex justify-end mb-2">
        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">令和7年4月義務化</span>
      </div>
      <h2 className="text-center text-lg font-bold mb-1 tracking-widest">貨物軽自動車安全管理者選任届出書</h2>
      <p className="text-right text-sm mb-6"><F>{toWareki(data.submitDate)}</F></p>
      <p className="mb-6">{ate ? <F>{ate}</F> : <Empty label="○○運輸支局長 殿" width="w-56" />}</p>
      <ApplicantBox fullAddress={fullAddress} displayName={displayName} />
      <p className="mb-4 text-sm">貨物軽自動車安全管理者を下記のとおり選任したので、貨物自動車運送事業法の規定により届け出ます。</p>
      <table className="w-full border-collapse border border-gray-400 text-sm">
        <tbody>
          <tr><Th>事業者の氏名・名称</Th><td className="border border-gray-400 px-3 py-2"><F>{displayName}</F></td></tr>
          <tr><Th>安全管理者の氏名</Th><td className="border border-gray-400 px-3 py-2"><F>{sm.name}</F></td></tr>
          <tr><Th>生年月日</Th><td className="border border-gray-400 px-3 py-2"><F>{toWareki(sm.birthDate)}</F></td></tr>
          <tr><Th>選任年月日</Th><td className="border border-gray-400 px-3 py-2"><F>{toWareki(sm.appointmentDate)}</F></td></tr>
          <tr><Th>講習修了年月日</Th><td className="border border-gray-400 px-3 py-2"><F>{toWareki(sm.trainingCompletionDate)}</F></td></tr>
          <tr><Th>修了証番号</Th><td className="border border-gray-400 px-3 py-2"><F>{sm.certificateNumber}</F></td></tr>
          <tr><Th>講習機関名</Th><td className="border border-gray-400 px-3 py-2"><F>{sm.trainingInstitution}</F></td></tr>
        </tbody>
      </table>
    </div>
  );
}

function SubmitChecklist({ data }: { data: FormValues }) {
  const pref = getPrefecture(data.prefecture);
  const office = pref?.office ?? '管轄の運輸支局';
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
      <h3 className="font-bold text-yellow-800 mb-3">📋 提出先チェックリスト</h3>
      <ol className="space-y-2">
        {[
          { step: '①', text: `${office}へ書類①②③④⑤を提出（正・控の2部）`, sub: '平日9:00〜16:00' },
          { step: '②', text: '受付印をもらった「事業用自動車等連絡書④」を受け取る', sub: '' },
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
  );
}
