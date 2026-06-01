import { z } from 'zod';

const required = (label: string) => z.string().trim().min(1, `${label}を入力してください`);

const vehicleSchema = z.object({
  plateNumber: required('登録番号'),
  chassisNumber: required('車台番号'),
  vehicleName: required('車名'),
  model: required('型式'),
  ownerName: required('車検証の名義'),
});

const safetyManagerSchema = z
  .object({
    name: required('安全管理者氏名'),
    birthDate: required('生年月日'),
    appointmentDate: required('選任年月日'),
    trainingCompletionDate: required('講習修了日'),
    certificateNumber: required('修了証番号'),
    trainingInstitution: required('講習機関名'),
  })
  .refine(
    (s) => !s.trainingCompletionDate || !s.appointmentDate || s.trainingCompletionDate <= s.appointmentDate,
    { message: '講習修了日は選任年月日より前の日付にしてください', path: ['trainingCompletionDate'] }
  );

export const formSchema = z
  .object({
    applicantType: z.enum(['individual', 'corporation']),
    name: required('氏名または法人名').min(2, '2文字以上で入力してください'),
    representativeName: z.string().trim(),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{3}-?\d{4}$/, '郵便番号は7桁（例: 150-0002）で入力してください'),
    address: required('住所'),
    phone: z
      .string()
      .trim()
      .regex(/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/, '電話番号の形式が正しくありません'),

    prefecture: required('管轄都道府県'),
    submitDate: required('提出予定日'),
    businessStartDate: required('事業開始予定日'),

    officeSameAsHome: z.boolean(),
    officeName: required('営業所名称'),
    officeAddress: required('営業所所在地'),

    garageAttachedToOffice: z.boolean(),
    garageAddress: required('車庫所在地'),
    garageCapacity: z.coerce.number().int().min(1, '1以上の整数を入力してください'),

    vehicles: z.array(vehicleSchema).min(1, '車両を1台以上登録してください'),

    safetyManager: safetyManagerSchema,

    fareTemplate: z.enum(['amazon', 'spot', 'regular', 'custom']),
    fareSettings: z.object({
      distanceFareBase: z.coerce.number().min(0),
      distanceFareIncrement: z.coerce.number().min(0),
      timeFare: z.coerce.number().min(0),
      waitingFee: z.coerce.number().min(0),
    }),
  })
  .refine((d) => d.applicantType !== 'corporation' || d.representativeName.trim().length > 0, {
    message: '法人の場合は代表者名を入力してください',
    path: ['representativeName'],
  })
  .refine((d) => !d.submitDate || !d.businessStartDate || d.businessStartDate >= d.submitDate, {
    message: '事業開始予定日は提出予定日以降にしてください',
    path: ['businessStartDate'],
  });

// 各ステップで検証するフィールド（RHF の trigger 用）
export const STEP_FIELDS = [
  ['applicantType', 'name', 'representativeName', 'postalCode', 'address', 'phone', 'prefecture'],
  ['officeName', 'officeAddress'],
  ['garageAddress', 'garageCapacity'],
  ['vehicles'],
  ['safetyManager'],
  ['businessStartDate', 'submitDate', 'fareTemplate', 'fareSettings'],
] as const;
