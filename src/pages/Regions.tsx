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
  InputNumber,
  Tabs,
  Space,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import {
  regionService,
  type Region,
  type CreateRegionRequest,
  type UpdateRegionRequest,
} from '../services/regionService';

const Regions = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [form] = Form.useForm();
  const [filterIsActive, setFilterIsActive] = useState<boolean | undefined>();

  useEffect(() => {
    fetchRegions();
  }, [filterIsActive]);

  const fetchRegions = async () => {
    setLoading(true);
    try {
      const response = await regionService.getRegions({
        is_active: filterIsActive,
      });
      setRegions(response.regions || []);
    } catch (error: any) {
      message.error(
        'Failed to fetch regions: ' +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRegion(null);
    form.resetFields();
    form.setFieldsValue({
      ordering: regions.length + 1,
      is_active: true,
    });
    setModalVisible(true);
  };

  const handleEdit = (region: Region) => {
    setEditingRegion(region);
    form.setFieldsValue({
      name_uz: region.name_jsonb?.uz || region.name || '',
      name_ru: region.name_jsonb?.ru || '',
      name_en: region.name_jsonb?.en || '',
      code: region.code || '',
      ordering: region.ordering || 0,
      is_active: region.is_active,
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

      if (editingRegion) {
        // Update
        const updateData: UpdateRegionRequest = {
          name,
          code: values.code,
          ordering: values.ordering,
          is_active: values.is_active,
        };
        await regionService.updateRegion(editingRegion.id, updateData);
        message.success('Region updated successfully');
      } else {
        // Create
        const createData: CreateRegionRequest = {
          name,
          code: values.code,
          ordering: values.ordering || 0,
          is_active: values.is_active !== undefined ? values.is_active : true,
        };
        await regionService.createRegion(createData);
        message.success('Region created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      fetchRegions();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation errors
        return;
      }
      message.error(
        `Failed to ${editingRegion ? 'update' : 'create'} region: ` +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleToggleStatus = async (regionId: number) => {
    try {
      await regionService.toggleRegionStatus(regionId);
      message.success('Region status updated successfully');
      fetchRegions();
    } catch (error: any) {
      message.error(
        'Failed to update region status: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDelete = async (regionId: number) => {
    try {
      await regionService.deleteRegion(regionId);
      message.success('Region deleted successfully');
      fetchRegions();
    } catch (error: any) {
      message.error(
        'Failed to delete region: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uz-UZ');
  };

  const getRegionName = (region: Region): string => {
    if (region.name_jsonb?.uz) return region.name_jsonb.uz;
    return region.name || '-';
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Name (UZ)',
      key: 'name',
      render: (_: any, record: Region) => getRegionName(record),
    },
    {
      title: 'Name (RU)',
      key: 'name_ru',
      render: (_: any, record: Region) => record.name_jsonb?.ru || '-',
    },
    {
      title: 'Name (EN)',
      key: 'name_en',
      render: (_: any, record: Region) => record.name_jsonb?.en || '-',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (code: string) => (
        <Tag color="blue">{code || '-'}</Tag>
      ),
    },
    {
      title: 'Ordering',
      dataIndex: 'ordering',
      key: 'ordering',
      width: 80,
      sorter: (a: Region, b: Region) => a.ordering - b.ordering,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean, record: Region) => (
        <Switch
          checked={isActive}
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
          onChange={() => handleToggleStatus(record.id)}
        />
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: Region) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Region"
            description="Are you sure you want to delete this region?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading && regions.length === 0) {
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
        <h2>Regions Management</h2>
        <Space>
          <Button
            onClick={() => setFilterIsActive(undefined)}
            type={filterIsActive === undefined ? 'primary' : 'default'}
          >
            All
          </Button>
          <Button
            onClick={() => setFilterIsActive(true)}
            type={filterIsActive === true ? 'primary' : 'default'}
          >
            Active
          </Button>
          <Button
            onClick={() => setFilterIsActive(false)}
            type={filterIsActive === false ? 'primary' : 'default'}
          >
            Inactive
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Region
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={regions}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingRegion ? 'Edit Region' : 'Add New Region'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        width={600}
        okText={editingRegion ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
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
                      <Input placeholder="e.g., Toshkent sh." />
                    </Form.Item>
                    <Form.Item name="name_ru" label="Name (Russian)">
                      <Input placeholder="e.g., г. Ташкент" />
                    </Form.Item>
                    <Form.Item name="name_en" label="Name (English)">
                      <Input placeholder="e.g., Tashkent City" />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />

          <Form.Item
            name="code"
            label="ISO Code"
            rules={[
              { required: true, message: 'Please enter ISO code' },
              { pattern: /^UZ-[A-Z]{2}$/, message: 'Code must be in format UZ-XX (e.g., UZ-TK)' },
            ]}
          >
            <Input placeholder="e.g., UZ-TK" maxLength={5} style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item
            name="ordering"
            label="Ordering"
            rules={[{ required: true, message: 'Please enter ordering number' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g., 1" />
          </Form.Item>

          <Form.Item name="is_active" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" /> Active
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Regions;
