import { CheckCircleOutlined, CloseCircleOutlined, FileImageOutlined, FilePdfOutlined, InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { Alert, App, Image, Upload, type UploadFile, type UploadProps } from 'antd';
import { memo, useEffect, useState } from 'react';
import { bankAccountApi } from '../../apis/bankAccount';
import { useSelectedTurf } from '../../stores/turf.store';
import type { BankAccount } from '../../types/wallet.types';
import BankAccountInfo from './BankAccountInfo';

const { Dragger } = Upload;

interface ReceiptUploadProps {
  value?: File | UploadFile;
  onChange?: (file: File | null) => void;
  disabled?: boolean;
  maxSize?: number; // in MB
  accept?: string;
}

const ReceiptUpload = memo(
  ({ value, onChange, disabled = false, maxSize = 5, accept = 'image/jpeg,image/jpg,image/png,image/webp,application/pdf' }: ReceiptUploadProps) => {
    const { message } = App.useApp();
    const [fileList, setFileList] = useState<UploadFile[]>(value ? [value as UploadFile] : []);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);

    // Get current selected turf ID from the turf store
    const { selectedTurf } = useSelectedTurf();
    const turfId = selectedTurf?.id;

    // Fetch bank accounts when component mounts
    useEffect(() => {
      const fetchBankAccounts = async () => {
        if (!turfId) return;

        setLoadingBankAccounts(true);
        try {
          const accounts = await bankAccountApi.getTurfBankAccounts(turfId);
          setBankAccounts(accounts);
        } catch (error) {
          console.error('Failed to fetch bank accounts:', error);
          message.warning('Could not load bank account information');
          setBankAccounts([]);
        } finally {
          setLoadingBankAccounts(false);
        }
      };

      fetchBankAccounts();
    }, [turfId, message]);

    const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
      // Validate file size
      const isValidSize = file.size / 1024 / 1024 < maxSize;
      if (!isValidSize) {
        alert(`File must be smaller than ${maxSize}MB!`);
        return Upload.LIST_IGNORE;
      }

      // Validate file type
      const acceptedTypes = accept.split(',').map((t) => t.trim());
      const isValidType = acceptedTypes.includes(file.type);
      if (!isValidType) {
        alert('Invalid file type! Please upload an image (JPEG, PNG, WebP) or PDF file.');
        return Upload.LIST_IGNORE;
      }

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }

      // Update file list
      const newFileList: UploadFile[] = [
        {
          uid: file.uid,
          name: file.name,
          status: 'done',
          size: file.size,
          type: file.type,
          originFileObj: file,
        },
      ];
      setFileList(newFileList);

      // Notify parent
      if (onChange) {
        onChange(file);
      }

      // Prevent auto upload
      return false;
    };

    const handleRemove = () => {
      setFileList([]);
      setPreviewUrl(null);
      if (onChange) {
        onChange(null);
      }
    };

    const getFileIcon = (file: UploadFile) => {
      if (file.type?.includes('pdf')) {
        return <FilePdfOutlined className="text-4xl text-red-500" />;
      }
      return <FileImageOutlined className="text-4xl text-blue-500" />;
    };

    return (
      <div className="space-y-4">
        {/* Bank Account Information */}
        {bankAccounts.length > 0 && <BankAccountInfo bankAccounts={bankAccounts} loading={loadingBankAccounts} />}

        {/* Instructions Alert */}
        <Alert
          type="info"
          message={
            <div className="flex items-center gap-2">
              <UploadOutlined />
              <span className="font-semibold">Upload Payment Receipt</span>
            </div>
          }
          description={
            <div className="space-y-2 text-sm">
              <p className="mb-1">After completing your bank transfer:</p>
              <ol className="ml-4 list-decimal space-y-1">
                <li>Take a screenshot or photo of your payment receipt</li>
                <li>Upload it below (JPEG, PNG, WebP or PDF, max {maxSize}MB)</li>
                <li>Your bet will be confirmed once the payment is verified</li>
              </ol>
            </div>
          }
          showIcon
          className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
        />

        {fileList.length === 0 ? (
          <Dragger
            beforeUpload={handleBeforeUpload}
            fileList={fileList}
            disabled={disabled}
            accept={accept}
            maxCount={1}
            showUploadList={false}
            className="!border-2 !border-dashed !border-blue-300 !bg-gradient-to-br !from-blue-50 !to-transparent hover:!border-blue-400 hover:!from-blue-100 dark:!border-blue-700 dark:!from-blue-950/30 dark:hover:!border-blue-600"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined className="animate-bounce text-5xl text-blue-500" />
            </p>
            <p className="ant-upload-text text-base font-semibold text-gray-800 dark:text-gray-200">Click or drag receipt here to upload</p>
            <p className="ant-upload-hint text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Supported:</span> JPEG, PNG, WebP, PDF
              <br />
              <span className="font-medium">Max size:</span> {maxSize}MB
            </p>
          </Dragger>
        ) : (
          <div className="relative overflow-hidden rounded-lg border-2 border-green-300 bg-gradient-to-br from-green-50 to-transparent p-4 shadow-md transition-all dark:border-green-700 dark:from-green-950/30">
            {/* Success Badge */}
            <div className="absolute top-3 -right-8 rotate-45 bg-green-500 px-8 py-1 text-xs font-bold text-white shadow-md">
              <CheckCircleOutlined className="mr-1" />
              Ready
            </div>

            {/* Remove Button */}
            <button
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Remove file"
            >
              <CloseCircleOutlined />
            </button>

            {/* Preview Area */}
            <div className="space-y-4">
              {previewUrl ? (
                <div className="flex justify-center">
                  <div className="relative">
                    <Image
                      src={previewUrl}
                      alt="Receipt preview"
                      className="max-h-48 rounded-lg border-2 border-white object-contain shadow-lg"
                      preview={{ mask: 'Click to preview full size' }}
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
                      Preview
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center rounded-lg bg-white/50 py-6 dark:bg-gray-800/50">{getFileIcon(fileList[0])}</div>
              )}

              {/* File Info */}
              <div className="space-y-2 rounded-lg border border-green-200 bg-white p-3 shadow-sm dark:border-green-800 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className="truncate font-semibold text-gray-800 dark:text-gray-200">{fileList[0].name}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {((fileList[0].size || 0) / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Receipt ready for submission</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

ReceiptUpload.displayName = 'ReceiptUpload';

export default ReceiptUpload;
