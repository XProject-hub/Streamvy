import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Monthly",
    price: "$5.99",
    period: "month",
    description: "Perfect for casual viewers",
    features: [
      "Access to all premium content",
      "HD and 4K streaming",
      "Watch on any device",
      "Ad-free viewing experience",
      "Priority customer support",
    ],
    isPopular: false,
  },
  {
    name: "Annual",
    price: "$49.99",
    period: "year",
    description: "Best value for dedicated viewers",
    features: [
      "Everything in Monthly plan",
      "Save over 30% vs monthly",
      "Early access to new releases",
      "Exclusive behind-the-scenes content",
      "Download for offline viewing",
    ],
    isPopular: true,
  },
];

export default function PremiumPage() {
  const { appearance } = useTheme();
  const { toast } = useToast();
  
  const handleSubscribe = (planName: string) => {
    toast({
      title: "Success!",
      description: `You've selected the ${planName} plan. Payment integration coming soon.`,
    });
  };

  return (
    <div className="container py-10 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Upgrade Your Streaming Experience</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Enjoy unlimited access to premium content, exclusive events, and an ad-free viewing experience
          with StreamHive Premium.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12 mx-auto max-w-4xl">
        {plans.map((plan) => (
          <Card 
            key={plan.name}
            className={`relative overflow-hidden ${
              plan.isPopular 
                ? 'border-primary shadow-lg' 
                : ''
            }`}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-sm font-medium">
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="flex items-end mt-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">/{plan.period}</span>
              </div>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                style={
                  appearance === 'dark' ? {
                    backgroundColor: '#ff5500',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                  } : {}
                }
                onClick={() => handleSubscribe(plan.name)}
              >
                Subscribe
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 mr-2 text-primary" />
          <h2 className="text-xl font-semibold">Premium Benefits</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium mb-2">Exclusive Content</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get access to premium movies, series, and live events not available to free users.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Ad-Free Experience</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Enjoy uninterrupted streaming with no advertisements or commercial breaks.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">High-Quality Streaming</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Stream in the highest quality available, including 4K and HDR where available.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6 max-w-3xl mx-auto text-left">
          <div>
            <h3 className="font-semibold mb-2">Can I cancel my subscription at any time?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes, you can cancel your subscription at any time. Your premium access will continue until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">How many devices can I use with my premium account?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              You can stream on up to 3 devices simultaneously with a single premium account.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Do you offer a free trial?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              New premium subscribers get a 7-day free trial. You can cancel anytime during the trial period and won't be charged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}