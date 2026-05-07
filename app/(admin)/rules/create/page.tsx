import type { Metadata } from "next";
import { RulesPanel } from "@/components/rules/RulesPanel";

export const metadata: Metadata = {
  title: "Create Rule",
};

export default function CreateRulePage() {
  return (
    <div className="overflow-x-auto">
      <RulesPanel mode="create" />
    </div>
  );
}
