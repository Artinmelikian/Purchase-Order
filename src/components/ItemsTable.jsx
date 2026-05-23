import { T } from '../constants'

export default function ItemsTable({ items, onChange, readOnly = false, showErrors = false }) {
  function updateItem(index, field, value) {
    onChange(items.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addRow() {
    onChange([...items, { code: '', name: '', unit: '', quantity: '' }])
  }

  function removeRow(index) {
    if (items.length <= 1) return
    onChange(items.filter((_, i) => i !== index))
  }

  const cellCls = 'border border-gray-400 px-1 py-1'
  const inputCls = 'w-full px-1 py-0.5 outline-none bg-transparent text-sm'
  const reqInputCls = (val) =>
    inputCls + (showErrors && !val?.trim() ? ' border border-red-400 rounded bg-red-50' : '')

  return (
    <div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className={cellCls + ' text-center w-10'}>{T.TH_NN}</th>
            <th className={cellCls + ' text-center w-24'}>{T.TH_CODE}</th>
            <th className={cellCls + ' text-center'}>{T.TH_NAME} <span className="text-red-500">*</span></th>
            <th className={cellCls + ' text-center w-20'}>{T.TH_UNIT} <span className="text-red-500">*</span></th>
            <th className={cellCls + ' text-center w-20'}>{T.TH_QTY} <span className="text-red-500">*</span></th>
            {!readOnly && <th className={cellCls + ' text-center w-10'}></th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className={cellCls + ' text-center text-gray-500 text-xs'}>{index + 1}</td>
              <td className={cellCls}>
                {readOnly
                  ? <span className="px-1 text-sm">{item.code}</span>
                  : <input type="text" value={item.code} onChange={e => updateItem(index, 'code', e.target.value)} className={inputCls} />}
              </td>
              <td className={cellCls}>
                {readOnly
                  ? <span className="px-1 text-sm">{item.name}</span>
                  : <input type="text" value={item.name} onChange={e => updateItem(index, 'name', e.target.value)} className={reqInputCls(item.name)} placeholder={T.PH_ITEM_NAME} />}
              </td>
              <td className={cellCls}>
                {readOnly
                  ? <span className="px-1 text-sm">{item.unit}</span>
                  : <input type="text" value={item.unit} onChange={e => updateItem(index, 'unit', e.target.value)} className={reqInputCls(item.unit)} placeholder={T.PH_UNIT} />}
              </td>
              <td className={cellCls}>
                {readOnly
                  ? <span className="px-1 text-sm">{item.quantity}</span>
                  : <input type="text" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className={reqInputCls(item.quantity)} />}
              </td>
              {!readOnly && (
                <td className={cellCls + ' text-center'}>
                  <button type="button" onClick={() => removeRow(index)}
                    className="text-red-400 hover:text-red-600 font-bold text-lg leading-none">×</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <button type="button" onClick={addRow}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
          <span className="text-lg leading-none">+</span> {T.TH_ADD_ROW}
        </button>
      )}
    </div>
  )
}
