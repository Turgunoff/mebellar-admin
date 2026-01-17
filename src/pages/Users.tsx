import { useState, useEffect } from 'react';
import { Table, Tag, message, Spin } from 'antd';
import { getUsers, type User } from '../services/userService';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers({
        page: pagination.page,
        limit: pagination.limit,
      });
      setUsers(response.users || []);
      setPagination((prev) => ({ ...prev, total: response.total || 0 }));
    } catch (error: any) {
      // If endpoint doesn't exist, show message but don't error
      if (error.response?.status === 404) {
        message.warning('Users endpoint not available. Please create /api/admin/users endpoint in backend.');
      } else {
        message.error('Failed to fetch users: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'moderator':
        return 'orange';
      case 'seller':
        return 'blue';
      case 'customer':
        return 'green';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uz-UZ');
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
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || '-',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>{role.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
  ];

  if (loading && users.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>Users</h2>
        {users.length === 0 && !loading && (
          <p style={{ color: '#999' }}>
            No users found. The /api/admin/users endpoint may need to be created in the backend.
          </p>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          onChange: (page) => setPagination((prev) => ({ ...prev, page })),
        }}
      />
    </div>
  );
};

export default Users;
