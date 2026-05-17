import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AnalyticsTooltipProps {
  text: string;
}

export function AnalyticsTooltip({ text }: AnalyticsTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-default shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-center leading-snug">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
