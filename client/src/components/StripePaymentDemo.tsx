import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// This is a demo component that shows what the Stripe payment UI would look like
// Not for production use without actual Stripe integration
export function StripePaymentDemo() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      setShowError(true);
      return;
    }
    
    setShowError(false);
    // In a real implementation, this would call the Stripe elements to collect payment info
    alert(`This would start the Stripe payment process for ${selectedPlan} plan.
This is just a demo - you need to implement Stripe integration first.`);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Stripe Payment Demo</CardTitle>
        <CardDescription>
          This demo shows how Stripe payments would work if configured
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a plan first
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="plan" className="text-base">
                Select Premium Plan
              </Label>
              <RadioGroup 
                defaultValue={selectedPlan || undefined} 
                className="mt-2 grid grid-cols-1 gap-2"
                onValueChange={setSelectedPlan}
              >
                <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily" className="flex-1 cursor-pointer">
                    <div className="font-semibold">24-hour Pass</div>
                    <div className="text-sm text-muted-foreground">€5.00</div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Monthly Plan</div>
                    <div className="text-sm text-muted-foreground">€10.00 per month</div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="annual" id="annual" />
                  <Label htmlFor="annual" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Annual Plan</div>
                    <div className="text-sm text-muted-foreground">€110.00 per year</div>
                    <div className="text-xs text-green-600 font-medium">Save €10</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* This would be replaced with actual Stripe Elements in real implementation */}
            <div className="space-y-2">
              <Label htmlFor="card-demo">Credit Card</Label>
              <div className="h-10 px-3 py-2 rounded-md border border-input flex items-center justify-between bg-muted/50">
                <span className="text-sm text-muted-foreground">Card details would appear here</span>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Actual integration would use Stripe Elements SDK for secure card collection
              </p>
            </div>

            <Button type="submit" className="w-full">
              Continue with Demo Payment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}