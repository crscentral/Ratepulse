import React, { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import { Card, Badge, PageHeader } from "../components/ui";
import { seedRecommendations } from "../lib/seedData";

export default function RecommendationsPage({ propertyId, setPropertyId }) {
  const recs = useMemo(() => seedRecommendations(), [propertyId]);
  return (
    <div>
      <PageHeader title="Recommendations" subtitle="AI-generated pricing guidance based on competitor movement and demand signals" propertyId={propertyId} setPropertyId={setPropertyId} />
      <div className="grid grid-cols-2 gap-4">
        {recs.map((r, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-[#F7EFD9]">
                <Lightbulb size={16} className="text-gold" />
              </div>
              <Badge tone={r.confidence === "High" ? "ok" : "medium"}>{r.confidence} confidence</Badge>
            </div>
            <h3 className="text-sm font-semibold mb-1.5 text-navy">{r.title}</h3>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">{r.rationale}</p>
            <p className="text-xs font-medium text-gold">{r.impact}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
