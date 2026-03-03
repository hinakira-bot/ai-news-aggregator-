'use client';

export default function DatePicker({ currentDate, availableDates, onDateChange }) {
  if (!availableDates || availableDates.length === 0) return null;

  const dates = availableDates.map(d => {
    const dateStr = typeof d.date === 'string' ? d.date : new Date(d.date).toISOString().split('T')[0];
    return { date: dateStr, count: d.count };
  });

  const currentIndex = dates.findIndex(d => d.date === currentDate);
  const hasPrev = currentIndex < dates.length - 1;
  const hasNext = currentIndex > 0;

  function formatDisplayDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => hasPrev && onDateChange(dates[currentIndex + 1].date)}
        disabled={!hasPrev}
        className="px-3 py-1.5 rounded text-sm bg-white border border-gray-300 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        &larr; Prev
      </button>

      <select
        value={currentDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="px-3 py-1.5 rounded text-sm bg-white border border-gray-300 font-medium"
      >
        {dates.map(d => (
          <option key={d.date} value={d.date}>
            {formatDisplayDate(d.date)} ({d.count}件)
          </option>
        ))}
      </select>

      <button
        onClick={() => hasNext && onDateChange(dates[currentIndex - 1].date)}
        disabled={!hasNext}
        className="px-3 py-1.5 rounded text-sm bg-white border border-gray-300 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        Next &rarr;
      </button>
    </div>
  );
}
