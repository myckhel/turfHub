import { AppleOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Modal, Typography } from 'antd';
import { memo, useState } from 'react';
import { usePWA } from '../../hooks/usePWA';

const { Title, Paragraph, Text } = Typography;

interface PWAInstallButtonProps {
  type?: 'primary' | 'default' | 'text' | 'link';
  size?: 'small' | 'middle' | 'large';
  block?: boolean;
  className?: string;
}

// Helper to detect iOS
const isIOS = () => {
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  );
};

export const PWAInstallButton = memo<PWAInstallButtonProps>(({ type = 'default', size = 'middle', block = false, className = '' }) => {
  const { canInstall, installApp, isInstalled } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const handleInstallClick = () => {
    if (isIOS()) {
      setShowIOSModal(true);
    } else {
      installApp();
    }
  };

  // Don't show button if app is already installed
  if (isInstalled) {
    return null;
  }

  // Don't show button if not installable
  if (!canInstall) {
    return null;
  }

  return (
    <>
      <Button
        type={type}
        size={size}
        block={block}
        icon={isIOS() ? <AppleOutlined /> : <DownloadOutlined />}
        onClick={handleInstallClick}
        className={className}
      >
        Install App
      </Button>

      {/* iOS Install Instructions Modal */}
      <Modal
        open={showIOSModal}
        onCancel={() => setShowIOSModal(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowIOSModal(false)}>
            Got it
          </Button>,
        ]}
        centered
      >
        <div className="py-4">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <AppleOutlined className="text-3xl text-blue-600" />
            </div>
          </div>

          <Title level={4} className="mb-3 text-center">
            Install TurfMate on iOS
          </Title>

          <Paragraph className="mb-4 text-gray-600">To install TurfMate as an app on your iOS device, follow these steps:</Paragraph>

          <div className="space-y-4 rounded-lg bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">1</div>
              <div className="flex-1">
                <Text strong>Tap the Share button</Text>
                <div className="mt-1 text-sm text-gray-600">
                  Look for the <span className="inline-block text-lg">⎋</span> icon at the bottom of Safari
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">2</div>
              <div className="flex-1">
                <Text strong>Select "Add to Home Screen"</Text>
                <div className="mt-1 text-sm text-gray-600">Scroll down in the share menu to find this option</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">3</div>
              <div className="flex-1">
                <Text strong>Confirm installation</Text>
                <div className="mt-1 text-sm text-gray-600">Tap "Add" in the top right corner</div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-start gap-2">
              <InfoCircleOutlined className="mt-0.5 text-blue-600" />
              <Text className="text-sm text-blue-800">
                Once installed, you'll find TurfMate on your home screen and can launch it like any other app!
              </Text>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
});

PWAInstallButton.displayName = 'PWAInstallButton';

export default PWAInstallButton;
