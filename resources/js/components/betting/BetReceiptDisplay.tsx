import { CheckCircleOutlined, ClockCircleOutlined, DownloadOutlined, EyeOutlined, FileImageOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Card, Image, Space, Tag, Typography } from 'antd';
import { memo } from 'react';
import type { Bet } from '../../types/betting.types';
import { Button } from '../ui/Button';

const { Text } = Typography;

interface BetReceiptDisplayProps {
  bet: Bet;
  showActions?: boolean;
  onConfirmPayment?: (betId: number) => void;
}

const BetReceiptDisplay = memo(({ bet, showActions = false, onConfirmPayment }: BetReceiptDisplayProps) => {
  if (!bet.has_receipt || !bet.receipt) {
    return null;
  }

  const { receipt } = bet;
  const isPdf = receipt.mime_type?.includes('pdf');
  const isImage = receipt.mime_type?.startsWith('image/');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = receipt.url;
    link.download = receipt.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = () => {
    window.open(receipt.url, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card
      size="small"
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPdf ? <FilePdfOutlined className="text-red-500" /> : <FileImageOutlined className="text-blue-500" />}
            <span>Payment Receipt</span>
          </div>
          {bet.payment_status === 'confirmed' ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Confirmed
            </Tag>
          ) : (
            <Tag color="warning" icon={<ClockCircleOutlined />}>
              Pending
            </Tag>
          )}
        </div>
      }
      className="border-2 border-gray-200 dark:border-gray-700"
    >
      <Space direction="vertical" className="w-full" size="middle">
        {/* Receipt Preview */}
        {isImage && receipt.preview_url ? (
          <div className="flex justify-center">
            <Image
              src={receipt.preview_url}
              alt="Payment receipt"
              className="max-h-64 rounded-lg object-contain"
              preview={{
                src: receipt.url,
                mask: (
                  <div className="flex flex-col items-center gap-2">
                    <EyeOutlined className="text-2xl" />
                    <span>View Full Size</span>
                  </div>
                ),
              }}
            />
          </div>
        ) : isPdf ? (
          <div className="flex flex-col items-center justify-center rounded-lg bg-red-50 py-12 dark:bg-red-900/20">
            <FilePdfOutlined className="mb-4 text-6xl text-red-500" />
            <Text className="text-gray-600 dark:text-gray-400">PDF Receipt</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-500">Click view to open</Text>
          </div>
        ) : null}

        {/* Receipt Info */}
        <div className="space-y-2 rounded-md bg-gray-50 p-3 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <Text className="text-sm text-gray-600 dark:text-gray-400">File Name:</Text>
            <Text strong className="text-sm">
              {receipt.file_name}
            </Text>
          </div>
          <div className="flex items-center justify-between">
            <Text className="text-sm text-gray-600 dark:text-gray-400">Size:</Text>
            <Text className="text-sm">{formatFileSize(receipt.size)}</Text>
          </div>
          <div className="flex items-center justify-between">
            <Text className="text-sm text-gray-600 dark:text-gray-400">Uploaded:</Text>
            <Text className="text-sm">{formatDate(receipt.uploaded_at)}</Text>
          </div>
        </div>

        {/* Actions */}
        <Space className="w-full" direction="vertical" size="small">
          <Space className="w-full">
            <Button variant="primary" size="small" icon={<EyeOutlined />} onClick={handleView} className="flex-1">
              View Receipt
            </Button>
            <Button variant="secondary" size="small" icon={<DownloadOutlined />} onClick={handleDownload} className="flex-1">
              Download
            </Button>
          </Space>

          {/* Manager Confirmation Button */}
          {showActions && bet.payment_status === 'pending' && onConfirmPayment && (
            <Button
              variant="success"
              size="medium"
              fullWidth
              icon={<CheckCircleOutlined />}
              onClick={() => onConfirmPayment(bet.id)}
              className="mt-2"
            >
              Confirm Payment
            </Button>
          )}
        </Space>

        {/* Payment Status Message */}
        {bet.payment_status === 'confirmed' && bet.payment_confirmed_at && (
          <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <CheckCircleOutlined className="text-green-600 dark:text-green-400" />
              <div>
                <Text strong className="block text-green-700 dark:text-green-300">
                  Payment Confirmed
                </Text>
                <Text className="text-xs text-green-600 dark:text-green-400">Verified on {formatDate(bet.payment_confirmed_at)}</Text>
              </div>
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
});

BetReceiptDisplay.displayName = 'BetReceiptDisplay';

export default BetReceiptDisplay;
