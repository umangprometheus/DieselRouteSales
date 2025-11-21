import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, MapPin } from "lucide-react";
import type { CompanyWithDistance } from "@shared/schema";

interface CompanyListProps {
  companies: CompanyWithDistance[];
  selectedIds: string[];
  onToggle: (companyId: string) => void;
  onCompanyClick?: (companyId: string) => void;
  className?: string;
}

export default function CompanyList({
  companies,
  selectedIds,
  onToggle,
  onCompanyClick,
  className = "",
}: CompanyListProps) {
  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <MapPin className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">No companies found</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your radius or location</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {companies.map((company) => {
        const isSelected = selectedIds.includes(company.id);
        
        return (
          <Card
            key={company.id}
            className={`px-3 py-4 sm:px-4 w-full hover-elevate transition-all cursor-pointer select-none ${
              isSelected ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => {
              onToggle(company.id);
            }}
            data-testid={`card-company-${company.id}`}
            style={{
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            } as React.CSSProperties}
          >
            <div className="flex items-start gap-2 sm:gap-3 min-w-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle(company.id)}
                className="mt-1 pointer-events-none"
                data-testid={`checkbox-company-${company.id}`}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                    {/* Lifecycle stage indicator dot */}
                    <div 
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        company.lifecycleStage === 'customer' 
                          ? 'bg-blue-500' 
                          : 'bg-red-500'
                      }`}
                      title={company.lifecycleStage || 'Unknown'}
                    />
                    <h3 className="text-lg font-semibold text-foreground truncate select-none min-w-0" style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}>
                      {company.name}
                    </h3>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="bg-success/10 text-success hover:bg-success/20 shrink text-sm font-medium max-w-[5rem] overflow-hidden"
                    data-testid={`badge-distance-${company.id}`}
                  >
                    {company.distanceMi.toFixed(1)} mi
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1.5 text-base text-muted-foreground select-none" style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}>
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <p className="truncate select-none" style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none', userSelect: 'none' }}>
                    {[company.street, company.city, company.state, company.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
