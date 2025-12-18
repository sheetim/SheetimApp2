import React from "react";
import { Building2 } from "lucide-react";
import DemoIntegrationCard from "../integrations/DemoIntegrationCard";

const BROKERAGES = [
  { id: 'ibkr', name: 'Interactive Brokers' },
  { id: 'exante', name: 'Exante' },
  { id: 'meitav', name: 'מיטב דש' },
  { id: 'psagot', name: 'פסגות' },
  { id: 'ib_israel', name: 'IB ישראל' },
];

export default function BrokerageSync({ onSyncComplete }) {
  return (
    <DemoIntegrationCard
      icon={Building2}
      title="חיבור אוטומטי לבית השקעות"
      description="סנכרון אוטומטי של תיק ההשקעות שלך"
      features={[
        'סנכרון יומי אוטומטי',
        'עדכון מחירים בזמן אמת',
        'ייבוא היסטוריית עסקאות',
        'תמיכה בכל הברוקרים הגדולים'
      ]}
      estimatedDate="Q1 2025"
      gradient="from-blue-500 to-indigo-600"
      isDemo={true}
    />
  );
}