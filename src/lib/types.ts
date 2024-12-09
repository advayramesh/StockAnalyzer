export type StockMetadata = {
  Ticker: string;
  Name: string;
  'Business Summary': string;
  City: string;
  State: string;
  Country: string;
  Industry: string;
  Sector: string;
  'Market Cap': number;
  Exchange: string;
  Currency: string;
  '52 Week High': number;
  '52 Week Low': number;
  'P/E Ratio': number;
  EPS: number;
  Revenue: number;
  'Profit Margin': number;
  'Operating Margin': number;
  'Dividend Rate': number;
  'Dividend Yield': number;
  'Payout Ratio': number;
  'Revenue Growth': number;
  'Earnings Growth': number;
  Beta: number;
  'Short Ratio': number;
  'Book Value': number;
  'Price to Book': number;
  'Enterprise Value': number;
  'Enterprise to Revenue': number;
  'Enterprise to EBITDA': number;
}

export type RetrievedContext = {
  content: string;
  similarity_score: number;
  metadata: StockMetadata;
}