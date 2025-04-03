import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Bitcoin, CreditCard } from "lucide-react";
import CryptoPaymentModal from "@/components/CryptoPaymentModal";
import { StripePaymentDemo } from "@/components/StripePaymentDemo";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Daily",
    price: "€5",
    period: "day",
    description: "Quick access for 24 hours",
  },
  {
    name: "Monthly",
    price: "€10",
    period: "month",
    description: "Perfect for regular viewers",
  },
  {
    name: "Annual",
    price: "€110",
    period: "year",
    description: "Best value for dedicated viewers",
  },
];

export default function PaymentMethodsDemo() {
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'stripe'>('crypto');
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: string} | null>(null);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showError, setShowError] = useState(false);
  const { toast } = useToast();

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as 'crypto' | 'stripe');
  };

  const handleSelectPlan = (planName: string) => {
    const plan = plans.find(p => p.name === planName);
    if (plan) {
      setSelectedPlan({
        name: plan.name,
        price: plan.price
      });
      setShowError(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      setShowError(true);
      return;
    }
    
    if (paymentMethod === 'crypto') {
      setShowCryptoModal(true);
    } else {
      // This would trigger the Stripe payment flow in a real implementation
      toast({
        title: "Stripe Payment Demo",
        description: "In a real implementation, this would open the Stripe payment flow.",
        variant: "default",
      });
    }
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Payment Methods Demo</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          This page demonstrates how both cryptocurrency and Stripe payment methods 
          would work together in StreamHive.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Choose a Payment Method</CardTitle>
          <CardDescription>
            Select how you'd like to pay for your premium subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="crypto" onValueChange={handlePaymentMethodChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="crypto" className="flex items-center gap-2">
                <Bitcoin className="h-4 w-4" />
                Cryptocurrency
              </TabsTrigger>
              <TabsTrigger value="stripe" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credit Card
              </TabsTrigger>
            </TabsList>
            <TabsContent value="crypto" className="py-4">
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="font-medium mb-2">Pay with Cryptocurrency</h3>
                  <p className="text-sm text-muted-foreground">
                    We accept Bitcoin (BTC), Tether (USDT), and Litecoin (LTC). After selecting a plan, 
                    you'll receive wallet addresses to send your payment. Once confirmed on the blockchain, 
                    your account will be automatically upgraded.
                  </p>
                </div>

                {showError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please select a plan first
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="plan" className="text-base mb-3 block">
                    Select Premium Plan
                  </Label>
                  <RadioGroup className="space-y-3">
                    {plans.map((plan) => (
                      <div 
                        key={plan.name}
                        className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent"
                      >
                        <RadioGroupItem 
                          value={plan.name.toLowerCase()} 
                          id={plan.name.toLowerCase()}
                          checked={selectedPlan?.name === plan.name}
                          onClick={() => handleSelectPlan(plan.name)}
                        />
                        <Label 
                          htmlFor={plan.name.toLowerCase()} 
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-semibold">{plan.name} Plan</div>
                          <div className="text-sm text-muted-foreground">
                            {plan.price} per {plan.period}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {plan.description}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Button 
                  onClick={handleSubmit}
                  className="w-full"
                >
                  Continue with Crypto Payment
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="stripe" className="py-4">
              <div className="rounded-lg bg-amber-100 dark:bg-amber-950/30 p-4 mb-4">
                <h3 className="font-medium flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Stripe Integration Demo
                </h3>
                <p className="text-sm">
                  This is a demonstration of how the Stripe payment UI would look.
                  To fully enable Stripe payments, you'll need to add your Stripe API keys.
                </p>
              </div>
              
              <StripePaymentDemo />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Cryptocurrency payment modal */}
      {selectedPlan && (
        <CryptoPaymentModal
          isOpen={showCryptoModal}
          onClose={() => setShowCryptoModal(false)}
          planName={selectedPlan.name}
          amount={parseFloat(selectedPlan.price.replace('€', ''))}
          onSuccess={() => {
            toast({
              title: "Subscription activated",
              description: `Your ${selectedPlan.name} plan is now active.`,
              variant: "default",
            });
          }}
        />
      )}
    </div>
  );
}