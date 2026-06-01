'use client';

import { useEffect } from 'react';
import {
  useForm,
  FormProvider,
  useFormContext,
  useFieldArray,
  useWatch,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { formSchema, STEP_FIELDS } from '@/lib/schema';
import { defaultFormValues, emptyVehicle, type FormValues } from '@/types/form-data';
import { PREFECTURES } from '@/lib/prefectures';
import { FARE_TEMPLATES, getFareTemplate } from '@/lib/fare-templates';
import {
  TextField,
  NumberField,
  DateField,
  SelectField,
  CheckboxField,
  Label,
} from './Fields';

const STEPS = ['基本情報', '営業所', '車庫', '車両', '安全管理者', '事業・運賃'];

interface Props {
  onComplete: (values: FormValues) => void;
  initialValues?: FormValues;
}

export default function MultiStepForm({ onComplete, initialValues }: Props) {
  const methods = useForm<FormValues>({
    // zod の入出力型差異を吸収するためキャスト
    resolver: zodResolver(formSchema) as never,
    defaultValues: initialValues ?? defaultFormValues(),
    mode: 'onBlur',
  });
  const [step, setStep] = useState(0);

  const next = async () => {
    const ok = await methods.trigger(STEP_FIELDS[step] as never);
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = methods.handleSubmit((values) => onComplete(values));

  return (
    <FormProvider {...methods}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <StepProgress step={step} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === STEPS.length - 1) submit();
            else next();
          }}
          className="p-6"
        >
          {step === 0 && <StepBasic />}
          {step === 1 && <StepOffice />}
          {step === 2 && <StepGarage />}
          {step === 3 && <StepVehicles />}
          {step === 4 && <StepSafetyManager />}
          {step === 5 && <StepBusiness />}

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                className="px-5 py-3 rounded-xl font-bold border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                ← 戻る
              </button>
            )}
            <button
              type="submit"
              className="ml-auto px-6 py-3 rounded-xl font-bold bg-black text-white hover:bg-gray-800"
            >
              {step === STEPS.length - 1 ? '書類プレビューを生成 →' : '次へ →'}
            </button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function StepProgress({ step }: { step: number }) {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-6 py-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-white font-bold">
          STEP {step + 1} / {STEPS.length} — {STEPS[step]}
        </h2>
        <span className="text-gray-300 text-xs">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
      </div>
      <div className="flex gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-yellow-400' : 'bg-gray-600'}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ===== STEP 1: 基本情報 ===== */
function StepBasic() {
  const { control, setValue } = useFormContext<FormValues>();
  const applicantType = useWatch({ control, name: 'applicantType' });

  return (
    <div>
      <Label required>届出者種別</Label>
      <div className="flex gap-3 mb-4">
        {[
          { v: 'individual', l: '個人事業主' },
          { v: 'corporation', l: '法人' },
        ].map((o) => (
          <button
            type="button"
            key={o.v}
            onClick={() => setValue('applicantType', o.v as FormValues['applicantType'])}
            className={`flex-1 py-2.5 rounded-lg border font-semibold text-sm ${
              applicantType === o.v
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>
      <TextField
        name="name"
        label={applicantType === 'corporation' ? '法人名' : '氏名'}
        required
        placeholder={applicantType === 'corporation' ? '株式会社〇〇運送' : '山田 太郎'}
      />
      {applicantType === 'corporation' && (
        <TextField name="representativeName" label="代表者名" required placeholder="代表取締役 山田 太郎" />
      )}
      <TextField name="postalCode" label="郵便番号" required placeholder="150-0002" hint="ハイフン可" />
      <TextField name="address" label="住所" required placeholder="東京都渋谷区渋谷1-2-3 渋谷ハイツ101" />
      <TextField name="phone" label="電話番号" required placeholder="090-1234-5678" />
      <SelectField
        name="prefecture"
        label="管轄都道府県"
        required
        hint="提出先の運輸支局を自動補完"
        options={PREFECTURES.map((p) => ({ value: p.code, label: p.name }))}
      />
    </div>
  );
}

/* ===== STEP 2: 営業所 ===== */
function StepOffice() {
  const { control, setValue } = useFormContext<FormValues>();
  const same = useWatch({ control, name: 'officeSameAsHome' });
  const homeAddress = useWatch({ control, name: 'address' });

  useEffect(() => {
    if (same) setValue('officeAddress', homeAddress, { shouldValidate: true });
  }, [same, homeAddress, setValue]);

  return (
    <div>
      <TextField name="officeName" label="営業所の名称" required placeholder="山田運送" />
      <CheckboxField name="officeSameAsHome" label="営業所の所在地は自宅（基本情報の住所）と同じ" />
      {!same && (
        <TextField name="officeAddress" label="営業所の所在地" required placeholder="東京都〇〇区〇〇1-2-3" />
      )}
      {same && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
          営業所所在地：<span className="font-semibold text-gray-700">{homeAddress || '（基本情報の住所）'}</span>
        </p>
      )}
    </div>
  );
}

/* ===== STEP 3: 車庫 ===== */
function StepGarage() {
  const { control, setValue } = useFormContext<FormValues>();
  const attached = useWatch({ control, name: 'garageAttachedToOffice' });
  const officeAddress = useWatch({ control, name: 'officeAddress' });

  useEffect(() => {
    if (attached) setValue('garageAddress', officeAddress, { shouldValidate: true });
  }, [attached, officeAddress, setValue]);

  return (
    <div>
      <CheckboxField name="garageAttachedToOffice" label="車庫は営業所に併設している" />
      {!attached && (
        <TextField name="garageAddress" label="車庫の所在地" required placeholder="東京都〇〇区〇〇1-2-3" />
      )}
      {attached && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4">
          車庫所在地：<span className="font-semibold text-gray-700">{officeAddress || '（営業所の所在地）'}</span>
        </p>
      )}
      <NumberField name="garageCapacity" label="収容能力（台数）" required placeholder="1" />
      <p className="text-xs text-gray-400 mt-1">
        ※ 車庫は営業所から直線2km以内が原則です。
      </p>
    </div>
  );
}

/* ===== STEP 4: 車両（複数台） ===== */
function StepVehicles() {
  const { control } = useFormContext<FormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'vehicles' });

  return (
    <div>
      {fields.map((f, i) => (
        <div key={f.id} className="mb-5 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-sm text-gray-700">車両 {i + 1}</span>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-red-500 text-xs font-semibold hover:underline"
              >
                削除
              </button>
            )}
          </div>
          <TextField name={`vehicles.${i}.vehicleName`} label="車名" required placeholder="スズキ" />
          <TextField name={`vehicles.${i}.model`} label="型式" required placeholder="EBD-DA17V" />
          <TextField
            name={`vehicles.${i}.chassisNumber`}
            label="車台番号"
            required
            placeholder="DA17V-1234567"
            hint="車検証どおり"
          />
          <TextField
            name={`vehicles.${i}.plateNumber`}
            label="登録番号（現ナンバー）"
            required
            placeholder="品川 480 あ 12-34"
          />
          <TextField
            name={`vehicles.${i}.ownerName`}
            label="車検証の名義"
            required
            placeholder="山田 太郎"
            hint="届出者と異なる場合は使用権原書類が必要"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => append(emptyVehicle())}
        className="w-full py-2.5 rounded-lg border border-dashed border-gray-400 text-gray-600 font-semibold text-sm hover:bg-gray-50"
      >
        ＋ 車両を追加
      </button>
    </div>
  );
}

/* ===== STEP 5: 安全管理者 ===== */
function StepSafetyManager() {
  return (
    <div>
      <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
        ⚠️ 令和7年4月義務化。NASVA等の講習を修了した方を選任します。個人事業主は本人が受講するのが一般的です。
      </div>
      <TextField name="safetyManager.name" label="安全管理者の氏名" required placeholder="山田 太郎" />
      <DateField name="safetyManager.birthDate" label="生年月日" required />
      <DateField name="safetyManager.trainingCompletionDate" label="講習修了日" required hint="選任日より前" />
      <DateField name="safetyManager.appointmentDate" label="選任年月日" required />
      <TextField
        name="safetyManager.certificateNumber"
        label="修了証番号"
        required
        placeholder="NASVA-2026-000123"
      />
      <TextField name="safetyManager.trainingInstitution" label="講習機関名" required />
    </div>
  );
}

/* ===== STEP 6: 事業・運賃 ===== */
function StepBusiness() {
  const { control, setValue } = useFormContext<FormValues>();
  const template = useWatch({ control, name: 'fareTemplate' });

  const applyTemplate = (id: FormValues['fareTemplate']) => {
    setValue('fareTemplate', id);
    const t = getFareTemplate(id);
    if (t?.settings) {
      setValue('fareSettings.distanceFareBase', t.settings.distanceFareBase);
      setValue('fareSettings.distanceFareIncrement', t.settings.distanceFareIncrement);
      setValue('fareSettings.timeFare', t.settings.timeFare);
      setValue('fareSettings.waitingFee', t.settings.waitingFee);
    }
  };

  return (
    <div>
      <DateField name="submitDate" label="提出予定日" required />
      <DateField name="businessStartDate" label="事業開始予定日" required hint="提出日以降" />

      <Label required>運賃テンプレート</Label>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {FARE_TEMPLATES.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => applyTemplate(t.id)}
            className={`text-left p-3 rounded-lg border text-sm ${
              template === t.id ? 'border-black bg-gray-50' : 'border-gray-300'
            }`}
          >
            <div className="font-semibold text-gray-800">{t.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField name="fareSettings.distanceFareBase" label="初乗り運賃（円）" />
        <NumberField name="fareSettings.distanceFareIncrement" label="加算運賃（円/km）" />
        <NumberField name="fareSettings.timeFare" label="時間制運賃（円/時）" />
        <NumberField name="fareSettings.waitingFee" label="待機料金（円/30分）" />
      </div>
      <p className="text-xs text-gray-400 mt-1">※ 運賃は例示です。事業者が自由に設定できます。</p>
    </div>
  );
}
