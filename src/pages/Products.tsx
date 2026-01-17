import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  message,
  Popconfirm,
  Space,
  Image,
  Tag,
  Checkbox,
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

const { TextArea } = Input;

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

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

  const handleAdd = () => {
    setEditingProduct(null);
    setFileList([]);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (product: Product) => {
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
      title: 'Stock',
      key: 'stock',
      render: (_: any, record: Product) => {
        // Assuming stock is calculated from variants or is a separate field
        return record.sold_count !== undefined ? `Sold: ${record.sold_count}` : '-';
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
            <Select placeholder="Select category" allowClear>
              {categories.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name?.uz || cat.name?.en || cat.name?.ru || 'Unnamed Category'}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

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
