import React, { useState, useEffect } from 'react';
import { addressesAPI } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { ProtectedRoute } from '../components/ProtectedRoute';
import AddressModal from '../components/AddressModal';
import toast from 'react-hot-toast';

interface Address {
  id: string;
  address: string;
  room: string;
  comment?: string;
  created_at: string;
  updated_at: string;
}

const ApartmentsPage: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { hasPermission } = usePermissions();

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressesAPI.getAll();
      setAddresses(response.items || []);
    } catch (error) {
      console.error('Failed to load addresses:', error);
      toast.error('Не удалось загрузить квартиры');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAddresses = () => {
    if (!searchTerm.trim()) {
      return addresses;
    }

    return addresses.filter(addr => 
      addr.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      addr.room.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleAddAddress = () => {
    setSelectedAddress(null);
    setIsAddModalOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setSelectedAddress(address);
    setIsEditModalOpen(true);
  };

  const handleSaveAddress = async (addressData: { address: string; room: string; comment?: string }) => {
    try {
      if (selectedAddress) {
        await addressesAPI.update(selectedAddress.id, addressData);
        toast.success('Квартира обновлена успешно');
      } else {
        await addressesAPI.create(addressData);
        toast.success('Квартира добавлена успешно');
      }
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedAddress(null);
      loadAddresses();
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error('Не удалось сохранить квартиру');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту квартиру?')) {
      return;
    }

    try {
      await addressesAPI.delete(addressId);
      toast.success('Квартира удалена успешно');
      loadAddresses();
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('Не удалось удалить квартиру');
    }
  };

  // Group filtered addresses by address
  const filteredAddresses = getFilteredAddresses();
  const groupedAddresses = filteredAddresses.reduce((acc, addr) => {
    if (!acc[addr.address]) {
      acc[addr.address] = [];
    }
    acc[addr.address].push(addr);
    return acc;
  }, {} as Record<string, Address[]>);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка квартир...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute module="shifts" permission="view">
      <div className="apartments-page">
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">
              <i className="material-icons">home</i>
              Управление квартирами
            </h1>
            <div className="header-stats">
              <span className="stat">
                Всего адресов: <strong>{Object.keys(groupedAddresses).length}</strong>
              </span>
              <span className="stat">
                Всего квартир: <strong>{addresses.length}</strong>
              </span>
            </div>
          </div>
          <div className="header-right">
            {hasPermission('shifts', 'create') && (
              <button 
                className="btn btn-primary"
                onClick={handleAddAddress}
              >
                <i className="material-icons">add</i>
                Добавить квартиру
              </button>
            )}
          </div>
        </div>

        <div className="filters-section">
          <div className="search-container">
            <i className="material-icons">search</i>
            <input
              type="text"
              placeholder="Поиск по адресу или комнате..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="content-section">
          {Object.keys(groupedAddresses).length === 0 ? (
            <div className="empty-state">
              <i className="material-icons">home</i>
              <h3>Нет добавленных квартир</h3>
              <p>Добавьте первую квартиру, чтобы начать работу</p>
              <button 
                className="btn btn-primary"
                onClick={handleAddAddress}
              >
                <i className="material-icons">add</i>
                Добавить квартиру
              </button>
            </div>
          ) : (
            <div className="addresses-grid">
              {Object.entries(groupedAddresses).map(([address, rooms]) => (
                <div key={address} className="address-card">
                  <div className="address-header">
                    <div className="address-info">
                      <h3 className="address-title">
                        <i className="material-icons">location_on</i>
                        {address}
                      </h3>
                      {rooms.length > 0 && rooms[0].comment && (
                        <span className="address-comment">
                          {rooms[0].comment}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="rooms-list">
                    {rooms.map((room) => (
                      <div key={room.id} className="room-item">
                        <div className="room-info">
                          <i className="material-icons">meeting_room</i>
                          <span className="room-name">{room.room} {room.room === '1' ? 'комната' : room.room === '2' || room.room === '3' || room.room === '4' ? 'комнаты' : 'комнат'}</span>
                        </div>
                        <div className="room-actions">
                          {hasPermission('shifts', 'edit') && (
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditAddress(room);
                              }}
                              title="Редактировать квартиру"
                            >
                              <i className="material-icons">edit</i>
                            </button>
                          )}
                          {hasPermission('shifts', 'delete') && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteAddress(room.id);
                              }}
                              title="Удалить квартиру"
                            >
                              <i className="material-icons">delete</i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Address Modal */}
        {isAddModalOpen && (
          <AddressModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleSaveAddress}
          />
        )}

        {/* Edit Address Modal */}
        {isEditModalOpen && selectedAddress && (
          <AddressModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveAddress}
            initialData={{
              address: selectedAddress.address,
              room: selectedAddress.room,
              comment: selectedAddress.comment
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default ApartmentsPage;
