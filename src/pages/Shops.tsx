import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  message,
  Spin,
  Button,
  Switch,
  Modal,
  Form,
  Input,
  Select,
  Tabs,
  Space,
  Image,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import {
  shopService,
  type Shop,
  type CreateShopRequest,
  type UpdateShopRequest,
  type Region,
} from '../services/shopService';
import { sellerService } from '../services/sellerService';

const { TextArea } = Input;

const Shops = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [form] = Form.useForm();
  const [regions, setRegions] = useState<Region[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [filterSellerId, setFilterSellerId] = useState<string | undefined>();
  const [filterRegionId, setFilterRegionId] = useState<string | undefined>();
  const [filterIsActive, setFilterIsActive] = useState<boolean | undefined>();
  const [filterIsVerified, setFilterIsVerified] = useState<boolean | undefined>();

  useEffect(() => {
    fetchShops();
    fetchRegions();
    fetchSellers();
  }, [pagination.page, filterSellerId, filterRegionId, filterIsActive, filterIsVerified]);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const response = await shopService.getShops({
        page: pagination.page,
        limit: pagination.limit,
        seller_id: filterSellerId,
        region_id: filterRegionId,
        is_active: filterIsActive,
        is_verified: filterIsVerified,
      });
      setShops(response.shops || []);
      setPagination((prev) => ({ ...prev, total: response.count || 0 }));
    } catch (error: any) {
      message.error(
        'Failed to fetch shops: ' +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await shopService.getRegions();
      setRegions(response.regions || []);
    } catch (error: any) {
      console.error('Failed to fetch regions:', error);
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await sellerService.getSellers({ limit: 1000 });
      setSellers(response.sellers || []);
    } catch (error: any) {
      console.error('Failed to fetch sellers:', error);
    }
  };

  const handleAdd = () => {
    setEditingShop(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop);
    form.setFieldsValue({
      seller_id: shop.seller_id,
      name_uz: shop.name?.uz || '',
      name_ru: shop.name?.ru || '',
      name_en: shop.name?.en || '',
      description_uz: shop.description?.uz || '',
      description_ru: shop.description?.ru || '',
      description_en: shop.description?.en || '',
      address_uz: shop.address?.uz || '',
      address_ru: shop.address?.ru || '',
      address_en: shop.address?.en || '',
      phone: shop.phone || '',
      region_id: shop.region_id || undefined,
      latitude: shop.latitude,
      longitude: shop.longitude,
      is_main: shop.is_main,
      is_active: shop.is_active,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const name = {
        uz: values.name_uz || '',
        ru: values.name_ru || '',
        en: values.name_en || '',
      };
      
      const description = {
        uz: values.description_uz || '',
        ru: values.description_ru || '',
        en: values.description_en || '',
      };
      
      const address = {
        uz: values.address_uz || '',
        ru: values.address_ru || '',
        en: values.address_en || '',
      };

      if (editingShop) {
        // Update
        const updateData: UpdateShopRequest = {
          name,
          description,
          address,
          phone: values.phone,
          region_id: values.region_id,
          latitude: values.latitude,
          longitude: values.longitude,
          is_main: values.is_main,
          is_active: values.is_active,
        };
        await shopService.updateShop(editingShop.id, updateData);
        message.success('Shop updated successfully');
      } else {
        // Create
        const createData: CreateShopRequest = {
          name,
          description,
          address,
          phone: values.phone,
          region_id: values.region_id,
          latitude: values.latitude,
          longitude: values.longitude,
          is_main: values.is_main,
          is_active: values.is_active !== undefined ? values.is_active : true,
        };
        await shopService.createShop(values.seller_id, createData);
        message.success('Shop created successfully');
      }
      
      setModalVisible(false);
      form.resetFields();
      fetchShops();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation errors
        return;
      }
      message.error(
        `Failed to ${editingShop ? 'update' : 'create'} shop: ` +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleToggleVerification = async (
    shopId: string,
    currentStatus: boolean
  ) => {
    try {
      await shopService.verifyShop(shopId, !currentStatus);
      message.success(
        `Shop ${!currentStatus ? 'verified' : 'unverified'} successfully`
      );
      fetchShops();
    } catch (error: any) {
      message.error(
        'Failed to update shop status: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uz-UZ');
  };

  const columns = [
    {
      title: 'Logo',
      dataIndex: 'logo_url',
      key: 'logo_url',
      width: 80,
      render: (url: string) =>
        url ? (
          <Image src={url} width={50} height={50} style={{ objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            No Logo
          </div>
        ),
    },
    {
      title: 'Name (UZ)',
      key: 'name',
      render: (_: any, record: Shop) => record.name?.uz || '-',
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: any, record: Shop) => {
        const region = regions.find((r) => r.id.toString() === record.region_id);
        return region ? region.name : '-';
      },
    },
    {
      title: 'Contact',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Shop) => (
        <Space direction="vertical" size="small">
          <Tag color={record.is_active ? 'green' : 'red'}>
            {record.is_active ? 'Active' : 'Inactive'}
          </Tag>
          <Tag color={record.is_verified ? 'blue' : 'default'}>
            {record.is_verified ? 'Verified' : 'Not Verified'}
          </Tag>
          {record.is_main && <Tag color="gold">Main</Tag>}
        </Space>
      ),
    },
    {
      title: 'Verified',
      dataIndex: 'is_verified',
      key: 'is_verified',
      render: (isVerified: boolean, record: Shop) => (
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
      render: (_: any, record: Shop) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          Edit
        </Button>
      ),
    },
  ];

  if (loading && shops.length === 0) {
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
        <h2>Shops Management</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Shop
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="Filter by Seller"
            allowClear
            style={{ width: 200 }}
            value={filterSellerId}
            onChange={(value) => setFilterSellerId(value)}
          >
            {sellers.map((seller) => (
              <Select.Option key={seller.id} value={seller.id}>
                {seller.legal_name || seller.full_name}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by Region"
            allowClear
            style={{ width: 200 }}
            value={filterRegionId}
            onChange={(value) => setFilterRegionId(value)}
          >
            {regions.map((region) => (
              <Select.Option key={region.id} value={region.id.toString()}>
                {region.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by Status"
            allowClear
            style={{ width: 150 }}
            value={filterIsActive}
            onChange={(value) => setFilterIsActive(value)}
          >
            <Select.Option value={true}>Active</Select.Option>
            <Select.Option value={false}>Inactive</Select.Option>
          </Select>
          <Select
            placeholder="Filter by Verification"
            allowClear
            style={{ width: 150 }}
            value={filterIsVerified}
            onChange={(value) => setFilterIsVerified(value)}
          >
            <Select.Option value={true}>Verified</Select.Option>
            <Select.Option value={false}>Not Verified</Select.Option>
          </Select>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={shops}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} shops`,
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
        title={editingShop ? 'Edit Shop' : 'Add New Shop'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        width={800}
        okText={editingShop ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
          {!editingShop && (
            <Form.Item
              name="seller_id"
              label="Seller"
              rules={[{ required: true, message: 'Please select a seller' }]}
            >
              <Select placeholder="Select seller">
                {sellers.map((seller) => (
                  <Select.Option key={seller.id} value={seller.id}>
                    {seller.legal_name || seller.full_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Tabs
            defaultActiveKey="name"
            items={[
              {
                key: 'name',
                label: 'Name',
                children: (
                  <>
                    <Form.Item
                      name="name_uz"
                      label="Name (Uzbek)"
                      rules={[{ required: true, message: 'Please enter name in Uzbek' }]}
                    >
                      <Input placeholder="Enter name in Uzbek" />
                    </Form.Item>
                    <Form.Item name="name_ru" label="Name (Russian)">
                      <Input placeholder="Enter name in Russian" />
                    </Form.Item>
                    <Form.Item name="name_en" label="Name (English)">
                      <Input placeholder="Enter name in English" />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'description',
                label: 'Description',
                children: (
                  <>
                    <Form.Item name="description_uz" label="Description (Uzbek)">
                      <TextArea rows={4} placeholder="Enter description in Uzbek" />
                    </Form.Item>
                    <Form.Item name="description_ru" label="Description (Russian)">
                      <TextArea rows={4} placeholder="Enter description in Russian" />
                    </Form.Item>
                    <Form.Item name="description_en" label="Description (English)">
                      <TextArea rows={4} placeholder="Enter description in English" />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'address',
                label: 'Address',
                children: (
                  <>
                    <Form.Item name="address_uz" label="Address (Uzbek)">
                      <TextArea rows={3} placeholder="Enter address in Uzbek" />
                    </Form.Item>
                    <Form.Item name="address_ru" label="Address (Russian)">
                      <TextArea rows={3} placeholder="Enter address in Russian" />
                    </Form.Item>
                    <Form.Item name="address_en" label="Address (English)">
                      <TextArea rows={3} placeholder="Enter address in English" />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />

          <Form.Item name="phone" label="Phone">
            <Input placeholder="+998901234567" />
          </Form.Item>

          <Form.Item name="region_id" label="Region">
            <Select placeholder="Select region" allowClear>
              {regions.map((region) => (
                <Select.Option key={region.id} value={region.id.toString()}>
                  {region.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Space>
            <Form.Item name="latitude" label="Latitude">
              <Input type="number" step="any" placeholder="41.311081" />
            </Form.Item>
            <Form.Item name="longitude" label="Longitude">
              <Input type="number" step="any" placeholder="69.240562" />
            </Form.Item>
          </Space>

          <Form.Item name="is_main" valuePropName="checked">
            <Switch /> Main Shop
          </Form.Item>

          <Form.Item name="is_active" valuePropName="checked" initialValue={true}>
            <Switch /> Active
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Shops;
