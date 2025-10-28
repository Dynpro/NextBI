import React from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface TileData {
  id: string;
  type: 'chart' | 'text' | 'kpi';
  title: string;
  content: any;
  chartType?: 'bar' | 'line' | 'pie' | 'donut';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  styling: {
    backgroundColor: string;
    textColor: string;
    chartColors: string[];
  };
}

interface TileProps {
  tile: TileData;
  isEditor: boolean;
  onMenuOpen: (e: React.MouseEvent<HTMLElement>) => void;
}

const TileComponent: React.FC<TileProps> = ({ tile, isEditor, onMenuOpen }) => {
  const renderTileContent = () => {
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: tile.styling.textColor,
          },
        },
        title: {
          display: false,
        },
      },
    };

    if (tile.type === 'chart' && tile.chartType) {
      const chartData = {
        labels: tile.content.labels,
        datasets: tile.content.datasets.map((dataset: any, index: number) => ({
          ...dataset,
          backgroundColor: Array.isArray(dataset.backgroundColor) 
            ? dataset.backgroundColor 
            : tile.styling.chartColors[index % tile.styling.chartColors.length],
          borderColor: Array.isArray(dataset.borderColor) 
            ? dataset.borderColor 
            : tile.styling.chartColors[index % tile.styling.chartColors.length],
        })),
      };

      switch (tile.chartType) {
        case 'bar':
          return <Bar data={chartData} options={options} />;
        case 'line':
          return <Line data={chartData} options={options} />;
        case 'pie':
          return (
            <Pie
              data={{
                ...chartData,
                datasets: chartData.datasets.map((dataset: any) => ({
                  ...dataset,
                  backgroundColor: tile.styling.chartColors,
                })),
              }}
              options={options}
            />
          );
        case 'donut':
          return (
            <Doughnut
              data={{
                ...chartData,
                datasets: chartData.datasets.map((dataset: any) => ({
                  ...dataset,
                  backgroundColor: tile.styling.chartColors,
                })),
              }}
              options={options}
            />
          );
        default:
          return null;
      }
    } else if (tile.type === 'text') {
      return (
        <Typography variant="body1" color={tile.styling.textColor}>
          {tile.content}
        </Typography>
      );
    } else if (tile.type === 'kpi') {
      return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="h3" color={tile.styling.textColor} gutterBottom>
            {tile.content.value}
          </Typography>
          <Typography variant="subtitle2" color={tile.styling.textColor}>
            {tile.content.label}
          </Typography>
        </Box>
      );
    }
    
    return null;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: tile.styling.backgroundColor,
        color: tile.styling.textColor,
        overflow: 'hidden',
      }}
    >
      <Box
        className="tile-drag-handle"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {isEditor && (
          <IconButton size="small" sx={{ cursor: 'grab' }}>
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        )}
        <Typography
          variant="subtitle1"
          component="h3"
          sx={{
            flexGrow: 1,
            ml: isEditor ? 1 : 2,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {tile.title}
        </Typography>
        {isEditor && (
          <IconButton size="small" onClick={onMenuOpen}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          p: 2,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {renderTileContent()}
      </Box>
    </Paper>
  );
};

export default TileComponent;
