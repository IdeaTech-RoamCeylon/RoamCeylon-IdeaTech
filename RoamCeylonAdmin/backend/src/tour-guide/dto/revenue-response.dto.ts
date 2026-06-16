export class RevenueTrendItem {
  label: string;
  total: number;
}

export class RevenueBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export class HighValueBooking {
  id: string;
  customerName: string;
  tourName: string;
  amount: number;
  status: string;
}

export class RevenueResponseDto {
  totalRevenue: number;
  monthlyTrend: RevenueTrendItem[];
  yearlyTrend: RevenueTrendItem[];
  breakdown: RevenueBreakdownItem[];
  highValueBookings: HighValueBooking[];
}
