"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export type SpendSeries = { name: string; data: number[] };

export function SpendByPeriodChart(props: { categories: string[]; series: SpendSeries[] }) {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 320,
      stacked: props.series.length > 1,
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    plotOptions: {
      bar: {
        columnWidth: "55%",
        borderRadius: 6,
      },
    },
    dataLabels: { enabled: false },
    grid: { strokeDashArray: 5 },
    legend: { position: "top" },
    xaxis: {
      categories: props.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val) => {
          if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
          if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
          return String(Math.round(val));
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val) => val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
    },
    colors: ["#3C50E0", "#0ABEF9", "#219653", "#FFA70B"],
  };

  return <Chart options={options} series={props.series} type="bar" height={320} />;
}

