/* ============================================================
   FitHub OS — Charts Utility & Themes
   Reusable Chart.js presets, currency-aware tooltips,
   and dynamic gradient generators.
   ============================================================ */

const Charts = (() => {
  'use strict';

  // SaaS brand color palette
  const COLORS = {
    primary: '#6C5CE7',
    primaryLight: '#A29BFE',
    primaryBg: 'rgba(108, 92, 231, 0.12)',
    success: '#00B894',
    successLight: '#55EFC4',
    warning: '#FDCB6E',
    danger: '#E17055',
    info: '#74B9FF',
    textMuted: '#8b8fa3',
    borderColor: '#e9ecef'
  };

  // Safe check if Chart.js library is loaded
  function isAvailable() {
    return typeof Chart !== 'undefined';
  }

  // Create a 12-Month Revenue Growth Stream Line Chart
  function createRevenueChart(canvasId, labels, dataPoints, currencySymbol) {
    if (!isAvailable()) return null;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(108, 92, 231, 0.35)');
    gradient.addColorStop(1, 'rgba(108, 92, 231, 0.0)');

    const symbol = currencySymbol || (typeof Utils !== 'undefined' ? Utils.getCurrencySymbol() : '₹');

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `Revenue (${symbol})`,
          data: dataPoints,
          borderColor: COLORS.primary,
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: COLORS.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1d23',
            titleFont: { family: 'Inter', size: 12, weight: '600' },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => ` ${symbol} ${Number(context.raw).toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 }, color: COLORS.textMuted }
          },
          y: {
            grid: { color: COLORS.borderColor, strokeDashArray: [3, 3] },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: COLORS.textMuted,
              callback: (val) => `${symbol}${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`
            }
          }
        }
      }
    });
  }

  // Create Donut Chart (Retention, Class breakdown, Lead sources)
  function createDonutChart(canvasId, labels, dataPoints, customColors) {
    if (!isAvailable()) return null;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    const defaultColors = [COLORS.success, COLORS.primary, COLORS.warning, COLORS.danger, COLORS.info];

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataPoints,
          backgroundColor: customColors || defaultColors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Inter', size: 11 },
              boxWidth: 12,
              padding: 12,
              color: '#636e72'
            }
          },
          tooltip: {
            backgroundColor: '#1a1d23',
            cornerRadius: 8,
            padding: 10
          }
        }
      }
    });
  }

  // Create Bar Chart (Peak hours attendance, Equipment costs)
  function createBarChart(canvasId, labels, dataPoints, labelName, color) {
    if (!isAvailable()) return null;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: labelName || 'Count',
          data: dataPoints,
          backgroundColor: color || COLORS.primary,
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1d23',
            cornerRadius: 8,
            padding: 10
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 }, color: COLORS.textMuted }
          },
          y: {
            grid: { color: COLORS.borderColor },
            ticks: { font: { family: 'Inter', size: 11 }, color: COLORS.textMuted, beginAtZero: true }
          }
        }
      }
    });
  }

  return {
    COLORS,
    isAvailable,
    createRevenueChart,
    createDonutChart,
    createBarChart
  };
})();
