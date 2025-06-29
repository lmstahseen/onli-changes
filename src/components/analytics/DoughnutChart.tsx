import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface DoughnutChartProps {
  title: string;
  labels: string[];
  data: number[];
  backgroundColor: string[];
  borderColor?: string[];
  height?: number;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ 
  title, 
  labels, 
  data, 
  backgroundColor, 
  borderColor,
  height = 300 
}) => {
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true
      }
    },
    cutout: '70%'
  };

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderColor: borderColor || backgroundColor,
        borderWidth: 1,
        hoverOffset: 5
      },
    ],
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Doughnut options={options} data={chartData} />
    </div>
  );
};

export default DoughnutChart;