import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

interface LoginFormValues {
  phone: string;
  password: string;
}

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        phone: values.phone,
        password: values.password,
      });

      if (response.data.success && response.data.token && response.data.user) {
        const { token, user } = response.data;

        // Check if user is admin
        if (user.role !== 'admin') {
          message.error('Access Denied. Admin access required.');
          // Clear any partial auth data
          localStorage.removeItem('token');
          localStorage.removeItem('user_role');
          setLoading(false);
          return;
        }

        // Set auth state
        setAuth(token, user);
        message.success('Login successful!');
        navigate('/dashboard');
      } else {
        message.error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'An error occurred during login';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        title={
          <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>
            Admin Panel
          </div>
        }
      >
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: 'Please input your phone number!' },
              {
                pattern: /^\+998[0-9]{9}$/,
                message: 'Phone must be in format +998XXXXXXXXX',
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Phone Number (+998XXXXXXXXX)"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: '45px', fontSize: '16px' }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
