export interface RevenueData {
  company: string;
  period: string;
  properties: Array<{
    name: string;
    amount: number;
  }>;
}
