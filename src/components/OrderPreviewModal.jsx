import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { T } from '../constants'
import PasswordModal from './PasswordModal'
import EditOrderModal from './EditOrderModal'

export default function OrderPreviewModal({ order, onSuccess, onCancel, readOnly = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    async function fetchItems() {
      const { data } = await supabase
        .from('po_items').select('*').eq('po_id', order.id).order('nn', { ascending: true })
      setItems(data || [])
      setLoading(false)
    }
    fetchItems()
  }, [order.id])

  function formatDate(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleString('hy-AM', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const row = (label, value) => value ? (
    <tr key={label}>
      <td className="py-1.5 pr-4 text-xs font-semibold text-gray-500 whitespace-nowrap align-top w-1/3">{label}</td>
      <td className="py-1.5 text-xs text-gray-800 align-top">{value}</td>
    </tr>
  ) : null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <div className="font-bold text-gray-800">{T.FORM_TITLE} <span className="text-blue-600">#{order.po_number}</span></div>
              <div className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}</div>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

            {/* Main fields */}
            <table className="w-full">
              <tbody>
                {row(T.DEPT_LABEL, order.department)}
                {row(T.RESP_LABEL, order.responsible)}
                {row(T.PURPOSE_LABEL, order.purpose)}
                {order.notes && row(T.NOTES_LABEL, order.notes)}
              </tbody>
            </table>

            {/* Signature */}
            {order.resp_sig_url && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">{T.SIG_LABEL}</div>
                <img src={order.resp_sig_url} alt={T.SIG_LABEL}
                  className="max-h-16 border border-gray-200 rounded p-1 bg-gray-50" />
              </div>
            )}

            {/* Items */}
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">{T.SECT_ITEMS}</div>
              {loading ? (
                <div className="text-xs text-gray-400">{T.MSG_LOADING}</div>
              ) : items.length === 0 ? (
                <div className="text-xs text-gray-400">—</div>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-2 py-1 text-center w-8">{T.TH_NN}</th>
                      <th className="border border-gray-200 px-2 py-1 text-left">{T.TH_CODE}</th>
                      <th className="border border-gray-200 px-2 py-1 text-left">{T.TH_NAME}</th>
                      <th className="border border-gray-200 px-2 py-1 text-center">{T.TH_UNIT}</th>
                      <th className="border border-gray-200 px-2 py-1 text-center">{T.TH_QTY}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-200 px-2 py-1 text-center">{item.nn ?? idx + 1}</td>
                        <td className="border border-gray-200 px-2 py-1">{item.code}</td>
                        <td className="border border-gray-200 px-2 py-1">{item.name}</td>
                        <td className="border border-gray-200 px-2 py-1 text-center">{item.unit}</td>
                        <td className="border border-gray-200 px-2 py-1 text-center">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
            <button onClick={onCancel}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
              {T.BTN_CANCEL}
            </button>
            {!readOnly && (
              <>
                <button onClick={() => setShowEdit(true)}
                  className="flex-1 border border-blue-400 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg py-2 text-sm transition">
                  ✏️ {T.BTN_EDIT}
                </button>
                <button onClick={() => setShowPassword(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg py-2 text-sm transition">
                  {T.BTN_CONFIRM} →
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showPassword && (
        <PasswordModal
          order={order}
          onSuccess={onSuccess}
          onCancel={() => setShowPassword(false)}
        />
      )}

      {showEdit && (
        <EditOrderModal
          order={order}
          onSaved={onCancel}
          onCancel={() => setShowEdit(false)}
        />
      )}
    </>
  )
}
