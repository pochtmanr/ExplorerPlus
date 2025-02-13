'use client';

interface TransportSelectorProps {
  value: string[];
  onChange: (modes: string[]) => void;
}

export default function TransportSelector({ value, onChange }: TransportSelectorProps) {
  const transportModes = [
    { id: 'walking', label: 'Walking' },
    { id: 'transit', label: 'Public Transport' },
    { id: 'bicycling', label: 'Bicycle' },
    { id: 'driving', label: 'Car' },
  ];

  const handleChange = (mode: string) => {
    if (value.includes(mode)) {
      onChange(value.filter((m) => m !== mode));
    } else {
      onChange([...value, mode]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Transport Methods</label>
      <div className="grid grid-cols-2 gap-2">
        {transportModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleChange(mode.id)}
            className={`px-3 py-2 rounded-md text-sm transition-colors ${
              value.includes(mode.id)
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}