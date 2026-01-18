import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Upload,
  message,
  Popconfirm,
  Space,
  Image,
  Tag,
  Checkbox,
  Divider,
  Spin,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
} from '../services/productService';
import { getCategories, type Category } from '../services/categoryService';
import {
  getCategoryAttributes,
  type CategoryAttribute,
  getDefaultValue,
} from '../services/categoryAttributeService';

const { TextArea } = Input;

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Dynamic Specs State (Server-Driven UI)
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  const [attributesLoading, setAttributesLoading] = useState(false);
  const [dynamicSpecs, setDynamicSpecs] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts();
      setProducts(response.products || []);
    } catch (error: any) {
      message.error('Failed to fetch products: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories(true);
      setCategories(response.categories || []);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Fetch category attributes when category changes
  const fetchCategoryAttributes = async (categoryId: string) => {
    if (!categoryId) {
      setCategoryAttributes([]);
      setDynamicSpecs({});
      return;
    }

    setAttributesLoading(true);
    try {
      const response = await getCategoryAttributes(categoryId);
      const attrs = response.attributes || [];
      setCategoryAttributes(attrs);

      // Initialize dynamic specs with default values
      const newSpecs: Record<string, any> = {};
      attrs.forEach((attr) => {
        // If editing and product has existing spec value, use it
        if (editingProduct?.specs && editingProduct.specs[attr.key] !== undefined) {
          const value = editingProduct.specs[attr.key];
          if (attr.type === 'switch') {
            newSpecs[attr.key] = value === true || value === 'true';
          } else {
            newSpecs[attr.key] = value;
          }
        } else {
          newSpecs[attr.key] = getDefaultValue(attr.type);
        }
      });
      setDynamicSpecs(newSpecs);
    } catch (error: any) {
      console.error('Failed to fetch category attributes:', error);
      setCategoryAttributes([]);
    } finally {
      setAttributesLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    form.setFieldValue('category_id', categoryId);
    fetchCategoryAttributes(categoryId);
  };

  const handleDynamicSpecChange = (key: string, value: any) => {
    setDynamicSpecs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFileList([]);
    setCategoryAttributes([]);
    setDynamicSpecs({});
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name?.uz || '',
      description: product.description?.uz || '',
      price: product.price,
      discount_price: product.discount_price,
      category_id: product.category_id,
      is_new: product.is_new,
      is_popular: product.is_popular,
    });
    
    // Set existing images
    if (product.images && product.images.length > 0) {
      const existingFiles: UploadFile[] = product.images.map((img, index) => ({
        uid: `-${index}`,
        name: `image-${index}.jpg`,
        status: 'done',
        url: `${import.meta.env.VITE_API_URL}${img}`,
      }));
      setFileList(existingFiles);
    } else {
      setFileList([]);
    }

    // Fetch category attributes if product has a category
    if (product.category_id) {
      await fetchCategoryAttributes(product.category_id);
    } else {
      setCategoryAttributes([]);
      setDynamicSpecs({});
    }

    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error: any) {
      message.error('Failed to delete product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();

      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('price', values.price.toString());
      if (values.discount_price) {
        formData.append('discount_price', values.discount_price.toString());
      }
      if (values.category_id) {
        formData.append('category_id', values.category_id);
      }
      formData.append('is_new', values.is_new ? 'true' : 'false');
      formData.append('is_popular', values.is_popular ? 'true' : 'false');

      // Build specs from dynamic specs
      const specsMap: Record<string, any> = {};
      Object.entries(dynamicSpecs).forEach(([key, value]) => {
        // Only include non-empty values
        if (value !== '' && value !== null && value !== undefined && value !== false) {
          specsMap[key] = value;
        }
      });
      
      if (Object.keys(specsMap).length > 0) {
        formData.append('specs', JSON.stringify(specsMap));
      }

      // Handle image uploads
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });

      // For update, keep existing images if no new ones
      if (editingProduct && fileList.length === 0 && editingProduct.images?.length) {
        formData.append('keep_existing_images', 'true');
      }

      // Note: Admin might need X-Shop-ID header - this may need backend adjustment
      // For now, assuming admin can use seller endpoints with a default shop
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        message.success('Product updated successfully');
      } else {
        await createProduct(formData);
        message.success('Product created successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setFileList([]);
      setCategoryAttributes([]);
      setDynamicSpecs({});
      fetchProducts();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation errors
        return;
      }
      message.error(
        `Failed to ${editingProduct ? 'update' : 'create'} product: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Render dynamic field based on attribute type
  const renderDynamicField = (attr: CategoryAttribute) => {
    const label = attr.label?.uz || attr.key;
    const value = dynamicSpecs[attr.key];
    const isRequired = attr.is_required;

    switch (attr.type) {
      case 'text':
        return (
          <Form.Item
            key={attr.id}
            label={label}
            required={isRequired}
          >
            <Input
              value={value || ''}
              onChange={(e) => handleDynamicSpecChange(attr.key, e.target.value)}
              placeholder={`Enter ${label}`}
            />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item
            key={attr.id}
            label={label}
            required={isRequired}
          >
            <InputNumber
              style={{ width: '100%' }}
              value={value || ''}
              onChange={(val) => handleDynamicSpecChange(attr.key, val)}
              placeholder={`Enter ${label}`}
            />
          </Form.Item>
        );

      case 'dropdown':
        return (
          <Form.Item
            key={attr.id}
            label={label}
            required={isRequired}
          >
            <Select
              value={value || undefined}
              onChange={(val) => handleDynamicSpecChange(attr.key, val)}
              placeholder={`Select ${label}`}
              allowClear
            >
              {attr.options?.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label?.uz || opt.value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'switch':
        return (
          <Form.Item
            key={attr.id}
            label={label}
          >
            <Switch
              checked={value === true}
              onChange={(checked) => handleDynamicSpecChange(attr.key, checked)}
            />
          </Form.Item>
        );

      default:
        return null;
    }
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'images',
      key: 'images',
      width: 100,
      render: (images: string[]) => {
        if (images && images.length > 0) {
          const imageUrl = images[0].startsWith('http')
            ? images[0]
            : `${import.meta.env.VITE_API_URL}${images[0]}`;
          return (
            <Image
              width={60}
              height={60}
              src={imageUrl}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
            />
          );
        }
        return <div style={{ width: 60, height: 60, background: '#f0f0f0', borderRadius: 4 }} />;
      },
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: Product['name']) => {
        if (typeof name === 'string') {
          // Backward compatibility: if name is still a string
          return name;
        }
        return name?.uz || '-';
      },
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number, record: Product) => (
        <div>
          {record.discount_price ? (
            <>
              <div style={{ textDecoration: 'line-through', color: '#999' }}>
                {formatPrice(price)}
              </div>
              <div style={{ color: '#f5222d', fontWeight: 'bold' }}>
                {formatPrice(record.discount_price)}
              </div>
            </>
          ) : (
            formatPrice(price)
          )}
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category_id',
      key: 'category_id',
      render: (categoryId: string) => {
        const category = categories.find((c) => c.id === categoryId);
        if (!category) return '-';
        // Display Uzbek name, fallback to English or first available
        return category.name?.uz || category.name?.en || category.name?.ru || '-';
      },
    },
    {
      title: 'Specs',
      dataIndex: 'specs',
      key: 'specs',
      width: 150,
      render: (specs: Record<string, any>) => {
        if (!specs || Object.keys(specs).length === 0) return '-';
        const entries = Object.entries(specs).slice(0, 2);
        return (
          <div style={{ fontSize: 12 }}>
            {entries.map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {String(value)}
              </div>
            ))}
            {Object.keys(specs).length > 2 && (
              <div style={{ color: '#999' }}>+{Object.keys(specs).length - 2} more</div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Product) => (
        <Space>
          {record.is_new && <Tag color="blue">New</Tag>}
          {record.is_popular && <Tag color="orange">Popular</Tag>}
          {!record.is_active && <Tag color="red">Inactive</Tag>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: Product) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this product?"
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

  // Watch category_id to fetch attributes
  const selectedCategoryId = Form.useWatch('category_id', form);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Products</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Product
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setFileList([]);
          setCategoryAttributes([]);
          setDynamicSpecs({});
        }}
        onOk={handleSubmit}
        width={800}
        okText={editingProduct ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Product Name (Uzbek)"
            rules={[{ required: true, message: 'Please enter product name in Uzbek' }]}
            extra="AI will automatically translate to Russian and English"
          >
            <Input placeholder="Enter product name in Uzbek" />
          </Form.Item>

          <Form.Item name="description" label="Description (Uzbek)" extra="AI will automatically translate to Russian and English">
            <TextArea rows={4} placeholder="Enter product description in Uzbek" />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Please enter price' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter price"
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item name="discount_price" label="Discount Price">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter discount price"
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item name="category_id" label="Category">
            <Select
              placeholder="Select category"
              allowClear
              onChange={handleCategoryChange}
            >
              {categories.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name?.uz || cat.name?.en || cat.name?.ru || 'Unnamed Category'}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Dynamic Specs Section - Server-Driven UI */}
          {categoryAttributes.length > 0 && (
            <>
              <Divider orientation="left">Product Specifications</Divider>
              {attributesLoading ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Spin tip="Loading attributes..." />
                </div>
              ) : (
                <Card size="small" style={{ marginBottom: 16 }}>
                  {categoryAttributes.map((attr) => renderDynamicField(attr))}
                </Card>
              )}
            </>
          )}

          <Form.Item name="is_new" valuePropName="checked" label="Mark as New">
            <Checkbox>New Product</Checkbox>
          </Form.Item>

          <Form.Item name="is_popular" valuePropName="checked" label="Mark as Popular">
            <Checkbox>Popular Product</Checkbox>
          </Form.Item>

          <Form.Item label="Product Images">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false} // Prevent auto upload
              multiple
              maxCount={5}
            >
              {fileList.length < 5 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
