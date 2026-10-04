import { processDocumentFile, type ProcessedDocument } from './documentProcessing';

export const SAMPLE_DOCUMENTS_RAW = [
  {
    name: 'financial-quarterly-analysis-q3.txt',
    content: `PATTERNONICS ENTERPRISE SOLUTIONS INC.
FORM 10-Q QUARTERLY FINANCIAL DISCLOSURE
FOR THE QUARTERLY PERIOD ENDED SEPTEMBER 30, 2026

ITEM 1. FINANCIAL STATEMENTS & REVENUE DISCLOSURE
Consolidated revenues for the third quarter expanded 18.4% year-over-year to $482.6 million.
Subscription and recurring cloud services represented $364.1 million, or 75.4% of total revenue.
Operating income reached $112.4 million compared to $89.2 million for the prior year period.
Adjusted EBITDA rose to $138.9 million, reflecting an adjusted EBITDA margin of 28.8%.

Cash and cash equivalents totaled $624.5 million as of September 30, 2026.
Free cash flow generation remained robust at $96.8 million, driven by disciplined working capital management.
Capital expenditures were $15.6 million, primarily allocated to data center server infrastructure and high-throughput network links.

ITEM 2. OPERATIONAL HIGHLIGHTS & RISK FACTORS
The enterprise segment experienced strong contract renewal momentum, securing 42 multi-year enterprise agreements.
Operating expenses increased 12.1% to $370.2 million, primarily attributable to engineering talent acquisition and cloud bandwidth capacity expansion.
Foreign exchange rate fluctuations presented an estimated $8.4 million revenue headwind during the quarter.
Supply chain lead times for specialized routing processors stabilized, reducing network deployment latency across regional ingestion nodes.

LIQUIDITY AND CAPITAL RESOURCES
The Company believes that existing cash balances, anticipated cash flows from operations, and revolving credit facilities will be sufficient to meet working capital and capital expenditure requirements for the foreseeable future.
Management remains committed to disciplined capital allocation, optimizing return on invested capital while funding organic platform development.`,
  },
  {
    name: 'cloud-infrastructure-audit.json',
    content: `{
  "auditReportId": "AUD-2026-Q3-0941",
  "generatedTimestamp": "2026-09-30T18:45:00Z",
  "environment": "production-us-east-cluster",
  "clusterHealth": {
    "status": "HEALTHY",
    "activeNodes": 48,
    "idleNodes": 4,
    "averageCpuUtilization": 42.6,
    "memoryPressurePercentage": 38.2,
    "networkThroughputGbps": 78.4
  },
  "microservices": [
    {
      "serviceName": "ingestion-gateway",
      "instances": 12,
      "protocol": "gRPC",
      "p99LatencyMs": 4.2,
      "errorRate": 0.0001,
      "maxThroughputDocsPerSec": 15000
    },
    {
      "serviceName": "document-tokenizer",
      "instances": 16,
      "protocol": "HTTP/2",
      "p99LatencyMs": 8.7,
      "errorRate": 0.0000,
      "normalizationRules": ["case-fold", "unicode-nfc", "whitespace-collapse"]
    },
    {
      "serviceName": "search-index-coordinator",
      "instances": 8,
      "protocol": "Internal-IPC",
      "p99LatencyMs": 2.1,
      "activeSuffixIndexes": 48,
      "lcpCacheHitRate": 0.94
    },
    {
      "serviceName": "compliance-audit-vault",
      "instances": 6,
      "protocol": "HTTPS-mTLS",
      "encryption": "AES-256-GCM",
      "vulnerabilityScanStatus": "PASSED"
    }
  ],
  "securityIncidents": [],
  "complianceCertification": {
    "standard": "SOC2-Type-II",
    "certifiedBy": "Enterprise Security Assurance Corp",
    "validUntil": "2027-12-31"
  }
}`,
  },
  {
    name: 'supply-chain-dispatch-manifest.csv',
    content: `ShipmentID,OriginHub,DestinationHub,TransportMode,FreightCapacityMT,TransitLatencyHours,PriorityClass,DispatchStatus
SHP-8801,Hub-Atlanta,Hub-Chicago,Freight-Rail,120.5,18.5,Standard,Delivered
SHP-8802,Hub-Dallas,Hub-Denver,Express-Air,45.0,4.2,Urgent,In-Transit
SHP-8803,Hub-Seattle,Hub-SanFrancisco,Electric-Truck,65.2,12.0,Standard,Delivered
SHP-8804,Hub-NewYork,Hub-Boston,Electric-Truck,38.0,5.5,High-Priority,In-Transit
SHP-8805,Hub-Chicago,Hub-Dallas,Freight-Rail,180.0,26.0,Bulk-Economy,Dispatched
SHP-8806,Hub-Miami,Hub-Atlanta,Highway-Truck,52.4,9.8,Standard,Delivered
SHP-8807,Hub-LosAngeles,Hub-Phoenix,Electric-Truck,72.0,6.0,Urgent,In-Transit
SHP-8808,Hub-Denver,Hub-SaltLake,Highway-Truck,48.5,8.2,Standard,Scheduled
SHP-8809,Hub-Boston,Hub-NewYork,Electric-Truck,42.0,5.2,High-Priority,Delivered
SHP-8810,Hub-SanFrancisco,Hub-Seattle,Express-Air,28.5,3.8,Urgent,In-Transit`,
  },
];

export function getSampleDocuments(): ProcessedDocument[] {
  return SAMPLE_DOCUMENTS_RAW.map(doc => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(doc.content).length;
    return processDocumentFile(doc.name, doc.content, bytes);
  });
}
