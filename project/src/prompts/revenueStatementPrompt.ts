export const revenueStatementPrompt = `Extract financial data from this revenue statement and return ONLY a JSON object with this structure:
{
  "company": "Company name",
  "period": "Time period",
  "totalRevenue": number,
  "lineItems": [
    {
      "description": "Property name",
      "amount": number
    }
  ]
}
`;
