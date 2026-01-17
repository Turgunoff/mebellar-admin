import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  message,
  Spin,
  Button,
  Switch,
  Modal,
  Descriptions,
  Tabs,
  Card,
  Space,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  sellerService,
  type Seller,
  type SellerDetail,
} from '../services/sellerService';

const Sellers = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerDetail | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterVerified, setFilterVerified] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    fetchSellers();
  }, [pagination.page, filterVerified]);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const response = await sellerService.getSellers({
        page: pagination.page,
        limit: pagination.limit,
        is_verified: filterVerified,
      });
      setSellers(response.sellers || []);
      setPagination((prev) => ({ ...prev, total: response.total || 0 }));
    } catch (error: any) {
      message.error(
        'Failed to fetch sellers: ' +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (sellerId: string) => {
    setDetailLoading(true);
    setDetailModalVisible(true);
    try {
      const response = await sellerService.getSellerDetail(sellerId);
      if (response.seller) {
        setSelectedSeller(response.seller);
      }
    } catch (error: any) {
      message.error(
        'Failed to fetch seller details: ' +
          (error.response?.data?.message || error.message)
      );
      setDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleVerification = async (
    sellerId: string,
    currentStatus: boolean
  ) => {
    try {
      await sellerService.updateSellerStatus(sellerId, !currentStatus);
      message.success(
        `Seller ${!currentStatus ? 'verified' : 'unverified'} successfully`
      );
      fetchSellers();
    } catch (error: any) {
      message.error(
        'Failed to update seller status: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uz-UZ');
  };

  const getAddress = (address?: { uz?: string; ru?: string; en?: string }) => {
    if (!address) return '-';
    return address.uz || address.ru || address.en || '-';
  };

  const columns = [
    {
      title: 'Legal Name',
      dataIndex: 'legal_name',
      key: 'legal_name',
      render: (text: string) => text || '-',
    },
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Tax ID',
      dataIndex: 'tax_id',
      key: 'tax_id',
      render: (text: string) => text || '-',
    },
    {
      title: 'Shops Count',
      dataIndex: 'shops_count',
      key: 'shops_count',
      render: (count: number) => (
        <Tag color="blue">{count} shop{count !== 1 ? 's' : ''}</Tag>
      ),
    },
    {
      title: 'Verified',
      dataIndex: 'is_verified',
      key: 'is_verified',
      render: (isVerified: boolean, record: Seller) => (
        <Switch
          checked={isVerified}
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
          onChange={() => handleToggleVerification(record.id, isVerified)}
        />
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Seller) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record.id)}
        >
          View Details
        </Button>
      ),
    },
  ];

  if (loading && sellers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>Sellers Management</h2>
        <Space>
          <Button
            onClick={() => setFilterVerified(undefined)}
            type={filterVerified === undefined ? 'primary' : 'default'}
          >
            All
          </Button>
          <Button
            onClick={() => setFilterVerified(true)}
            type={filterVerified === true ? 'primary' : 'default'}
          >
            Verified
          </Button>
          <Button
            onClick={() => setFilterVerified(false)}
            type={filterVerified === false ? 'primary' : 'default'}
          >
            Unverified
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={sellers}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} sellers`,
          onChange: (page, pageSize) => {
            setPagination((prev) => ({
              ...prev,
              page,
              limit: pageSize || 10,
            }));
          },
        }}
      />

      <Modal
        title="Seller Details"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedSeller(null);
        }}
        footer={null}
        width={800}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : selectedSeller ? (
          <Tabs
            items={[
              {
                key: 'profile',
                label: 'Profile',
                children: (
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="Full Name">
                      {selectedSeller.user.full_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      {selectedSeller.user.phone}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {selectedSeller.user.email || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Legal Name">
                      {selectedSeller.seller_profile.legal_name || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tax ID">
                      {selectedSeller.seller_profile.tax_id || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bank Account">
                      {selectedSeller.seller_profile.bank_account || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bank Name">
                      {selectedSeller.seller_profile.bank_name || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address">
                      {getAddress(selectedSeller.seller_profile.address)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Support Phone">
                      {selectedSeller.seller_profile.support_phone || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Verified">
                      <Tag
                        color={selectedSeller.seller_profile.is_verified ? 'green' : 'red'}
                      >
                        {selectedSeller.seller_profile.is_verified
                          ? 'Verified'
                          : 'Not Verified'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Rating">
                      {selectedSeller.seller_profile.rating.toFixed(1)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created At">
                      {formatDate(selectedSeller.seller_profile.created_at)}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'shops',
                label: `Shops (${selectedSeller.shops.length})`,
                children: (
                  <div>
                    {selectedSeller.shops.length === 0 ? (
                      <p>No shops found</p>
                    ) : (
                      selectedSeller.shops.map((shop) => (
                        <Card
                          key={shop.id}
                          style={{ marginBottom: 16 }}
                          title={
                            <Space>
                              <span>{shop.name?.uz || shop.name?.en || 'N/A'}</span>
                              {shop.is_main && (
                                <Tag color="gold">Main Shop</Tag>
                              )}
                              {shop.is_verified && (
                                <Tag color="green">Verified</Tag>
                              )}
                              {!shop.is_active && (
                                <Tag color="red">Inactive</Tag>
                              )}
                            </Space>
                          }
                        >
                          <Descriptions column={2} size="small">
                            <Descriptions.Item label="Name (UZ)">
                              {shop.name?.uz || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Name (RU)">
                              {shop.name?.ru || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Name (EN)">
                              {shop.name?.en || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phone">
                              {shop.phone || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Address (UZ)">
                              {shop.address?.uz || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Rating">
                              {shop.rating.toFixed(1)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Created At">
                              {formatDate(shop.created_at)}
                            </Descriptions.Item>
                          </Descriptions>
                        </Card>
                      ))
                    )}
                  </div>
                ),
              },
            ]}
          />
        ) : null}
      </Modal>
    </div>
  );
};

export default Sellers;
