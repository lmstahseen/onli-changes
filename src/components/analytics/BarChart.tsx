import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({ title, labels, datasets, height = 300 }) => {
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 20,
          font: {
            family: "'Geist', system-ui, sans-serif",
            size: 12
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
          family: "'Geist', system-ui, sans-serif"
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        bodyFont: {
          family: "'Geist', system-ui, sans-serif"
        },
        titleFont: {
          family: "'Geist', system-ui, sans-serif",
          weight: 'bold'
        },
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          labelPointStyle: function() {
            return {
              pointStyle: 'rectRounded',
              rotation: 0
            };
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.03)',
          drawBorder: false
        },
        border: {
          display: false
        },
        ticks: {
          padding: 10,
          font: {
            family: "'Geist', system-ui, sans-serif",
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        border: {
          display: false
        },
        ticks: {
          padding: 10,
          font: {
            family: "'Geist', system-ui, sans-serif",
            size: 11
          }
        }
      }
    }
  };

  const data = {
    labels,
    datasets: datasets.map(dataset => ({
      ...dataset,
      borderWidth: dataset.borderWidth || 0,
      borderColor: dataset.borderColor || dataset.backgroundColor,
      borderRadius: 6,
      maxBarThickness: 40
    }))
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Bar options={options} data={data} />
    </div>
  );
};

export default BarChart;