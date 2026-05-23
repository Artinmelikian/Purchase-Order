import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { T } from '../constants'
import ItemsTable from './ItemsTable'

const EMPTY_ITEM = { code: '', name: '', unit: '', quantity: '' }

export default function EditOrderModal({ order, onSaved, onCancel }) {
  const [department, setDepartment] = useState(order.department || '')
  const [responsible, setResponsible] = useState(order.responsible || '')
  const [purpose, setPurpose] = useState(order.purpose || '')
  const [notes, setNotes] = useState(order.notes || '')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [itemsSubmitted, setItemsSubmitted] = useState(false)

  useEffect(() => {
    async function fetchItems() {
      const { data } = await supabase
        .from('po_items').select('*').eq('po_id', order.id).order('nn', { ascending: true })
      if (data && data.length > 0) {
        setItems(data.map(it => ({
          code: it.code || '',
          name: it.name || '',
          unit: it.unit || '',
          quantity: it.quantity || '',
        })))
      }
    }
    fetchItems()
  }, [order.id])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setItemsSubmitted(true)

    const validItems = items.filter(it => it.name.trim())
    if (validItems.length === 0) {
      setError('Ավելացրեք առնվազն մեկ ապրանք')
      return
    }
    const incomplete = validItems.some(it => !it.unit.trim() || !it.quantity.toString().trim())
    if (incomplete) {
      setError('Լրացրեք բոլոր պարտադիր դաշտերը (Անvanumը, Миав., Цанакы)')
      return
    }

    setSubmitting(true)
    try {
      const { error: updateErr } = await supabase
        .from('purchase_orders')
        .update({
          department: department.trim(),
          responsible: responsible.trim(),
          purpose: purpose.trim(),
          notes: notes.trim() || null,
        })
        .eq('id', order.id)
      if (updateErr) throw updateErr

      const { error: deleteErr } = await supabase
        .from('po_items').delete().eq('po_id', order.id)
      if (deleteErr) throw deleteErr

      const { error: insertErr } = await supabase.from('po_items').insert(
        validItems.map((it, idx) => ({
          po_id: order.id,
          nn: idx + 1,
          code: it.code.trim() || null,
          name: it.name.trim(),
          unit: it.unit.trim() || null,
          quantity: it.quantity.toString().trim() || null,
        }))
      )
      if (insertErr) throw insertErr

      onSaved()
    } catch (err) {
      setError('Սխալ: ' + (err.message || 'Անհայտ սխալ'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
  const labelCls = 'block text-sm font-semibold text-gray-700 mb-1'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="font-bold text-gray-800">
            Խմբագրել — {T.FORM_TITLE} <span className="text-blue-600">#{order.po_number}</span>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <form id="edit-form" onSubmit={handleSave} className="space-y-4">

            <div>
              <label className={labelCls}>{T.DEPT_LABEL} *</label>
              <input value={department} onChange={e => setDepartment(e.target.value)}
                required className={inputCls} placeholder={T.PH_DEPT} />
            </div>

            <div>
              <label className={labelCls}>{T.RESP_LABEL} *</label>
              <input value={responsible} onChange={e => setResponsible(e.target.value)}
                required className={inputCls} placeholder={T.PH_RESP} />
            </div>

            <div>
              <label className={labelCls}>{T.PURPOSE_LABEL} *</label>
              <input value={purpose} onChange={e => setPurpose(e.target.value)}
                required className={inputCls} placeholder={T.PH_PURP} />
            </div>

            <div>
              <label className={labelCls}>{T.NOTES_LABEL}</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                rows={2} className={inputCls + ' resize-none'} placeholder={T.PH_NOTES} />
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500 bg-gray-100 px-3 py-1.5 rounded mb-2">
                {T.SECT_ITEMS}
              </div>
              <ItemsTable items={items} onChange={setItems} showErrors={itemsSubmitted} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-2 text-sm">{error}</div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button type="button" onClick={onCancel}
            className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
            {T.BTN_CANCEL}
          </button>
          <button type="submit" form="edit-form" disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg py-2 text-sm transition">
            {submitting ? T.BTN_LOADING : 'Պահպանել'}
          </button>
        </div>
      </div>
    </div>
  )
}
