import { useState } from 'react';
import { Account } from '../types';

interface AccountsModalProps {
  accounts: Account[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (accounts: Account[]) => void;
}

export default function AccountsModal({ accounts, isOpen, onClose, onSave }: AccountsModalProps) {
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts || []);

  const addAccount = () => {
    const newAccount: Account = {
      id: Date.now().toString(),
      site: '',
      login: '',
      password: ''
    };
    setLocalAccounts([...localAccounts, newAccount]);
  };

  const updateAccount = (id: string, field: keyof Account, value: string) => {
    setLocalAccounts(localAccounts.map(acc => 
      acc.id === id ? { ...acc, [field]: value } : acc
    ));
  };

  const deleteAccount = (id: string) => {
    setLocalAccounts(localAccounts.filter(acc => acc.id !== id));
  };

  const handleSave = () => {
    // Фильтруем аккаунты с заполненными полями
    const validAccounts = localAccounts.filter(acc => 
      acc.site.trim() && acc.login.trim() && acc.password.trim()
    );
    onSave(validAccounts);
    onClose();
  };

  const handleClose = () => {
    setLocalAccounts(accounts || []);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal accounts-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Управление аккаунтами</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="accounts-list">
            {localAccounts.length === 0 ? (
              <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>
                Аккаунтов нет. Нажмите "Добавить аккаунт" чтобы создать первый.
              </div>
            ) : (
              localAccounts.map((account) => (
                <div key={account.id} className="account-row">
                  <div className="form-group">
                    <label>Сайт</label>
                    <input
                      type="text"
                      value={account.site}
                      onChange={(e) => updateAccount(account.id, 'site', e.target.value)}
                      placeholder="Например: Chaturbate, OnlyFans"
                    />
                  </div>
                  <div className="form-group">
                    <label>Логин</label>
                    <input
                      type="text"
                      value={account.login}
                      onChange={(e) => updateAccount(account.id, 'login', e.target.value)}
                      placeholder="Имя пользователя"
                    />
                  </div>
                  <div className="form-group">
                    <label>Пароль</label>
                    <input
                      type="password"
                      value={account.password}
                      onChange={(e) => updateAccount(account.id, 'password', e.target.value)}
                      placeholder="Пароль"
                    />
                  </div>
                  <div className="form-group">
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => deleteAccount(account.id)}
                      type="button"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={addAccount} type="button">
              Добавить аккаунт
            </button>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>Отмена</button>
          <button className="btn btn-primary" onClick={handleSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}
