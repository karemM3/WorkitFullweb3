import { useState } from 'react';
import { usePayment } from '../../context/PaymentContext';
import { useUser } from '../../context/UserContext';
import {
  CreditCard,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Plus,
  Check,
  AlertCircle,
} from 'lucide-react';

const DepositBox = () => {
  const { user } = useUser();
  const { depositFunds, withdrawFunds, paymentMethods } = usePayment();
  const [amount, setAmount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default payment method when component mounts
  useState(() => {
    const defaultMethod = paymentMethods.find(m => m.isDefault);
    if (defaultMethod) {
      setSelectedPaymentMethodId(defaultMethod.id);
    }
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric values
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      setAmount(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage("Please enter a valid amount");
      return;
    }

    const numericAmount = parseFloat(amount);

    setIsProcessing(true);
    try {
      if (activeTab === 'deposit') {
        await depositFunds(numericAmount, selectedPaymentMethodId || undefined);
        setSuccessMessage(`Successfully deposited ${numericAmount.toFixed(2)} TND to your account`);
      } else {
        if (!user?.wallet || user.wallet.balance < numericAmount) {
          setErrorMessage("Insufficient funds in your wallet");
          setIsProcessing(false);
          return;
        }
        await withdrawFunds(numericAmount);
        setSuccessMessage(`Successfully withdrew ${numericAmount.toFixed(2)} TND from your account`);
      }
      setAmount('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-white">Funds Management</h2>
        <p className="text-gray-400 text-sm mt-1">
          Deposit or withdraw funds from your wallet
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          className={`flex-1 py-3 px-4 text-center ${
            activeTab === 'deposit'
              ? 'text-workit-purple border-b-2 border-workit-purple'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('deposit')}
        >
          <div className="flex items-center justify-center">
            <ArrowDown size={16} className="mr-2" />
            Deposit
          </div>
        </button>
        <button
          className={`flex-1 py-3 px-4 text-center ${
            activeTab === 'withdraw'
              ? 'text-workit-purple border-b-2 border-workit-purple'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('withdraw')}
        >
          <div className="flex items-center justify-center">
            <ArrowUp size={16} className="mr-2" />
            Withdraw
          </div>
        </button>
      </div>

      <div className="p-4">
        {/* Current Balance */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-workit-purple/20 flex items-center justify-center mr-3">
                <DollarSign size={20} className="text-workit-purple" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Current Balance</p>
                <p className="text-white font-semibold text-lg">
                  {user?.wallet?.balance.toFixed(2) || '0.00'} TND
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="bg-green-500/10 text-green-500 p-3 rounded-md mb-4 flex items-start">
            <Check size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-4 flex items-start">
            <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Amount Input */}
          <div className="mb-4">
            <label htmlFor="amount" className="block text-white mb-2">
              {activeTab === 'deposit' ? 'Deposit Amount' : 'Withdrawal Amount'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">TND</span>
              </div>
              <input
                type="text"
                id="amount"
                className="w-full pl-12 p-3 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-workit-purple"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                required
              />
            </div>
          </div>

          {/* Payment Methods (Deposit only) */}
          {activeTab === 'deposit' && (
            <div className="mb-4">
              <label className="block text-white mb-2">Payment Method</label>
              {paymentMethods.length === 0 ? (
                <div className="p-4 border border-dashed border-gray-700 rounded-md text-center">
                  <p className="text-gray-400 mb-2">No payment methods available</p>
                  <button
                    type="button"
                    className="text-workit-purple hover:underline inline-flex items-center"
                    onClick={() => window.location.href = '/dashboard/payments'}
                  >
                    <Plus size={16} className="mr-1" />
                    Add a payment method
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-3 border rounded-md flex items-center cursor-pointer transition ${
                        selectedPaymentMethodId === method.id
                          ? 'border-workit-purple bg-workit-purple/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedPaymentMethodId(method.id)}
                    >
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors duration-200 ease-in-out border-workit-purple">
                        {selectedPaymentMethodId === method.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-workit-purple"></div>
                        )}
                      </div>

                      {method.type === 'credit_card' ? (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                          <CreditCard size={16} className="text-workit-purple" />
                        </div>
                      ) : method.type === 'paypal' ? (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                          <span className="text-blue-400 font-bold text-sm">P</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                          <span className="text-green-500 font-bold text-sm">$</span>
                        </div>
                      )}

                      <div>
                        <p className="text-white text-sm font-medium">{method.name}</p>
                        {method.type === 'credit_card' && method.last4 && (
                          <p className="text-gray-400 text-xs">
                            •••• {method.last4} {method.expiryDate && `(${method.expiryDate})`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isProcessing ||
              !amount ||
              parseFloat(amount) <= 0 ||
              (activeTab === 'deposit' && !selectedPaymentMethodId && paymentMethods.length > 0) ||
              (activeTab === 'deposit' && paymentMethods.length === 0)
            }
            className="w-full bg-workit-purple text-white py-3 rounded-md hover:bg-workit-purple-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing...
              </>
            ) : activeTab === 'deposit' ? (
              <>
                <ArrowDown size={18} className="mr-2" />
                Deposit Funds
              </>
            ) : (
              <>
                <ArrowUp size={18} className="mr-2" />
                Withdraw Funds
              </>
            )}
          </button>
        </form>

        {/* Info Text */}
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-xs">
            {activeTab === 'deposit'
              ? 'Funds will be immediately available in your wallet.'
              : 'Withdrawal will be processed within 1-3 business days.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DepositBox;
