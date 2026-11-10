import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "#0f766e",
  "#2563eb",
  "#d97706",
  "#db2777",
  "#7c3aed",
  "#0891b2",
  "#64748b",
];

const MAX_VISIBLE = 6;

const formatCompact = (value) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`;
  }
  return value.toLocaleString("id-ID");
};

const formatPercent = (ratio) => {
  const percent = ratio * 100;
  if (percent > 0 && percent < 1) return "<1%";
  return `${Math.round(percent)}%`;
};

function CategoryBreakdown({ expenses }) {
  const { categoryData, totalAmount } = useMemo(() => {
    const totals = {};
    let sum = 0;
    expenses.forEach((expense) => {
      const category = expense.category || "Tidak Diketahui";
      if (!totals[category]) {
        totals[category] = 0;
      }
      totals[category] += expense.amount;
      sum += expense.amount;
    });

    const sorted = Object.entries(totals)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        percent: sum > 0 ? amount / sum : 0,
      }))
      .sort((a, b) => b.value - a.value);

    let data = sorted;
    if (sorted.length > MAX_VISIBLE + 1) {
      const rest = sorted.slice(MAX_VISIBLE);
      const restValue = rest.reduce((acc, item) => acc + item.value, 0);
      data = [
        ...sorted.slice(0, MAX_VISIBLE),
        {
          name: `Lainnya (${rest.length})`,
          value: restValue,
          percent: sum > 0 ? restValue / sum : 0,
        },
      ];
    }

    return { categoryData: data, totalAmount: sum };
  }, [expenses]);

  if (categoryData.length === 0) {
    return (
      <p className="text-sm text-center text-slate-500">
        Belum ada data kategori
      </p>
    );
  }

  return (
    <div className="cat-grid">
      <div className="cat-donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={categoryData.length > 1 ? 2 : 0}
              stroke="none"
            >
              {categoryData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "none",
                fontSize: 13,
              }}
              formatter={(value, name) => [
                `Rp ${value.toLocaleString("id-ID")}`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="cat-donut__center">
          <span className="cat-donut__label">Total</span>
          <span className="cat-donut__value mono">
            Rp {formatCompact(totalAmount)}
          </span>
        </div>
      </div>

      <ul className="cat-list">
        {categoryData.map((item, index) => (
          <li key={item.name} className="cat-list__row">
            <span
              className="cat-list__dot"
              style={{ background: COLORS[index % COLORS.length] }}
            />
            <span className="cat-list__name" title={item.name}>
              {item.name}
            </span>
            <span className="cat-list__percent">{formatPercent(item.percent)}</span>
            <span className="cat-list__amount mono">
              Rp {item.value.toLocaleString("id-ID")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CategoryBreakdown;
