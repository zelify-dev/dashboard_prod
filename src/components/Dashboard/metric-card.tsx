type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  className?: string;
};

export function MetricCard({ label, value, helper, className = "" }: MetricCardProps) {
  return (
    <div className={`rounded-2xl border border-stroke bg-white p-5 shadow-sm dark:border-dark-3 dark:bg-dark-2 ${className}`}>
      <p className="text-sm font-medium text-dark-6 dark:text-dark-6">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-dark dark:text-white">{value}</p>
      {helper ? <p className="mt-2 text-xs text-dark-6 dark:text-dark-6">{helper}</p> : null}
    </div>
  );
}

