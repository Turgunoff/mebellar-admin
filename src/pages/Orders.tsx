import { useState, useEffect } from 'react';
import {
  Table,
  Select,
  Tag,
  Modal,
  Descriptions,
  message,
  Button,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import {
  getOrders,
  updateOrderStatus,
  getOrderById,
  type Order,
} from '../services/orderService';

const { Option } = Select;

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await getOrders({
        page: pagination.page,
        limit: pagination.limit,
      });
      setOrders(response.orders || []);
      setPagination((prev) => ({ ...prev, total: response.total }));
    } catch (error: any) {
      message.error('Failed to fetch orders: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      message.success('Order status updated successfully');
      fetchOrders();
    } catch (error: any) {
      message.error('Failed to update order status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleViewDetails = async (order: Order) => {
    try {
      const response = await getOrderById(order.id);
      setSelectedOrder(response.order || order);
      setDetailModalVisible(true);
    } catch (error: any) {
      message.error('Failed to fetch order details');
      setSelectedOrder(order);
      setDetailModalVisible(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'blue';
      case 'confirmed':
        return 'cyan';
      case 'shipping':
        return 'orange';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'default';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uz-UZ');
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => <span style={{ fontFamily: 'monospace' }}>{id.slice(0, 8)}...</span>,
    },
    {
      title: 'Customer Name',
      dataIndex: 'client_name',
      key: 'client_name',
    },
    {
      title: 'Phone',
      dataIndex: 'client_phone',
      key: 'client_phone',
    },
    {
      title: 'Total Price',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => formatPrice(amount),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Order) => (
        <Select
          value={status}
          style={{ width: 120 }}
          onChange={(value) => handleStatusChange(record.id, value)}
        >
          <Option value="new">
            <Tag color="blue">New</Tag>
          </Option>
          <Option value="confirmed">
            <Tag color="cyan">Confirmed</Tag>
          </Option>
          <Option value="shipping">
            <Tag color="orange">Shipping</Tag>
          </Option>
          <Option value="completed">
            <Tag color="green">Completed</Tag>
          </Option>
          <Option value="cancelled">
            <Tag color="red">Cancelled</Tag>
          </Option>
        </Select>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: Order) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>Orders</h2>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          onChange: (page) => setPagination((prev) => ({ ...prev, page })),
        }}
      />

      <Modal
        title="Order Details"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedOrder(null);
        }}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Order ID">{selectedOrder.id}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Customer Name">{selectedOrder.client_name}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedOrder.client_phone}</Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>
                {selectedOrder.client_address || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                {formatPrice(selectedOrder.total_amount)}
              </Descriptions.Item>
              <Descriptions.Item label="Delivery Price">
                {selectedOrder.delivery_price ? formatPrice(selectedOrder.delivery_price) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Created At" span={2}>
                {formatDate(selectedOrder.created_at)}
              </Descriptions.Item>
              {selectedOrder.client_note && (
                <Descriptions.Item label="Customer Note" span={2}>
                  {selectedOrder.client_note}
                </Descriptions.Item>
              )}
              {selectedOrder.seller_note && (
                <Descriptions.Item label="Seller Note" span={2}>
                  {selectedOrder.seller_note}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3>Order Items</h3>
                <Table
                  dataSource={selectedOrder.items}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: 'Product Name',
                      dataIndex: 'product_name',
                      key: 'product_name',
                    },
                    {
                      title: 'Quantity',
                      dataIndex: 'quantity',
                      key: 'quantity',
                    },
                    {
                      title: 'Price',
                      dataIndex: 'price',
                      key: 'price',
                      render: (price: number) => formatPrice(price),
                    },
                    {
                      title: 'Total',
                      key: 'total',
                      render: (_: any, record: any) => formatPrice(record.quantity * record.price),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
