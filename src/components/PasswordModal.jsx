import { useState } from 'react'
import { T } from '../constants'

export default function PasswordModal({ order, onSuccess, onCancel }) {
  const [password, setPassword] = useState('')
  const [shake, setShake] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConfirm(e) {
    e.preventDefault()
    setError('')
    const correct = import.meta.env.VITE_CONFIRM_PASSWORD
    if (password !== correct) {
      setShake(true)
      setError(T.MSG_WRONG_PASS)
      setTimeout(() => setShake(false), 450)
      setPassword('')
      return
    }
    setLoading(true)
    try {
      await onSuccess(order.id)
    } catch (err) {
      setError('Սխալ: ' + (err.message || 'Անհայտ'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 ${shake ? 'shake' : ''}`}>
        <h2 className="text-lg font-bold text-gray-800 mb-1">{T.PWD_TITLE}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {T.FORM_TITLE} <strong>#{order.po_number}</strong> — {order.department}
        </p>
        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{T.PWD_LABEL}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder={T.PWD_PLACEHOLDER || '••••••••'}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded px-3 py-2">{error}</div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
              {T.BTN_CANCEL}
            </button>
            <button type="submit" disabled={loading || !password}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-lg py-2 text-sm transition">
              {loading ? T.BTN_LOADING : T.BTN_CONFIRM}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
