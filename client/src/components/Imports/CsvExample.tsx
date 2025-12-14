import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export default function CsvExample() {
  const example1 = `
    "Date","Amount","Description"
    "2025-12-01","1500","Salary payment"
    "2025-12-02","-75.5","Groceries - supermarket"
`.trim();

  const example2 = `
    Date,Amount,Description
    2025-12-01,1500,Salary payment
    2025-12-02,-75.5,Groceries - supermarket
`.trim();

  const CodeBlock = ({ title, code }: { title: string; code: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-gray-700">{title}</h3>
        <div className="relative">
          <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto whitespace-pre">
            {code}
          </pre>

          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-bold">CSV Templates for Import</h2>
      <p >
        You can prepare your CSV file using one of the two supported formats below.
        Both formats are accepted by the import system.
      </p>

      <CardContent className="space-y-6">
        <CodeBlock title="Format 1 — Values wrapped in quotes" code={example1} />
        <CodeBlock title="Format 2 — Values without quotes" code={example2} />
      </CardContent>
    </Card>
  );
}
