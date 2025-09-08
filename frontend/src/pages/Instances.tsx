import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw,
  QrCode,
  Smartphone,
  Wifi,
  WifiOff,
  Settings,
  Eye,
  EyeOff,
  Phone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Instance {
  id: string;
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'FAILED';
  phoneNumber?: string;
  qrCode?: string;
  createdAt: string;
  lastSeen?: string;
  webhook?: {
    url: string;
    events: string[];
  };
  settings?: {
    rejectCall: boolean;
    msgRetryCounterCache: number;
    userAgent: string;
    markMessagesRead: boolean;
    syncFullHistory: boolean;
    alwaysOnline: boolean;
    readMessages: boolean;
    readStatus: boolean;
  };
}

const Instances: React.FC = () => {
  const { user } = useAuth();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'FAILED'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    try {
      setLoading(true);
      // Simular dados para demonstração
      const mockInstances: Instance[] = [
        {
          id: '1',
          name: 'Cliente ABC',
          status: 'CONNECTED',
          phoneNumber: '+5511999999999',
          createdAt: '2024-02-21T10:00:00Z',
          lastSeen: '2024-09-05T14:20:00Z',
          webhook: {
            url: 'https://webhook.site/abc123',
            events: ['messages.upsert', 'connection.update']
          },
          settings: {
            rejectCall: false,
            msgRetryCounterCache: 10,
            userAgent: 'WhatsApp/2.23.24.15',
            markMessagesRead: true,
            syncFullHistory: false,
            alwaysOnline: true,
            readMessages: true,
            readStatus: true
          }
        },
        {
          id: '2',
          name: 'Cliente XYZ',
          status: 'DISCONNECTED',
          createdAt: '2024-03-15T14:30:00Z',
          lastSeen: '2024-09-04T18:45:00Z',
          webhook: {
            url: 'https://webhook.site/xyz789',
            events: ['messages.upsert']
          }
        },
        {
          id: '3',
          name: 'Cliente DEF',
          status: 'CONNECTING',
          createdAt: '2024-09-05T12:00:00Z',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      ];
      
      setInstances(mockInstances);
    } catch (error) {
      toast.error('Erro ao carregar instâncias');
    } finally {
      setLoading(false);
    }
  };

  const filteredInstances = instances.filter(instance => {
    const matchesSearch = instance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instance.phoneNumber?.includes(searchTerm) ||
                         instance.id.includes(searchTerm);
    const matchesStatus = filterStatus === 'ALL' || instance.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleInstanceAction = async (instanceId: string, action: string) => {
    try {
      // Aqui você faria a chamada para a API
      switch (action) {
        case 'connect':
          setInstances(instances.map(inst => 
            inst.id === instanceId 
              ? { ...inst, status: 'CONNECTING' as const }
              : inst
          ));
          toast.success('Conectando instância...');
          break;
        case 'disconnect':
          setInstances(instances.map(inst => 
            inst.id === instanceId 
              ? { ...inst, status: 'DISCONNECTED' as const }
              : inst
          ));
          toast.success('Instância desconectada');
          break;
        case 'restart':
          setInstances(instances.map(inst => 
            inst.id === instanceId 
              ? { ...inst, status: 'CONNECTING' as const }
              : inst
          ));
          toast.success('Reiniciando instância...');
          break;
        case 'delete':
          if (window.confirm('Tem certeza que deseja excluir esta instância?')) {
            setInstances(instances.filter(inst => inst.id !== instanceId));
            toast.success('Instância excluída com sucesso');
          }
          break;
      }
    } catch (error) {
      toast.error('Erro ao executar ação');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'DISCONNECTED':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'CONNECTING':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case 'FAILED':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return 'badge-success';
      case 'DISCONNECTED':
        return 'badge-danger';
      case 'CONNECTING':
        return 'badge-warning';
      case 'FAILED':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return 'Conectado';
      case 'DISCONNECTED':
        return 'Desconectado';
      case 'CONNECTING':
        return 'Conectando';
      case 'FAILED':
        return 'Falhou';
      default:
        return 'Desconhecido';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestão de Instâncias
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie suas instâncias do WhatsApp
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Instância
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <Wifi className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Conectadas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {instances.filter(i => i.status === 'CONNECTED').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900">
              <WifiOff className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Desconectadas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {instances.filter(i => i.status === 'DISCONNECTED').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 dark:border-yellow-400"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Conectando
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {instances.filter(i => i.status === 'CONNECTING').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {instances.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nome, telefone ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input"
            >
              <option value="ALL">Todos</option>
              <option value="CONNECTED">Conectado</option>
              <option value="DISCONNECTED">Desconectado</option>
              <option value="CONNECTING">Conectando</option>
              <option value="FAILED">Falhou</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button className="btn-secondary w-full flex items-center justify-center">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Instances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInstances.map((instance) => (
          <div key={instance.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {instance.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {instance.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(instance.status)}
                <span className={`badge ${getStatusBadge(instance.status)}`}>
                  {getStatusText(instance.status)}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {instance.phoneNumber && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4 mr-2" />
                  {instance.phoneNumber}
                </div>
              )}
              
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Settings className="h-4 w-4 mr-2" />
                Criada em {formatDate(instance.createdAt)}
              </div>
              
              {instance.lastSeen && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Eye className="h-4 w-4 mr-2" />
                  Última atividade: {formatDate(instance.lastSeen)}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {instance.status === 'DISCONNECTED' && (
                  <button
                    onClick={() => handleInstanceAction(instance.id, 'connect')}
                    className="btn-primary text-sm px-3 py-1"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Conectar
                  </button>
                )}
                
                {instance.status === 'CONNECTED' && (
                  <button
                    onClick={() => handleInstanceAction(instance.id, 'disconnect')}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Desconectar
                  </button>
                )}
                
                {instance.status === 'CONNECTING' && instance.qrCode && (
                  <button
                    onClick={() => setShowQRCode(instance.qrCode || null)}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    <QrCode className="h-4 w-4 mr-1" />
                    QR Code
                  </button>
                )}
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => setSelectedInstance(instance)}
                  className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleInstanceAction(instance.id, 'restart')}
                  className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400"
                  title="Reiniciar"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleInstanceAction(instance.id, 'delete')}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredInstances.length === 0 && (
        <div className="text-center py-12">
          <Smartphone className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Nenhuma instância encontrada
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Crie sua primeira instância para começar a usar o WhatsApp.
          </p>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                QR Code para Conectar
              </h3>
              <button
                onClick={() => setShowQRCode(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <EyeOff className="h-5 w-5" />
              </button>
            </div>
            <div className="text-center">
              <img 
                src={showQRCode} 
                alt="QR Code" 
                className="mx-auto mb-4"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Escaneie este QR Code com seu WhatsApp para conectar a instância.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instances;