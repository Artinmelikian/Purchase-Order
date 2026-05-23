import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { T } from '../constants'
import ItemsTable from './ItemsTable'

const EMPTY_ITEM = { code: '', name: '', unit: '', quantity: '' }

export default function POForm({ onSubmitted }) {
  const [poNumber, setPoNumber] = useState('001')
  const [department, setDepartment] = useState('')
  const [responsible, setResponsible] = useState('')
  const [purpose, setPurpose] = useState('')
  const [notes, setNotes] = useState('')
  const [sigFile, setSigFile] = useState(null)
  const [sigPreview, setSigPreview] = useState(null)
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [itemsSubmitted, setItemsSubmitted] = useState(false)

  const today = new Date().toLocaleDateString('hy-AM', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  useEffect(() => {
    if (!isConfigured) return
    async function fetchNextPO() {
      const { data } = await supabase
        .from('purchase_orders')
        .select('po_number')
        .order('po_number', { ascending: false })
        .limit(1)
      if (data && data.length > 0) {
        setPoNumber(String((parseInt(data[0].po_number, 10) || 0) + 1).padStart(3, '0'))
      }
    }
    fetchNextPO()
  }, [])

  function handleSigChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setSigFile(file)
    setSigPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setItemsSubmitted(true)
    const validItems = items.filter(it => it.name.trim())
    if (validItems.length === 0) {
      setError('Ավելացրեք առնվազն մեկ ապրանք')
      return
    }
    const incomplete = validItems.some(it => !it.unit.trim() || !it.quantity.trim())
    if (incomplete) {
      setError('Լրացրեք բոլոր պարտադիր դաշտերը (Անվանումը, Միավ., Քանակը)')
      return
    }
    if (!isConfigured) {
      setError('Supabase կարգավորված չէ: լրացրեք .env.local')
      return
    }
    setSubmitting(true)
    try {
      const orderId = crypto.randomUUID()
      let respSigUrl = null
      if (sigFile) {
        const ext = sigFile.name.split('.').pop()
        const path = `responsible/${orderId}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('signatures')
          .upload(path, sigFile, { contentType: sigFile.type })
        if (uploadErr) throw uploadErr
        const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(path)
        respSigUrl = urlData.publicUrl
      }
      const { error: insertErr } = await supabase.from('purchase_orders').insert({
        id: orderId,
        po_number: poNumber,
        department: department.trim(),
        responsible: responsible.trim(),
        purpose: purpose.trim(),
        notes: notes.trim() || null,
        resp_sig_url: respSigUrl,
        status: 'pending',
      })
      if (insertErr) throw insertErr
      const { error: itemsErr } = await supabase.from('po_items').insert(
        validItems.map((it, idx) => ({
          po_id: orderId,
          nn: idx + 1,
          code: it.code.trim() || null,
          name: it.name.trim(),
          unit: it.unit.trim() || null,
          quantity: it.quantity.trim() || null,
        }))
      )
      if (itemsErr) throw itemsErr
      setSuccess(true)
      setDepartment(''); setResponsible(''); setPurpose(''); setNotes('')
      setSigFile(null); setSigPreview(null)
      setItems([{ ...EMPTY_ITEM }])
      setItemsSubmitted(false)
      setPoNumber(String(parseInt(poNumber, 10) + 1).padStart(3, '0'))
      if (onSubmitted) onSubmitted()
    } catch (err) {
      console.error(err)
      setError('Սխալ: ' + (err.message || 'Անհայտ սխալ'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
  const labelCls = 'block text-sm font-semibold text-gray-700 mb-1'

  const CO_ROWS = [
    [T.CO_BUYER,  T.VAL_BUYER],
    [T.CO_ADDR,   T.VAL_ADDR],
    [T.CO_TAX,    T.VAL_TAX],
    [T.CO_REG,    T.VAL_REG],
    [T.CO_BANK,   T.VAL_BANK],
    [T.CO_ACCT,   T.VAL_ACCT],
    [T.CO_PHONE,  T.VAL_PHONE || '—'],
    [T.CO_EMAIL,  T.VAL_EMAIL],
  ]

  return (
    <div className="max-w-3xl mx-auto">
      {success && (
        <div className="mb-4 bg-green-50 border border-green-300 text-green-800 rounded px-4 py-3 text-sm flex justify-between items-start">
          <span>{T.MSG_SUCCESS}</span>
          <button onClick={() => setSuccess(false)} className="ml-4 font-bold text-green-600">×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* PO Number + Date */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className={labelCls}>{T.PO_NUM_LABEL}</label>
            <input value={poNumber} readOnly className={inputCls + ' bg-gray-50 text-gray-500 cursor-default'} />
          </div>
          <div className="flex-1">
            <label className={labelCls}>{T.DATE_LABEL}</label>
            <input value={today} readOnly className={inputCls + ' bg-gray-50 text-gray-500 cursor-default'} />
          </div>
        </div>

        {/* Department */}
        <div>
          <label className={labelCls}>{T.DEPT_LABEL} *</label>
          <input value={department} onChange={e => setDepartment(e.target.value)}
            required className={inputCls} placeholder={T.PH_DEPT} />
        </div>

        {/* Responsible + Signature */}
        <div>
          <label className={labelCls}>{T.RESP_LABEL} *</label>
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <input value={responsible} onChange={e => setResponsible(e.target.value)}
                required className={inputCls} placeholder={T.PH_RESP} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{T.SIG_LABEL}</label>
              <label className="cursor-pointer flex items-center gap-2 border border-dashed border-gray-300 rounded px-3 py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 transition">
                <span>📎 {T.SIG_ATTACH}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleSigChange} />
              </label>
              {sigPreview && (
                <div className="mt-1 relative inline-block">
                  <img src={sigPreview} alt="sig" className="h-10 object-contain border rounded" />
                  <button type="button" onClick={() => { setSigFile(null); setSigPreview(null) }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">×</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className={labelCls}>{T.PURPOSE_LABEL} *</label>
          <input value={purpose} onChange={e => setPurpose(e.target.value)}
            required className={inputCls} placeholder={T.PH_PURP} />
        </div>

        {/* Company info (static) */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500 bg-gray-100 px-3 py-1.5 rounded mb-2">
            {T.SECT_STATIC_CO}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs grid grid-cols-1 gap-y-1.5">
            {CO_ROWS.map(([l, v]) => (
              <div key={l} className="flex gap-2">
                <span className="font-semibold text-gray-600 shrink-0 w-40">{l}:</span>
                <span className="text-gray-800">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>{T.NOTES_LABEL}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={2} className={inputCls + ' resize-none'} placeholder={T.PH_NOTES} />
        </div>

        {/* Items */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500 bg-gray-100 px-3 py-1.5 rounded mb-2">
            {T.SECT_ITEMS}
          </div>
          <ItemsTable items={items} onChange={setItems} showErrors={itemsSubmitted} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-2 text-sm">{error}</div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg text-sm transition">
          {submitting ? T.BTN_SENDING : T.BTN_SUBMIT}
        </button>
      </form>
    </div>
  )
}
