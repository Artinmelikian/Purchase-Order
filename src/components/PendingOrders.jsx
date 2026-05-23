import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { T } from '../constants'
import OrderPreviewModal from './OrderPreviewModal'

export default function PendingOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const fetchOrders = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (!error) setOrders(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function handleConfirm(orderId) {
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) throw error
    setSelectedOrder(null)
    await fetchOrders()
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
          {T.TAB_PENDING} ({orders.length})
        </h2>
        <button onClick={fetchOrders} className="text-sm text-blue-600 hover:text-blue-800">
          {T.BTN_REFRESH}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">{T.MSG_LOADING}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-gray-400 text-sm">{T.MSG_NO_PENDING}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} onClick={() => setSelectedOrder(order)}
              className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 hover:shadow-sm transition group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-center text-sm font-bold text-orange-600">
                    #{order.po_number}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{order.department}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{order.responsible}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">{formatDate(order.created_at)}</div>
                  <div className="text-xs text-orange-600 font-medium mt-1 group-hover:text-blue-600">
                    {T.CLICK_CONFIRM}
                  </div>
                </div>
              </div>
              {order.purpose && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                  <span className="font-medium">{T.PURPOSE_LABEL}</span> {order.purpose}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <OrderPreviewModal order={selectedOrder} onSuccess={handleConfirm} onCancel={() => setSelectedOrder(null)} />
      )}
    </div>
  )
}
