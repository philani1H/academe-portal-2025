import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface TableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => ReactNode;
  mobileLabel?: string; // Custom label for mobile view
  hiddenOnMobile?: boolean;
}

export interface TableAction {
  label: string;
  onClick: (row: any) => void;
  variant?: 'default' | 'destructive';
  icon?: ReactNode;
}

interface ResponsiveTableProps {
  columns: TableColumn[];
  data: any[];
  actions?: TableAction[];
  loading?: boolean;
  emptyMessage?: string;
  mobileCardView?: boolean; // Use card view on mobile instead of table
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  actions = [],
  loading = false,
  emptyMessage = 'No data available',
  mobileCardView = true,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Data Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className={`${mobileCardView ? 'hidden md:block' : ''} overflow-x-auto`}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {columns.filter(col => !col.hiddenOnMobile).map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: rowIndex * 0.05 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {columns.filter(col => !col.hiddenOnMobile).map((column) => (
                  <td key={column.key} className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-4 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action, actionIndex) => (
                          <DropdownMenuItem
                            key={actionIndex}
                            onClick={() => action.onClick(row)}
                            className={action.variant === 'destructive' ? 'text-red-600' : ''}
                          >
                            {action.icon && <span className="mr-2">{action.icon}</span>}
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      {mobileCardView && (
        <div className="md:hidden space-y-4">
          {data.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: rowIndex * 0.05 }}
            >
              <Card className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <div className="space-y-3">
                  {columns.map((column) => {
                    if (column.hiddenOnMobile) return null;
                    return (
                      <div key={column.key} className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          {column.mobileLabel || column.label}
                        </span>
                        <div className="text-sm text-gray-900 dark:text-gray-100 text-right">
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </div>
                      </div>
                    );
                  })}

                  {actions.length > 0 && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-wrap">
                      {actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => action.onClick(row)}
                          className="flex-1"
                        >
                          {action.icon && <span className="mr-1">{action.icon}</span>}
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
};

export default ResponsiveTable;
