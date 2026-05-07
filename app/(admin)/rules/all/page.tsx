import type { Metadata } from "next";
import { RulesPanel } from "@/components/rules/RulesPanel";

export const metadata: Metadata = {
  title: "All Rules",
};

export default function AllRulesPage() {
  return (
    <div className="overflow-x-auto">
      <RulesPanel mode="all" />
    </div>
  );
}
