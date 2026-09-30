import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SuccessChart({ data, valueKey = 'value' }) {
  return <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout="vertical" margin={{ left: 5, right: 24, top: 10, bottom: 10 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
      <XAxis type="number" domain={[0, 100]} tickFormatter={value => `%${value}`} />
      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
      <Tooltip formatter={(value, name, item) => [
        `%${value} (${item.payload.totalMade}/${item.payload.totalAttempted} isabet)`, 'Başarı'
      ]} contentStyle={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }} />
      <Bar dataKey={valueKey} name="Başarı" fill="#00d2ff" radius={[0, 4, 4, 0]} />
    </BarChart>
  </ResponsiveContainer>;
}
