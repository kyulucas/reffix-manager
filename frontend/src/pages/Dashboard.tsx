import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Smartphone, 
  Users, 
  MessageSquare, 
  Activity
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Instâncias Ativas',
      value: user?.instances?.filter((i: any) => i.status === 'CONNECTED').length || 0,
      total: user?.instances?.length || 0,
      icon: Smartphone,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      name: 'Mensagens Hoje',
      value: 0, // Será implementado depois
      total: user?.limits?.maxMessagesPerDay || 0,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      name: 'Limite de Instâncias',
      value: user?.instances?.length || 0,
      total: user?.limits?.maxInstances || 0,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Bem-vindo de volta, {user?.name}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                    {stat.total > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        /{stat.total}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instâncias Recentes */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Instâncias Recentes
          </h3>
          {user?.instances && user.instances.length > 0 ? (
            <div className="space-y-3">
              {user.instances.slice(0, 5).map((instance: any) => (
                <div key={instance.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-3 ${
                      instance.status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {instance.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {instance.phoneNumber || 'Não conectado'}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${
                    instance.status === 'CONNECTED' ? 'badge-success' : 'badge-danger'
                  }`}>
                    {instance.status === 'CONNECTED' ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Smartphone className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Nenhuma instância
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Crie sua primeira instância para começar.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Ações Rápidas
          </h3>
          <div className="space-y-3">
            <button className="w-full btn-primary text-left">
              <Smartphone className="h-5 w-5 mr-2 inline" />
              Criar Nova Instância
            </button>
            <button className="w-full btn-secondary text-left">
              <MessageSquare className="h-5 w-5 mr-2 inline" />
              Testar Mensagem
            </button>
            {user?.role === 'ADMIN' && (
              <button className="w-full btn-secondary text-left">
                <Users className="h-5 w-5 mr-2 inline" />
                Gerenciar Usuários
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
