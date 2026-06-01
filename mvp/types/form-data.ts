// 黒ナンバー届出フォームの共有データモデル。
// 各フィールドは docs/forms/*.md の「対応する入力項目」列に対応する。
// フォーム(Phase B)とPDF出力(Phase C)はこの型を共有する。

export type ApplicantType = 'individual' | 'corporation';

export type FareTemplateId = 'amazon' | 'spot' | 'regular' | 'custom';

export interface Vehicle {
  plateNumber: string; // 登録番号（現・黄ナンバー）
  chassisNumber: string; // 車台番号
  vehicleName: string; // 車名
  model: string; // 型式
  ownerName: string; // 車検証の名義
}

export interface SafetyManager {
  name: string; // 安全管理者氏名
  birthDate: string; // 生年月日 (YYYY-MM-DD)
  appointmentDate: string; // 選任年月日 (YYYY-MM-DD)
  trainingCompletionDate: string; // 講習修了年月日 (YYYY-MM-DD)
  certificateNumber: string; // 修了証番号
  trainingInstitution: string; // 講習機関名
}

export interface FareSettings {
  distanceFareBase: number; // 初乗り運賃（円）
  distanceFareIncrement: number; // 加算運賃（円/km）
  timeFare: number; // 時間制運賃（円/時）
  waitingFee: number; // 待機料金（円/30分）
}

export interface FormValues {
  // 基本情報
  applicantType: ApplicantType;
  name: string; // 氏名または法人名
  representativeName: string; // 代表者名（法人のみ）
  postalCode: string;
  address: string;
  phone: string;

  // 事業情報
  prefecture: string; // 管轄都道府県コード（lib/prefectures.ts のキー）
  submitDate: string; // 提出予定日 (YYYY-MM-DD)
  businessStartDate: string; // 事業開始予定日 (YYYY-MM-DD)

  // 営業所
  officeSameAsHome: boolean;
  officeName: string;
  officeAddress: string;

  // 車庫
  garageAttachedToOffice: boolean;
  garageAddress: string;
  garageCapacity: number;

  // 車両（複数台）
  vehicles: Vehicle[];

  // 安全管理者
  safetyManager: SafetyManager;

  // 運賃
  fareTemplate: FareTemplateId;
  fareSettings: FareSettings;
}

export function emptyVehicle(): Vehicle {
  return { plateNumber: '', chassisNumber: '', vehicleName: '', model: '', ownerName: '' };
}

export function defaultFormValues(): FormValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    applicantType: 'individual',
    name: '',
    representativeName: '',
    postalCode: '',
    address: '',
    phone: '',
    prefecture: '',
    submitDate: today,
    businessStartDate: '',
    officeSameAsHome: true,
    officeName: '',
    officeAddress: '',
    garageAttachedToOffice: true,
    garageAddress: '',
    garageCapacity: 1,
    vehicles: [emptyVehicle()],
    safetyManager: {
      name: '',
      birthDate: '',
      appointmentDate: today,
      trainingCompletionDate: '',
      certificateNumber: '',
      trainingInstitution: 'NASVA（自動車事故対策機構）',
    },
    fareTemplate: 'amazon',
    fareSettings: { distanceFareBase: 800, distanceFareIncrement: 200, timeFare: 4000, waitingFee: 500 },
  };
}
