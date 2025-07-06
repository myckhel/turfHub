import { walletApi, type WalletTransaction } from '@/apis/wallet';
import { DownloadOutlined, ExportOutlined, FilterOutlined, HistoryOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Dropdown,
  Empty,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { format } from 'date-fns';
import React, { memo, useCallback, useEffect, useState } from 'react';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface TransactionHistoryProps {
  turfId?: number;
  compact?: boolean;
  showFilters?: boolean;
  initialLimit?: number;
}

interface TransactionFilters {
  type?: string;
  dateRange?: [string, string];
  amountRange?: [number, number];
  status?: string;
  search?: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = memo(({ turfId, compact = false, showFilters = true, initialLimit = 10 }) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: pageSize,
        page: currentPage,
        ...filters,
      };

      let response;
      if (turfId) {
        response = await walletApi.getTurfTransactions(turfId, params);
        setTransactions(response.data.transactions);
        setTotal(response.data.transactions.length);
      } else {
        response = await walletApi.getTransactions(params);
        setTransactions(response.data);
        setTotal(response.data.length);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to fetch transaction history');
    } finally {
      setLoading(false);
    }
  }, [turfId, pageSize, currentPage, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const handleExport = useCallback(async () => {
    try {
      message.loading('Generating export...', 0);

      // Export logic would go here
      // For now, just show success message
      message.destroy();
      message.success('Export feature coming soon!');
    } catch {
      message.destroy();
      message.error('Failed to export transactions');
    }
  }, []);

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'green';
      case 'withdraw':
      case 'withdrawal':
        return 'red';
      case 'payment':
        return 'blue';
      case 'refund':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return '+';
      case 'withdraw':
      case 'withdrawal':
        return '-';
      case 'payment':
        return '→';
      case 'refund':
        return '←';
      default:
        return '•';
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: compact ? 120 : 150,
      render: (date: string) => (
        <div className="text-sm">
          <div>{format(new Date(date), 'MMM dd, yyyy')}</div>
          <div className="text-gray-500">{format(new Date(date), 'HH:mm')}</div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: compact ? 100 : 120,
      render: (type: string) => (
        <Tag color={getTransactionTypeColor(type)} className="font-medium">
          {getTransactionTypeIcon(type)} {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => (
        <Tooltip title={description}>
          <Text className={compact ? 'text-sm' : ''}>{description}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: compact ? 100 : 120,
      align: 'right' as const,
      render: (amount: string, record: WalletTransaction) => (
        <div className={`font-medium ${record.type.toLowerCase() === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>{amount}</div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'confirmed',
      key: 'confirmed',
      width: compact ? 80 : 100,
      render: (confirmed: boolean) => <Tag color={confirmed ? 'green' : 'orange'}>{confirmed ? 'Confirmed' : 'Pending'}</Tag>,
    },
  ];

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'csv',
      label: 'Export as CSV',
      icon: <DownloadOutlined />,
      onClick: handleExport,
    },
    {
      key: 'pdf',
      label: 'Export as PDF',
      icon: <DownloadOutlined />,
      onClick: handleExport,
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <HistoryOutlined className="text-primary" />
          <Title level={compact ? 5 : 4} className="mb-0">
            Transaction History
          </Title>
        </div>
      }
      extra={
        <Space>
          {showFilters && (
            <Button icon={<FilterOutlined />} onClick={() => setShowFiltersPanel(!showFiltersPanel)} type={showFiltersPanel ? 'primary' : 'default'}>
              Filters
            </Button>
          )}
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
            <Button icon={<ExportOutlined />}>Export</Button>
          </Dropdown>
        </Space>
      }
      className={compact ? 'transaction-history-compact' : 'transaction-history'}
    >
      {showFiltersPanel && (
        <Card size="small" className="mb-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Transaction Type"
                allowClear
                value={filters.type}
                onChange={(value) => handleFilterChange({ type: value })}
                className="w-full"
                options={[
                  { label: 'Deposit', value: 'deposit' },
                  { label: 'Withdrawal', value: 'withdraw' },
                  { label: 'Payment', value: 'payment' },
                  { label: 'Refund', value: 'refund' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RangePicker
                placeholder={['Start Date', 'End Date']}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    handleFilterChange({
                      dateRange: [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')],
                    });
                  } else {
                    handleFilterChange({ dateRange: undefined });
                  }
                }}
                className="w-full"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Status"
                allowClear
                value={filters.status}
                onChange={(value) => handleFilterChange({ status: value })}
                className="w-full"
                options={[
                  { label: 'Confirmed', value: 'confirmed' },
                  { label: 'Pending', value: 'pending' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space>
                <Input.Search
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  onSearch={(value) => handleFilterChange({ search: value })}
                  allowClear
                />
                {Object.keys(filters).length > 0 && (
                  <Button onClick={clearFilters} size="small">
                    Clear
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text>Loading transaction history...</Text>
          </div>
        </div>
      ) : error ? (
        <Alert
          message="Error Loading Transactions"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchTransactions}>
              Retry
            </Button>
          }
        />
      ) : transactions.length === 0 ? (
        <Empty description="No transactions found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={transactions}
            rowKey="id"
            pagination={false}
            size={compact ? 'small' : 'middle'}
            scroll={{ x: compact ? 600 : 800 }}
          />

          {total > pageSize && (
            <div className="mt-4 text-center">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size || pageSize);
                }}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} transactions`}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
});

export default TransactionHistory;
