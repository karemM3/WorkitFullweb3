import { useState } from 'react';
import { usePayment } from '../../context/PaymentContext';
import { useUser } from '../../context/UserContext';
import {
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileText,
  PanelRightOpen,
  Ban,
  Download,
  Send,
  AlertCircle,
} from 'lucide-react';

interface EscrowViewerProps {
  escrowId?: string;
  role?: 'buyer' | 'seller';
  showAll?: boolean;
}

const EscrowViewer = ({ escrowId, role, showAll = false }: EscrowViewerProps) => {
  const { user } = useUser();
  const {
    escrowTransactions,
    approveEscrowDelivery,
    rejectEscrowDelivery,
    deliverEscrowService
  } = usePayment();

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedEscrowId, setSelectedEscrowId] = useState<string | null>(escrowId || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [deliveryFiles, setDeliveryFiles] = useState<{ name: string; url: string; type: string; size: number }[]>([]);

  // Filter escrow transactions based on props
  const filteredTransactions = user ? escrowTransactions.filter(tx => {
    if (escrowId) return tx.id === escrowId;
    if (role === 'buyer') return tx.buyerId === user.id;
    if (role === 'seller') return tx.sellerId === user.id;
    if (!showAll) return tx.buyerId === user.id || tx.sellerId === user.id;
    return true;
  }) : [];

  const selectedEscrow = selectedEscrowId
    ? escrowTransactions.find(tx => tx.id === selectedEscrowId)
    : filteredTransactions[0];

  const handleSelectEscrow = (id: string) => {
    setSelectedEscrowId(id);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleApprove = async () => {
    if (!selectedEscrow) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await approveEscrowDelivery(selectedEscrow.id);
      setSuccessMessage('Service delivery approved. Funds have been released to the seller.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEscrow) return;
    if (!rejectionReason.trim()) {
      setErrorMessage('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await rejectEscrowDelivery(selectedEscrow.id, rejectionReason);
      setSuccessMessage('Service delivery has been rejected.');
      setIsRejecting(false);
      setRejectionReason('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeliver = async () => {
    if (!selectedEscrow) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // In a real app, files would be uploaded to a server
      // For demo, we'll use dummy file data
      const demoFiles = [
        {
          name: 'delivery.zip',
          url: '#',
          type: 'application/zip',
          size: 1024 * 1024 * 2, // 2MB
        }
      ];

      await deliverEscrowService(selectedEscrow.id, demoFiles);
      setSuccessMessage('Service has been delivered. The buyer will be notified.');
      setIsDelivering(false);
      setDeliveryMessage('');
      setDeliveryFiles([]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (escrow: typeof selectedEscrow) => {
    if (!escrow) return null;

    switch (escrow.deliveryStatus) {
      case 'pending':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-500">
            <Clock size={14} className="mr-1" />
            Pending Delivery
          </div>
        );
      case 'delivered':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-500">
            <ShieldCheck size={14} className="mr-1" />
            Delivered (Awaiting Approval)
          </div>
        );
      case 'approved':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500">
            <CheckCircle size={14} className="mr-1" />
            Completed
          </div>
        );
      case 'rejected':
        return (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-500">
            <XCircle size={14} className="mr-1" />
            Rejected
          </div>
        );
      default:
        return null;
    }
  };

  if (filteredTransactions.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck size={24} className="text-gray-400" />
          </div>
          <h3 className="text-white font-medium mb-1">No Escrow Transactions</h3>
          <p className="text-gray-400">
            Escrow transactions will appear here when you purchase or sell services using the escrow system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-white">Escrow Transactions</h2>
        <p className="text-gray-400 text-sm mt-1">
          {escrowId ? 'View escrow details' : 'Manage your escrow transactions'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-800">
        {/* Transaction List (only show if not viewing a specific escrow) */}
        {!escrowId && (
          <div className="lg:col-span-1 overflow-auto max-h-[600px]">
            <div className="divide-y divide-gray-800">
              {filteredTransactions.map(transaction => (
                <div
                  key={transaction.id}
                  className={`p-4 cursor-pointer transition hover:bg-gray-800 ${selectedEscrowId === transaction.id ? 'bg-gray-800' : ''}`}
                  onClick={() => handleSelectEscrow(transaction.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium truncate">{transaction.serviceName}</h3>
                    {getStatusBadge(transaction)}
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="text-gray-400">
                      {transaction.buyerId === user?.id ? 'Purchase from' : 'Sale to'}:
                      <span className="text-workit-purple ml-1">
                        {transaction.buyerId === user?.id ? 'Seller' : 'Buyer'}
                      </span>
                    </div>
                    <div className="text-white font-medium">
                      {transaction.amount.toFixed(2)} {transaction.currency}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {formatDate(transaction.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Details */}
        <div className={`${escrowId ? 'lg:col-span-3' : 'lg:col-span-2'} p-4`}>
          {selectedEscrow ? (
            <>
              {/* Alerts */}
              {errorMessage && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-4 flex items-start">
                  <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-500/10 text-green-500 p-3 rounded-md mb-4 flex items-start">
                  <CheckCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                  <p>{successMessage}</p>
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white text-lg font-semibold mb-1">{selectedEscrow.serviceName}</h3>
                  <div className="text-gray-400 text-sm mb-2">
                    Order ID: <span className="text-white">{selectedEscrow.orderId}</span>
                  </div>
                  {getStatusBadge(selectedEscrow)}
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-xl">
                    {selectedEscrow.amount.toFixed(2)} {selectedEscrow.currency}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {formatDate(selectedEscrow.timestamp)}
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h4 className="text-white font-medium mb-3">Transaction Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transaction ID:</span>
                    <span className="text-white">{selectedEscrow.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service ID:</span>
                    <span className="text-white">{selectedEscrow.serviceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white capitalize">{selectedEscrow.deliveryStatus}</span>
                  </div>
                  {selectedEscrow.deliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Delivered On:</span>
                      <span className="text-white">{formatDate(selectedEscrow.deliveryDate)}</span>
                    </div>
                  )}
                  {selectedEscrow.approvalDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Approved On:</span>
                      <span className="text-white">{formatDate(selectedEscrow.approvalDate)}</span>
                    </div>
                  )}
                  {selectedEscrow.rejectionDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rejected On:</span>
                      <span className="text-white">{formatDate(selectedEscrow.rejectionDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Files (if delivered) */}
              {selectedEscrow.deliveryStatus !== 'pending' && selectedEscrow.files && selectedEscrow.files.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <h4 className="text-white font-medium mb-3">Delivery Files</h4>
                  <div className="space-y-2">
                    {selectedEscrow.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded-md">
                        <div className="flex items-center">
                          <FileText size={18} className="text-workit-purple mr-2" />
                          <div>
                            <div className="text-white">{file.name}</div>
                            <div className="text-gray-400 text-xs">
                              {(file.size / 1024).toFixed(0)} KB
                            </div>
                          </div>
                        </div>
                        <a
                          href={file.url}
                          download={file.name}
                          className="text-workit-purple hover:text-workit-purple-light"
                          onClick={(e) => {
                            if (file.url === '#') {
                              e.preventDefault();
                              alert('This is a demo. In a real app, you would download the actual file.');
                            }
                          }}
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Reason (if rejected) */}
              {selectedEscrow.deliveryStatus === 'rejected' && selectedEscrow.rejectionReason && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
                  <h4 className="text-white font-medium mb-1 flex items-center">
                    <Ban size={16} className="text-red-500 mr-2" />
                    Rejection Reason
                  </h4>
                  <p className="text-gray-300">{selectedEscrow.rejectionReason}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4">
                {/* Buyer Actions */}
                {user && selectedEscrow.buyerId === user.id && selectedEscrow.deliveryStatus === 'delivered' && (
                  <div className="space-y-4">
                    {!isRejecting ? (
                      <div className="flex space-x-3">
                        <button
                          onClick={handleApprove}
                          disabled={isProcessing}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <CheckCircle size={18} className="mr-2" />
                              Approve Delivery
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setIsRejecting(true)}
                          disabled={isProcessing}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle size={18} className="mr-2" />
                          Reject Delivery
                        </button>
                      </div>
                    ) : (
                      <div className="border border-red-500/30 rounded-md p-4 bg-red-500/10">
                        <h5 className="text-white font-medium mb-2">Provide Rejection Reason</h5>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-red-500 mb-3"
                          placeholder="Please explain why you're rejecting the delivery..."
                          rows={3}
                        ></textarea>
                        <div className="flex space-x-3">
                          <button
                            onClick={handleReject}
                            disabled={isProcessing || !rejectionReason.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <XCircle size={18} className="mr-2" />
                                Confirm Rejection
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setIsRejecting(false);
                              setRejectionReason('');
                            }}
                            disabled={isProcessing}
                            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Seller Actions */}
                {user && selectedEscrow.sellerId === user.id && selectedEscrow.deliveryStatus === 'pending' && (
                  <div className="space-y-4">
                    {!isDelivering ? (
                      <button
                        onClick={() => setIsDelivering(true)}
                        className="w-full bg-workit-purple hover:bg-workit-purple-light text-white py-2 px-4 rounded-md transition flex items-center justify-center"
                      >
                        <Send size={18} className="mr-2" />
                        Deliver Service
                      </button>
                    ) : (
                      <div className="border border-workit-purple/30 rounded-md p-4 bg-workit-purple/10">
                        <h5 className="text-white font-medium mb-2">Deliver Service</h5>
                        <textarea
                          value={deliveryMessage}
                          onChange={(e) => setDeliveryMessage(e.target.value)}
                          className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-workit-purple mb-3"
                          placeholder="Add a message for the buyer..."
                          rows={3}
                        ></textarea>
                        <div className="p-3 border border-dashed border-gray-600 rounded-md mb-3 text-center">
                          <p className="text-gray-400 mb-1">Upload delivery files (demo)</p>
                          <p className="text-xs text-gray-500">In a real app, you would be able to upload files here</p>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={handleDeliver}
                            disabled={isProcessing}
                            className="bg-workit-purple hover:bg-workit-purple-light text-white py-2 px-4 rounded-md transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <Send size={18} className="mr-2" />
                                Submit Delivery
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setIsDelivering(false);
                              setDeliveryMessage('');
                            }}
                            disabled={isProcessing}
                            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Completed Message */}
                {selectedEscrow.deliveryStatus === 'approved' && (
                  <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 flex items-center">
                    <CheckCircle size={20} className="text-green-500 mr-3" />
                    <div>
                      <h5 className="text-white font-medium">Transaction Completed</h5>
                      <p className="text-gray-300 text-sm">This escrow transaction has been completed successfully.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <PanelRightOpen size={24} className="text-gray-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Select a Transaction</h3>
              <p className="text-gray-400">
                Select a transaction from the list to view its details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EscrowViewer;
