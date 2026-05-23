import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { T } from '../constants'
import { exportToPDF } from '../utils/pdfExport'
import PODocument from './PODocument'

export default function ConfirmedOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const [pdfOrder, setPdfOrder] = useState(null)
  const [pdfItems, setPdfItems] = useState([])
  const pdfRef = useRef(null)

  const fetchOrders = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .in('status', ['confirmed', 'downloaded'])
      .order('confirmed_at', { ascending: false })
    if (!error) setOrders(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function handleDownload(order) {
    setDownloadingId(order.id)
    try {
      const { data: items } = await supabase
        .from('po_items').select('*').eq('po_id', order.id).order('nn', { ascending: true })
      setPdfOrder(order)
      setPdfItems(items || [])
      await new Promise(r => setTimeout(r, 800))
      await exportToPDF('po-document', `PO-${order.po_number}.pdf`)
      const newCount = (order.download_count || 0) + 1
      await supabase.from('purchase_orders')
        .update({ download_count: newCount, status: 'downloaded' })
        .eq('id', order.id)
      await fetchOrders()
    } catch (err) {
      console.error('PDF export error:', err)
      alert('PDF բեռնելու սխալ: ' + err.message)
    } finally {
      setDownloadingId(null)
      setPdfOrder(null)
      setPdfItems([])
    }
  }

  function formatDate(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleString('hy-AM', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-700">
          {T.TAB_CONFIRMED} ({orders.length})
        </h2>
        <button onClick={fetchOrders} className="text-sm text-blue-600 hover:text-blue-800">
          {T.BTN_REFRESH}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">{T.MSG_LOADING}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-gray-400 text-sm">{T.MSG_NO_CONFIRMED}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center text-sm font-bold text-green-700 shrink-0">
                    #{order.po_number}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 text-sm truncate">{order.department}</div>
                    <div className="text-xs text-gray-500">{order.responsible}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{T.CONFIRMED_ON} {formatDate(order.confirmed_at)}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    order.status === 'downloaded' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {order.status === 'downloaded'
                      ? `${T.STATUS_DOWNLOADED}${order.download_count > 1 ? ` (×${order.download_count})` : ''}`
                      : T.STATUS_CONFIRMED}
                  </span>
                  <button onClick={() => handleDownload(order)} disabled={downloadingId === order.id}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                    {downloadingId === order.id ? <>⏳ {T.BTN_PREPARING}</> : <>⬇ {T.BTN_DOWNLOAD}</>}
                  </button>
                </div>
              </div>
              {order.purpose && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 truncate">
                  <span className="font-medium">{T.PURPOSE_LABEL}</span> {order.purpose}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hidden PDF render area */}
      {pdfOrder && (
        <div ref={pdfRef} style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
          <PODocument order={pdfOrder} items={pdfItems} />
        </div>
      )}
    </div>
  )
}
