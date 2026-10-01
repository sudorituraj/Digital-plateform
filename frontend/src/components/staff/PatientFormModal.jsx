import { useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { api, errorMessage } from '../../lib/api'
import { Alert, Button, ChoiceChips, Modal, PhoneField, TextareaField, TextField } from '../ui'

const FIELDS = { phone: '', name: '', age: '', gender: '', email: '', father_husband_name: '', address: '' }

/** Add a new patient, or edit an existing one (pass `patient`). */
export function PatientFormModal({ patient, onClose, onSaved }) {
  const { t } = useI18n()
  const editing = Boolean(patient)
  const [form, setForm] = useState(() =>
    Object.fromEntries(Object.keys(FIELDS).map((k) => [k, patient?.[k] != null ? String(patient[k]) : FIELDS[k]])),
  )
  const [errors, setErrors] = useState({})
  const [state, setState] = useState({ busy: false, error: null })
  const set = (field) => (e) => setForm({ ...form, [field]: e?.target ? e.target.value : e })

  async function submit(e) {
    e.preventDefault()
    const errs = {}
    if (!/^[6-9]\d{9}$/.test(form.phone)) errs.phone = t('form.errors.mobile')
    if (form.name.trim().length < 2) errs.name = t('form.errors.required')
    const age = Number(form.age)
    if (form.age === '' || !Number.isInteger(age) || age < 0 || age > 120) errs.age = t('form.errors.age')
    if (!form.gender) errs.gender = t('form.errors.choose')
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = t('form.errors.email')
    setErrors(errs)
    if (Object.keys(errs).length) return
    setState({ busy: true, error: null })
    try {
      const body = { ...form, age }
      const saved = editing
        ? await api.put(`/staff/patients/${patient.patient_code}`, body)
        : await api.post('/staff/patients', body)
      onSaved(saved)
    } catch (err) {
      const suffix = err.code === 'patient_exists' && err.patientCode ? ` (${err.patientCode})` : ''
      setState({ busy: false, error: errorMessage(t, err) + suffix })
    }
  }

  return (
    <Modal open onClose={onClose} size="lg" title={editing ? t('staff.patients.editTitle') : t('staff.patients.addTitle')}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <PhoneField label={t('form.mobile')} value={form.phone} onChange={set('phone')} error={errors.phone} autoFocus={!editing} />
        <TextField label={t('form.fullName')} value={form.name} onChange={set('name')} error={errors.name} autoComplete="off" />
        <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
          <TextField label={t('form.age')} type="number" inputMode="numeric" min={0} max={120} value={form.age} onChange={set('age')} error={errors.age} />
          <ChoiceChips
            legend={t('form.gender')}
            name="patient-gender"
            value={form.gender}
            onChange={set('gender')}
            error={errors.gender}
            options={['female', 'male', 'other'].map((v) => ({ value: v, label: t(`form.${v}`) }))}
          />
        </div>
        <TextField label={t('form.fatherHusbandName')} optional maxLength={80} value={form.father_husband_name} onChange={set('father_husband_name')} />
        <TextareaField label={t('form.address')} optional rows={2} maxLength={200} value={form.address} onChange={set('address')} />
        <TextField label={t('form.email')} type="email" optional maxLength={120} value={form.email} onChange={set('email')} error={errors.email} />
        {state.error && <Alert tone="error">{state.error}</Alert>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            {t('staff.cancel.keep')}
          </Button>
          <Button type="submit" icon="check" disabled={state.busy}>
            {editing ? t('staff.patients.save') : t('staff.patients.add')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
