import { T } from '../constants'

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

export default function PODocument({ order, items }) {
  const date = order.created_at
    ? new Date(order.created_at).toLocaleDateString('hy-AM', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      })
    : ''

  const s = {
    tdL: {
      border: '1px solid #555', padding: '5px 8px', fontWeight: 'bold',
      verticalAlign: 'top', backgroundColor: '#f5f5f5', whiteSpace: 'nowrap',
      width: '38%',
    },
    tdV: {
      border: '1px solid #555', padding: '5px 8px', verticalAlign: 'top',
    },
  }

  return (
    <div
      id="po-document"
      style={{
        width: '210mm',
        minHeight: '297mm',
        background: 'white',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11px',
        color: '#111',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Header ── */}
      <img
        src="/aregai-header.png"
        alt="AregAI"
        crossOrigin="anonymous"
        style={{ width: '100%', display: 'block' }}
      />

      {/* ── Body ── */}
      <div style={{ padding: '10px 14px 14px 14px' }}>

        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
          <div style={{ flex: 1 }} />
          <div style={{ fontWeight: 'bold', fontSize: '14px', flex: 2, textAlign: 'center' }}>
            {T.FORM_TITLE} {order.po_number}
          </div>
          <div style={{ flex: 1, textAlign: 'right', fontSize: '10.5px' }}>
            {T.DATE_LABEL}: {date}
          </div>
        </div>

        {/* Top form fields */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '7px' }}>
          <tbody>
            <tr>
              <td style={s.tdL}>{T.DEPT_LABEL}</td>
              <td style={s.tdV}>{order.department}</td>
            </tr>
            <tr>
              <td style={s.tdL}>{T.RESP_LABEL}</td>
              <td style={{ ...s.tdV, minHeight: '52px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>{order.responsible}</span>
                  <img src="/director-sig.jpg" alt={T.SIG_LABEL}
                    crossOrigin="anonymous"
                    style={{ maxHeight: '44px', maxWidth: '140px', objectFit: 'contain' }} />
                </div>
              </td>
            </tr>
            <tr>
              <td style={s.tdL}>{T.PURPOSE_LABEL}</td>
              <td style={s.tdV}>{order.purpose}</td>
            </tr>
          </tbody>
        </table>

        {/* Company info */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '7px', fontSize: '10px' }}>
          <tbody>
            {CO_ROWS.map(([label, value]) => (
              <tr key={label}>
                <td style={{ ...s.tdL, fontSize: '10px' }}>{label}</td>
                <td style={{ ...s.tdV, fontSize: '10px' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Notes */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '7px' }}>
          <tbody>
            <tr>
              <td style={s.tdL}>{T.NOTES_LABEL}</td>
              <td style={{ ...s.tdV, minHeight: '22px' }}>{order.notes || ''}</td>
            </tr>
          </tbody>
        </table>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#efefef' }}>
              {[
                [T.TH_NN,   '7%'],
                [T.TH_CODE, '18%'],
                [T.TH_NAME, undefined],
                [T.TH_UNIT, '12%'],
                [T.TH_QTY,  '12%'],
              ].map(([h, w], i) => (
                <th key={i} style={{
                  border: '1px solid #555', padding: '4px 6px',
                  textAlign: 'center', width: w,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(items || []).map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'center' }}>{item.nn ?? idx + 1}</td>
                <td style={{ border: '1px solid #555', padding: '4px 6px' }}>{item.code}</td>
                <td style={{ border: '1px solid #555', padding: '4px 6px' }}>{item.name}</td>
                <td style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'center' }}>{item.unit}</td>
                <td style={{ border: '1px solid #555', padding: '4px 6px', textAlign: 'center' }}>{item.quantity}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 3 - (items || []).length) }).map((_, i) => (
              <tr key={`e${i}`}>
                <td style={{ border: '1px solid #555', height: '22px' }} />
                <td style={{ border: '1px solid #555' }} />
                <td style={{ border: '1px solid #555' }} />
                <td style={{ border: '1px solid #555' }} />
                <td style={{ border: '1px solid #555' }} />
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{
          border: '1px solid #555', padding: '10px 14px',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', minHeight: '72px',
        }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '26px' }}>{T.CONFIRM_HDR}</div>
            <div>{T.SIGNED_BY}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>{T.DIRECTOR_LABEL}</div>
            <div style={{ height: '44px' }} />
            <div>{T.DIRECTOR_NAME}</div>
            <div style={{ marginTop: '4px', width: '130px', borderBottom: '1px solid #333', marginLeft: 'auto' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
