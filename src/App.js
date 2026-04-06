import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import OwnerDashboard from './pages/OwnerDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import './App.css';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loader"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/cart" element={<PrivateRoute role="customer"><Cart /></PrivateRoute>} />
            <Route path="/my-orders" element={<PrivateRoute role="customer"><MyOrders /></PrivateRoute>} />
            <Route path="/owner" element={<PrivateRoute role="owner"><OwnerDashboard /></PrivateRoute>} />
            <Route path="/delivery" element={<PrivateRoute role="delivery"><DeliveryDashboard /></PrivateRoute>} />
          </Routes>
          <ToastContainer position="bottom-right" theme="colored" />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
