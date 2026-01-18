import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  message,
  Popconfirm,
  Space,
  Image,
  Upload,
  Tag,
  Tabs,
  Card,
  Divider,
  List,
  Typography,
  Tooltip,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SettingOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from '../services/categoryService';
import {
  getCategoryAttributes,
  createCategoryAttribute,
  updateCategoryAttribute,
  deleteCategoryAttribute,
  type CategoryAttribute,
  type AttributeOption,
  type CreateAttributeRequest,
  attributeTypeLabels,
} from '../services/categoryAttributeService';

const { Text } = Typography;

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Attributes Management State
  const [attributesModalVisible, setAttributesModalVisible] = useState(false);
  const [selectedCategoryForAttributes, setSelectedCategoryForAttributes] = useState<Category | null>(null);
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [attributesLoading, setAttributesLoading] = useState(false);
  const [attributeForm] = Form.useForm();
  const [editingAttribute, setEditingAttribute] = useState<CategoryAttribute | null>(null);
  const [attributeFormVisible, setAttributeFormVisible] = useState(false);

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

  // ============================================
  // Attribute Management Functions
  // ============================================

  const handleManageAttributes = async (category: Category) => {
    setSelectedCategoryForAttributes(category);
    setAttributesModalVisible(true);
    await fetchAttributes(category.id);
  };

  const fetchAttributes = async (categoryId: string) => {
    setAttributesLoading(true);
    try {
      const response = await getCategoryAttributes(categoryId);
      setAttributes(response.attributes || []);
    } catch (error: any) {
      message.error('Failed to fetch attributes: ' + (error.response?.data?.message || error.message));
      setAttributes([]);
    } finally {
      setAttributesLoading(false);
    }
  };

  const handleAddAttribute = () => {
    setEditingAttribute(null);
    attributeForm.resetFields();
    attributeForm.setFieldsValue({
      type: 'text',
      is_required: false,
      sort_order: attributes.length,
      options: [],
    });
    setAttributeFormVisible(true);
  };

  const handleEditAttribute = (attr: CategoryAttribute) => {
    setEditingAttribute(attr);
    attributeForm.setFieldsValue({
      key: attr.key,
      type: attr.type,
      label_uz: attr.label?.uz || '',
      label_ru: attr.label?.ru || '',
      label_en: attr.label?.en || '',
      is_required: attr.is_required,
      sort_order: attr.sort_order,
      options: attr.options?.map(opt => ({
        value: opt.value,
        label_uz: opt.label?.uz || '',
        label_ru: opt.label?.ru || '',
        label_en: opt.label?.en || '',
      })) || [],
    });
    setAttributeFormVisible(true);
  };

  const handleDeleteAttribute = async (attrId: string) => {
    try {
      await deleteCategoryAttribute(attrId);
      message.success('Attribute deleted successfully');
      if (selectedCategoryForAttributes) {
        await fetchAttributes(selectedCategoryForAttributes.id);
      }
    } catch (error: any) {
      message.error('Failed to delete attribute: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAttributeSubmit = async () => {
    try {
      const values = await attributeForm.validateFields();
      
      const label = {
        uz: values.label_uz || '',
        ru: values.label_ru || values.label_uz || '',
        en: values.label_en || values.label_uz || '',
      };

      // Build options for dropdown type
      let options: AttributeOption[] | undefined;
      if (values.type === 'dropdown' && values.options?.length > 0) {
        options = values.options.map((opt: any) => ({
          value: opt.value,
          label: {
            uz: opt.label_uz || opt.value,
            ru: opt.label_ru || opt.label_uz || opt.value,
            en: opt.label_en || opt.label_uz || opt.value,
          },
        }));
      }

      if (editingAttribute) {
        // Update existing attribute
        await updateCategoryAttribute(editingAttribute.id, {
          key: values.key,
          type: values.type,
          label,
          options,
          is_required: values.is_required,
          sort_order: values.sort_order,
        });
        message.success('Attribute updated successfully');
      } else {
        // Create new attribute
        if (!selectedCategoryForAttributes) return;
        
        const data: CreateAttributeRequest = {
          key: values.key,
          type: values.type,
          label,
          options,
          is_required: values.is_required || false,
          sort_order: values.sort_order || 0,
        };
        
        await createCategoryAttribute(selectedCategoryForAttributes.id, data);
        message.success('Attribute created successfully');
      }

      setAttributeFormVisible(false);
      attributeForm.resetFields();
      setEditingAttribute(null);
      
      if (selectedCategoryForAttributes) {
        await fetchAttributes(selectedCategoryForAttributes.id);
      }
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(
        `Failed to ${editingAttribute ? 'update' : 'create'} attribute: ${
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
          // If it starts with 'http', use as is; otherwise prepend API base URL
          const imageUrl = iconUrl.startsWith('http') 
            ? iconUrl 
            : `https://api.mebellar-olami.uz${iconUrl}`;
          return (
            <Image
              width={50}
              height={50}
              src={imageUrl}
              style={{ objectFit: 'contain', borderRadius: 4 }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
            />
          );
        }
        // Fallback placeholder when icon_url is empty
        return (
          <div 
            style={{ 
              width: 50, 
              height: 50, 
              background: '#f0f0f0', 
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: '12px'
            }}
          >
            No Icon
          </div>
        );
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
      width: 100,
      sorter: (a: Category, b: Category) => (a.sort_order || 0) - (b.sort_order || 0),
      render: (order: number) => order || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_: any, record: Category) => (
        <Space>
          <Tooltip title="Manage Attributes">
            <Button
              type="link"
              icon={<SettingOutlined />}
              onClick={() => handleManageAttributes(record)}
            >
              Attrs
            </Button>
          </Tooltip>
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

  // Watch for type changes to show/hide options
  const selectedType = Form.useWatch('type', attributeForm);

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

      {/* Category Edit/Create Modal */}
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
                  label: 'UZ',
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
                  label: 'RU',
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
                  label: 'EN',
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

      {/* Attributes Management Modal */}
      <Modal
        title={`Manage Attributes: ${selectedCategoryForAttributes?.name?.uz || 'Category'}`}
        open={attributesModalVisible}
        onCancel={() => {
          setAttributesModalVisible(false);
          setSelectedCategoryForAttributes(null);
          setAttributes([]);
          setAttributeFormVisible(false);
          attributeForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAttribute}>
            Add Attribute
          </Button>
        </div>

        <List
          loading={attributesLoading}
          dataSource={attributes}
          locale={{ emptyText: 'No attributes defined for this category' }}
          renderItem={(attr) => (
            <Card size="small" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>{attr.label?.uz || attr.key}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Key: <code>{attr.key}</code> | Type: <Tag>{attributeTypeLabels[attr.type]}</Tag>
                    {attr.is_required && <Tag color="red">Required</Tag>}
                    <span style={{ marginLeft: 8 }}>Order: {attr.sort_order}</span>
                  </Text>
                  {attr.type === 'dropdown' && attr.options && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Options: {attr.options.map(o => o.label?.uz || o.value).join(', ')}
                      </Text>
                    </div>
                  )}
                </div>
                <Space>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleEditAttribute(attr)}
                  />
                  <Popconfirm
                    title="Delete this attribute?"
                    onConfirm={() => handleDeleteAttribute(attr.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="link" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </div>
            </Card>
          )}
        />

        {/* Attribute Form Modal */}
        <Modal
          title={editingAttribute ? 'Edit Attribute' : 'Add Attribute'}
          open={attributeFormVisible}
          onCancel={() => {
            setAttributeFormVisible(false);
            attributeForm.resetFields();
            setEditingAttribute(null);
          }}
          onOk={handleAttributeSubmit}
          okText={editingAttribute ? 'Update' : 'Create'}
          width={600}
        >
          <Form form={attributeForm} layout="vertical">
            <Form.Item
              name="key"
              label="Key (JSON field name)"
              rules={[
                { required: true, message: 'Please enter a key' },
                { pattern: /^[a-z_][a-z0-9_]*$/, message: 'Key must be lowercase with underscores only' },
              ]}
              tooltip="Used as the JSON key when storing product specs (e.g., 'mechanism', 'material')"
            >
              <Input placeholder="e.g., mechanism, material, color" />
            </Form.Item>

            <Form.Item
              name="type"
              label="Input Type"
              rules={[{ required: true, message: 'Please select a type' }]}
            >
              <Select>
                <Select.Option value="text">Text Input</Select.Option>
                <Select.Option value="number">Number Input</Select.Option>
                <Select.Option value="dropdown">Dropdown Select</Select.Option>
                <Select.Option value="switch">Toggle Switch</Select.Option>
              </Select>
            </Form.Item>

            <Divider orientation="left">Label (Multi-language)</Divider>

            <Form.Item
              name="label_uz"
              label="Label (Uzbek)"
              rules={[{ required: true, message: 'Please enter Uzbek label' }]}
            >
              <Input placeholder="e.g., Mexanizm" />
            </Form.Item>

            <Form.Item name="label_ru" label="Label (Russian)">
              <Input placeholder="e.g., Механизм" />
            </Form.Item>

            <Form.Item name="label_en" label="Label (English)">
              <Input placeholder="e.g., Mechanism" />
            </Form.Item>

            {/* Options for Dropdown type */}
            {selectedType === 'dropdown' && (
              <>
                <Divider orientation="left">Dropdown Options</Divider>
                <Form.List name="options">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Card key={key} size="small" style={{ marginBottom: 8 }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'value']}
                            rules={[{ required: true, message: 'Value required' }]}
                            label="Value (stored)"
                          >
                            <Input placeholder="e.g., delfin" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'label_uz']}
                            rules={[{ required: true, message: 'Label required' }]}
                            label="Label UZ"
                          >
                            <Input placeholder="e.g., Delfin" />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'label_ru']} label="Label RU">
                            <Input placeholder="e.g., Дельфин" />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'label_en']} label="Label EN">
                            <Input placeholder="e.g., Dolphin" />
                          </Form.Item>
                          <Button
                            type="link"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(name)}
                          >
                            Remove Option
                          </Button>
                        </Card>
                      ))}
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Option
                      </Button>
                    </>
                  )}
                </Form.List>
              </>
            )}

            <Divider />

            <Form.Item
              name="is_required"
              label="Required"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch checkedChildren="Required" unCheckedChildren="Optional" />
            </Form.Item>

            <Form.Item
              name="sort_order"
              label="Sort Order"
              initialValue={0}
              tooltip="Lower numbers appear first"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </Modal>
    </div>
  );
};

export default Categories;
