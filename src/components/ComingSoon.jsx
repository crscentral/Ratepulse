import React from "react";
import { Sparkles } from "lucide-react";
import { Card, PageHeader } from "./ui";

export default function ComingSoon({ title, subtitle, propertyId, setPropertyId }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} propertyId={propertyId} setPropertyId={setPropertyId} />
      <Card className="p-8 text-center max-w-lg mx-auto">
        <Sparkles size={22} className="mx-auto mb-3 text-gold" />
        <h3 className="text-sm font-semibold text-navy mb-1.5">Activating for this property</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Full tracking for properties you add yourself (rate history, parity checks, recommendations)
          activates once they're connected to a live rate source. In the meantime, switch to Dhavara
          Boutique Hotel or Azure Beach Resort to see this page fully populated.
        </p>
      </Card>
    </div>
  );
}
