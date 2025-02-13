'use client';

interface DaySelectorProps {
  value: number;
  onChange: (days: number) => void;
}

export default function DaySelector({ value, onChange }: DaySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Number of Days</label>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full rounded-md border bg-background px-3 py-2"
      >
        {[1, 2, 3, 4, 5].map((days) => (
          <option key={days} value={days}>
            {days} {days === 1 ? 'Day' : 'Days'}
          </option>
        ))}
      </select>
    </div>
  );
}