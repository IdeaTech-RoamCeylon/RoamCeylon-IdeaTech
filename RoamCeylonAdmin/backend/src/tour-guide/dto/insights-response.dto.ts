export class FunnelStep {
  label: string;
  value: string;
  fillPercent: number;
  icon: string;
  color: string;
  bgColor: string;
  conversionRate: string | null;
}

export class ConversionTrendItem {
  heightPercent: number;
  isActive: boolean;
}

export class TopPackageItem {
  name: string;
  duration: number;
  inquiriesCount: number;
  bookingsCount: number;
  conversionRate: number;
}

export class InsightsResponseDto {
  funnelSteps: FunnelStep[];
  conversionTrend30Days: ConversionTrendItem[];
  conversionTrend90Days: ConversionTrendItem[];
  topPackages: TopPackageItem[];
  globalConversionRate: number;
  globalConversionTrend: string;
  sparklineData: number[];
}
