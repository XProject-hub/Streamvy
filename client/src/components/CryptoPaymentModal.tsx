import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CryptoPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: string;
};

type CryptoOption = {
  name: string;
  symbol: string;
  address: string;
  icon: React.ReactNode;
};

export function CryptoPaymentModal({
  isOpen,
  onClose,
  planName,
  planPrice,
}: CryptoPaymentModalProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const cryptoOptions: CryptoOption[] = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      address: "bc1qmk3rumwu0h30ryz5ezg6d0nalflq6lfpw0y6me",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.6408 14.9193L20.1602 19.9396C19.5509 20.7969 18.6402 21.3339 17.6518 21.4262L7.5501 22.5687C6.82178 22.6379 6.10486 22.4522 5.49624 22.0518L5.49612 22.0517C4.82178 21.6088 4.42663 20.8806 4.37505 20.0934L3.59593 10.1597C3.52866 9.16716 3.98531 8.22255 4.7893 7.6056L12.8174 1.50454C14.6662 0.122188 17.2494 0.725922 18.2943 2.71072L21.7752 9.35102C22.5221 10.7408 22.1031 12.4929 21.0458 13.4797L14.6083 19.5168C14.1818 19.9158 13.53 19.9077 13.1232 19.5009C12.7011 19.0787 12.6793 18.4021 13.0737 17.9544L18.3161 12.0864" stroke="#F7931A" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16.8733 8.30664L14.3959 8.30664C13.8436 8.30664 13.3959 8.75436 13.3959 9.30664V11.784C13.3959 12.3363 13.8436 12.784 14.3959 12.784H16.8733C17.4256 12.784 17.8733 12.3363 17.8733 11.784V9.30664C17.8733 8.75436 17.4256 8.30664 16.8733 8.30664Z" stroke="#F7931A" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      name: "USDT (Tether)",
      symbol: "USDT",
      address: "3CSixKXwNbq3Wccve687QHff7p1x3ihthF",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#26A17B" strokeWidth="1.5" strokeMiterlimit="10"/>
          <path d="M12 6V17" stroke="#26A17B" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
          <path d="M17 10H7" stroke="#26A17B" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
          <path d="M16 13H8" stroke="#26A17B" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      name: "Litecoin",
      symbol: "LTC",
      address: "LgmRXe3R2drqrv1PKV7TB7Af4LfK7G71tw",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#345D9D" strokeWidth="1.5" strokeMiterlimit="10"/>
          <path d="M8.5 16.5H14.5" stroke="#345D9D" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
          <path d="M12.5 7.5L9.5 16.5" stroke="#345D9D" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
          <path d="M14 12L16 7.5" stroke="#345D9D" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => {
      setCopiedAddress(null);
    }, 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Pay with Cryptocurrency</DialogTitle>
          <DialogDescription>
            Subscribe to {planName} ({planPrice}) using cryptocurrency
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="BTC" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            {cryptoOptions.map((option) => (
              <TabsTrigger key={option.symbol} value={option.symbol}>
                <div className="flex items-center space-x-2">
                  {option.icon}
                  <span>{option.symbol}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {cryptoOptions.map((option) => (
            <TabsContent
              key={option.symbol}
              value={option.symbol}
              className="mt-4 border rounded-lg p-4"
            >
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{option.name} Address</h3>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(option.address)}
                      className="flex items-center space-x-1"
                    >
                      {copiedAddress === option.address ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span>{copiedAddress === option.address ? "Copied" : "Copy"}</span>
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md font-mono text-sm break-all overflow-x-auto">
                  {option.address}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>1. Copy the address above</p>
                  <p>2. Send exactly the equivalent of {planPrice} in {option.symbol}</p>
                  <p>3. Your account will be upgraded once the transaction is confirmed</p>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            style={{ backgroundColor: '#ff5500', color: '#ffffff' }}
            onClick={() => {
              onClose();
              // Here you would typically confirm payment or redirect to a confirmation page
              alert("Thank you for your payment! Please check your email for confirmation once your transaction is processed.");
            }}
          >
            I've Made The Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}