import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { CardContent, Card } from '@/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';

type CryptoCurrency = 'BTC' | 'USDT' | 'LTC';

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  amount: number;
  onSuccess?: () => void;
}

const CryptoPaymentModal: React.FC<CryptoPaymentModalProps> = ({
  isOpen,
  onClose,
  planName,
  amount,
  onSuccess
}) => {
  const [currency, setCurrency] = useState<CryptoCurrency>('BTC');
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Create a payment request
  const { mutate: createPayment, isPending, isError, error } = useMutation({
    mutationFn: async (data: { planName: string; amount: number; currency: CryptoCurrency }) => {
      const res = await apiRequest('POST', '/api/crypto-payments/request', data);
      return res.json();
    },
    onSuccess: (data) => {
      setPaymentId(data.paymentId);
    },
    onError: (error: Error) => {
      toast({
        title: "Payment request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Define payment status type
  interface PaymentStatus {
    verified: boolean;
  }

  // Check payment status
  const { data: paymentStatus, refetch } = useQuery<PaymentStatus>({
    queryKey: ['/api/crypto-payments/status', paymentId],
    queryFn: async () => {
      if (!paymentId) return { verified: false };
      const res = await apiRequest('GET', `/api/crypto-payments/status/${paymentId}`);
      return res.json();
    },
    enabled: !!paymentId,
    refetchInterval: (data) => !data?.verified ? 10000 : false, // Poll every 10 seconds until verified
  });

  // Handle currency selection
  const handleCurrencySelect = (selected: CryptoCurrency) => {
    setCurrency(selected);
    // Reset payment state if currency changes
    setPaymentId(null);
  };

  // Handle copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "The wallet address has been copied to your clipboard",
      });
    });
  };

  // Start payment process
  const startPayment = () => {
    createPayment({ planName, amount, currency });
  };

  // Check if payment is verified
  React.useEffect(() => {
    if (paymentStatus?.verified) {
      toast({
        title: "Payment verified!",
        description: "Your payment has been confirmed and your subscription is now active.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      if (onSuccess) onSuccess();
      onClose();
    }
  }, [paymentStatus, toast, onClose, onSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Cryptocurrency Payment</DialogTitle>
          <DialogDescription>
            Pay with cryptocurrency to activate your {planName} plan
          </DialogDescription>
        </DialogHeader>

        {!paymentId ? (
          // Step 1: Select cryptocurrency
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Amount: <span className="font-semibold">${amount.toFixed(2)} USD</span>
            </p>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="currency">Select cryptocurrency:</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={currency === 'BTC' ? 'default' : 'outline'}
                  onClick={() => handleCurrencySelect('BTC')}
                  className="flex-1"
                >
                  Bitcoin (BTC)
                </Button>
                <Button
                  variant={currency === 'USDT' ? 'default' : 'outline'}
                  onClick={() => handleCurrencySelect('USDT')}
                  className="flex-1"
                >
                  Tether (USDT)
                </Button>
                <Button
                  variant={currency === 'LTC' ? 'default' : 'outline'}
                  onClick={() => handleCurrencySelect('LTC')}
                  className="flex-1"
                >
                  Litecoin (LTC)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You're about to pay approximately:
              </p>
              <div className="text-lg font-semibold">
                {currency === 'BTC' && `≈ ${(amount / 70000).toFixed(6)} BTC`}
                {currency === 'USDT' && `≈ ${amount.toFixed(2)} USDT`}
                {currency === 'LTC' && `≈ ${(amount / 85).toFixed(4)} LTC`}
              </div>
              <p className="text-xs text-muted-foreground">
                The exact amount will be calculated when you proceed.
              </p>
            </div>
          </div>
        ) : (
          // Step 2: Show payment details
          <div className="space-y-6 py-4">
            {paymentStatus?.verified ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-300" />
                </div>
                <p className="text-center text-lg font-medium">Payment confirmed!</p>
                <p className="text-center text-sm text-muted-foreground">
                  Your {planName} plan is now active.
                </p>
              </div>
            ) : (
              <>
                <Card className="overflow-hidden">
                  <CardContent className="p-6 flex items-center justify-center">
                    <QRCodeSVG
                      value={`${currency.toLowerCase()}:${paymentId}`}
                      size={200}
                      includeMargin
                      className="mx-auto"
                    />
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wallet-address">Send exactly:</Label>
                    <div className="font-mono text-sm p-2 bg-muted rounded-md">
                      {currency === 'BTC' && `${(amount / 70000).toFixed(6)} BTC`}
                      {currency === 'USDT' && `${amount.toFixed(2)} USDT`}
                      {currency === 'LTC' && `${(amount / 85).toFixed(4)} LTC`}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wallet-address">Wallet address:</Label>
                    <div className="relative">
                      <Input
                        id="wallet-address"
                        readOnly
                        value={
                          currency === 'BTC'
                            ? 'bc1qmk3rumwu0h30ryz5ezg6d0nalflq6lfpw0y6me'
                            : currency === 'USDT'
                            ? '3CSixKXwNbq3Wccve687QHff7p1x3ihthF'
                            : 'LgmRXe3R2drqrv1PKV7TB7Af4LfK7G71tw'
                        }
                        className="pr-10 font-mono"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() =>
                          copyToClipboard(
                            currency === 'BTC'
                              ? 'bc1qmk3rumwu0h30ryz5ezg6d0nalflq6lfpw0y6me'
                              : currency === 'USDT'
                              ? '3CSixKXwNbq3Wccve687QHff7p1x3ihthF'
                              : 'LgmRXe3R2drqrv1PKV7TB7Af4LfK7G71tw'
                          )
                        }
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Status:</Label>
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Waiting for payment confirmation...</span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>
                      Your subscription will be activated automatically once your payment is
                      confirmed on the blockchain.
                    </p>
                    <p className="mt-2">
                      This usually takes between 10-30 minutes depending on network congestion.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {!paymentId ? (
            <Button onClick={startPayment} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          ) : !paymentStatus?.verified ? (
            <Button variant="outline" onClick={() => refetch()}>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Check Payment Status
            </Button>
          ) : (
            <Button onClick={onClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CryptoPaymentModal;