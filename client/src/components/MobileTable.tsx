import React from 'react';

interface MobileTableProps {
  data: any[];
  columns: {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }[];
  keyField: string;
  title?: (row: any) => string;
  status?: (row: any) => { label: string; className: string };
  actions?: (row: any) => React.ReactNode;
  className?: string;
}

export const MobileTable: React.FC<MobileTableProps> = ({
  data,
  columns,
  keyField,
  title,
  status,
  actions,
  className = ''
}) => {
  return (
    <div className={`mobile-table-cards ${className}`}>
      {data.map((row) => (
        <div key={row[keyField]} className="mobile-table-card">
          {(title || status) && (
            <div className="card-header">
              {title && (
                <div className="card-title">{title(row)}</div>
              )}
              {status && (
                <div className={`card-status ${status(row).className}`}>
                  {status(row).label}
                </div>
              )}
            </div>
          )}
          
          <div className="card-body">
            {columns.map((column) => {
              const value = row[column.key];
              if (value === undefined || value === null || value === '') return null;
              
              return (
                <div key={column.key} className="card-row">
                  <span className="label">{column.label}:</span>
                  <span className="value">
                    {column.render ? column.render(value, row) : value}
                  </span>
                </div>
              );
            })}
          </div>
          
          {actions && (
            <div className="card-actions">
              {actions(row)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Hook for responsive table management
export const useResponsiveTable = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return { isMobile };
};

export default MobileTable;
