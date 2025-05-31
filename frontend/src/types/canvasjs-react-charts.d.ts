declare module '@canvasjs/react-charts' {
  import { Component } from 'react';

  export interface CanvasJSChartOptions {
    animationEnabled?: boolean;
    animationDuration?: number;
    animationEasing?: string;
    theme?: string;
    backgroundColor?: string;
    axisX?: {
      title?: string;
      gridColor?: string;
      labelFontColor?: string;
      titleFontColor?: string;
      lineColor?: string;
    };
    axisY?: {
      title?: string;
      minimum?: number;
      maximum?: number;
      interval?: number;
      gridColor?: string;
      labelFontColor?: string;
      titleFontColor?: string;
      lineColor?: string;
      labelFormatter?: (e: { value: number }) => string;
    };
    toolTip?: {
      backgroundColor?: string;
      borderColor?: string;
      fontColor?: string;
      cornerRadius?: number;
      contentFormatter?: (e: { entries: Array<{ dataPoint: any }> }) => string;
    };
    data?: Array<{
      type: string;
      lineColor?: string;
      lineThickness?: number;
      markerType?: string;
      markerSize?: number | ((e: { dataPoint: any }) => number);
      markerColor?: string | ((e: { dataPoint: any }) => string);
      markerBorderColor?: string;
      markerBorderThickness?: number;
      dataPoints: Array<any>;
    }>;
  }

  export class CanvasJSChart extends Component<{ options: CanvasJSChartOptions }> {}
  export const CanvasJS: any;
} 