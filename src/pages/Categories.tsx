import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Space,
  Image,
  Upload,
  Tag,
  Tabs,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from '../services/categoryService';

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await getCategories(true);
      setCategories(response.categories || []);
    } catch (error: any) {
      message.error('Failed to fetch categories: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setFileList([]);
    setModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name_uz: category.name?.uz || '',
      name_ru: category.name?.ru || '',
      name_en: category.name?.en || '',
      parent_id: category.parent_id,
      is_active: category.is_active !== undefined ? category.is_active : true,
      sort_order: category.sort_order !== undefined ? category.sort_order : 0,
    });
    
    // Set existing image if available
    if (category.icon_url) {
      const imageUrl = category.icon_url.startsWith('http') 
        ? category.icon_url 
        : `${import.meta.env.VITE_API_URL}${category.icon_url}`;
      setFileList([
        {
          uid: '-1',
          name: 'existing-image',
          status: 'done',
          url: imageUrl,
        },
      ]);
    } else {
      setFileList([]);
    }
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      message.success('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      message.error('Failed to delete category: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Combine name fields into object
      const nameObj = {
        uz: values.name_uz || '',
        ru: values.name_ru || '',
        en: values.name_en || '',
      };

      // Validate that at least one name is provided
      if (!nameObj.uz && !nameObj.ru && !nameObj.en) {
        message.error('Please enter category name in at least one language');
        return;
      }

      // Ensure all three languages have values (use uz as fallback if empty)
      if (!nameObj.uz) nameObj.uz = nameObj.en || nameObj.ru || '';
      if (!nameObj.ru) nameObj.ru = nameObj.uz;
      if (!nameObj.en) nameObj.en = nameObj.uz;
      
      // Get the file from fileList (if a new file was selected)
      const file = fileList.length > 0 && fileList[0].originFileObj 
        ? fileList[0].originFileObj 
        : null;

      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: nameObj,
          icon: file,
          is_active: values.is_active,
          sort_order: values.sort_order,
        });
        message.success('Category updated successfully');
      } else {
        await createCategory({
          name: nameObj,
          parent_id: values.parent_id,
          icon: file,
          is_active: values.is_active !== undefined ? values.is_active : true,
          sort_order: values.sort_order !== undefined ? values.sort_order : 0,
        });
        message.success('Category created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchCategories();
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(
        `Failed to ${editingCategory ? 'update' : 'create'} category: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => <span style={{ fontFamily: 'monospace' }}>{id.slice(0, 8)}...</span>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: { uz: string; ru: string; en: string }) => {
        if (!name) return '-';
        // Display all three languages
        return (
          <div>
            <div><strong>UZ:</strong> {name.uz || '-'}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <strong>RU:</strong> {name.ru || '-'} | <strong>EN:</strong> {name.en || '-'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Icon/Image',
      dataIndex: 'icon_url',
      key: 'icon_url',
      width: 100,
      render: (iconUrl: string) => {
        if (iconUrl) {
          const imageUrl = iconUrl.startsWith('http') ? iconUrl : `${import.meta.env.VITE_API_URL}${iconUrl}`;
          return (
            <Image
              width={50}
              height={50}
              src={imageUrl}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
            />
          );
        }
        return <div style={{ width: 50, height: 50, background: '#f0f0f0', borderRadius: 4 }} />;
      },
    },
    {
      title: 'Parent Category',
      dataIndex: 'parent_id',
      key: 'parent_id',
      render: (parentId: string) => {
        if (!parentId) return '-';
        const parent = categories.find((c) => c.id === parentId);
        return parent ? (parent.name?.uz || parent.name?.en || '-') : parentId.slice(0, 8);
      },
    },
    {
      title: 'Product Count',
      dataIndex: 'product_count',
      key: 'product_count',
      render: (count: number) => count || 0,
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '✓ Active' : '✗ Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Sort Order',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 120,
      sorter: (a: Category, b: Category) => (a.sort_order || 0) - (b.sort_order || 0),
      render: (order: number) => order || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: Category) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this category?"
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

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Categories</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Category
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        onOk={handleSubmit}
        okText={editingCategory ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Category Name (Multi-language)"
            required
          >
            <Tabs
              defaultActiveKey="uz"
              items={[
                {
                  key: 'uz',
                  label: '🇺🇿 UZ',
                  children: (
                    <Form.Item
                      name="name_uz"
                      rules={[{ required: true, message: 'Please enter Uzbek name' }]}
                      noStyle
                    >
                      <Input placeholder="Kategoriya nomi (O'zbekcha)" />
                    </Form.Item>
                  ),
                },
                {
                  key: 'ru',
                  label: '🇷🇺 RU',
                  children: (
                    <Form.Item
                      name="name_ru"
                      rules={[{ required: true, message: 'Please enter Russian name' }]}
                      noStyle
                    >
                      <Input placeholder="Название категории (Русский)" />
                    </Form.Item>
                  ),
                },
                {
                  key: 'en',
                  label: '🇬🇧 EN',
                  children: (
                    <Form.Item
                      name="name_en"
                      rules={[{ required: true, message: 'Please enter English name' }]}
                      noStyle
                    >
                      <Input placeholder="Category Name (English)" />
                    </Form.Item>
                  ),
                },
              ]}
            />
          </Form.Item>

          <Form.Item name="parent_id" label="Parent Category">
            <Input placeholder="Enter parent category ID (optional)" />
          </Form.Item>

          <Form.Item label="Category Icon">
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={(file) => {
                // Prevent auto upload
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('You can only upload image files!');
                  return false;
                }
                const isLt2M = file.size / 1024 / 1024 < 2;
                if (!isLt2M) {
                  message.error('Image must be smaller than 2MB!');
                  return false;
                }
                
                // Add to fileList for preview
                const newFile: UploadFile = {
                  uid: file.uid,
                  name: file.name,
                  status: 'done',
                  originFileObj: file,
                  url: URL.createObjectURL(file),
                };
                setFileList([newFile]);
                return false; // Prevent auto upload
              }}
              onRemove={() => {
                setFileList([]);
                return true;
              }}
              accept="image/jpeg,image/jpg,image/png"
              maxCount={1}
            >
              {fileList.length < 1 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Active Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item
            name="sort_order"
            label="Sort Order"
            initialValue={0}
            tooltip="Lower numbers appear first. Default is 0."
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Enter sort order" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
