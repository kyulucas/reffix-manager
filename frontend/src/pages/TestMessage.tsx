import React, { useState, useEffect } from 'react';
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Smartphone,
  MessageSquare,
  Phone,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Instance {
  id: string;
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'FAILED';
  phoneNumber?: string;
}

interface TestResult {
  id: string;
  instanceId: string;
  phoneNumber: string;
  message: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: string;
  error?: string;
}

const TestMessage: React.FC = () => {
  const { user } = useAuth();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [phoneValidation, setPhoneValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: false, message: '' });

  useEffect(() => {
    loadInstances();
  }, []);

  useEffect(() => {
    validatePhoneNumber(phoneNumber);
  }, [phoneNumber]);

  const loadInstances = async () => {
    try {
      // Simular dados para demonstração
      const mockInstances: Instance[] = [
        {
          id: '1',
          name: 'Cliente ABC',
          status: 'CONNECTED',
          phoneNumber: '+5511999999999'
        },
        {
          id: '2',
          name: 'Cliente XYZ',
          status: 'CONNECTED',
          phoneNumber: '+5511888888888'
        },
        {
          id: '3',
          name: 'Cliente DEF',
          status: 'DISCONNECTED'
        }
      ];
      
      setInstances(mockInstances);
    } catch (error) {
      toast.error('Erro ao carregar instâncias');
    }
  };

  const validatePhoneNumber = (phone: string) => {
    if (!phone) {
      setPhoneValidation({ isValid: false, message: '' });
      return;
    }

    // Remover caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Validar formato brasileiro (11 dígitos) ou internacional
    if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
      setPhoneValidation({ 
        isValid: true, 
        message: 'Número válido' 
      });
    } else {
      setPhoneValidation({ 
        isValid: false, 
        message: 'Número deve ter entre 10 e 15 dígitos' 
      });
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 11 && cleanPhone.startsWith('11')) {
      // Formato brasileiro: (11) 99999-9999
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
    } else if (cleanPhone.length === 10) {
      // Formato brasileiro sem DDD: 99999-9999
      return `${cleanPhone.slice(0, 5)}-${cleanPhone.slice(5)}`;
    }
    
    return phone;
  };

  const handleSendMessage = async () => {
    if (!selectedInstance || !phoneNumber || !message) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (!phoneValidation.isValid) {
      toast.error('Número de telefone inválido');
      return;
    }

    const selectedInst = instances.find(inst => inst.id === selectedInstance);
    if (!selectedInst || selectedInst.status !== 'CONNECTED') {
      toast.error('Selecione uma instância conectada');
      return;
    }

    setLoading(true);

    // Simular envio da mensagem
    const testResult: TestResult = {
      id: Date.now().toString(),
      instanceId: selectedInstance,
      phoneNumber: formatPhoneNumber(phoneNumber),
      message,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    };

    try {

      setTestResults(prev => [testResult, ...prev]);

      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular resultado (90% de sucesso)
      const isSuccess = Math.random() > 0.1;
      
      setTestResults(prev => prev.map(result => 
        result.id === testResult.id 
          ? {
              ...result,
              status: isSuccess ? 'SUCCESS' : 'FAILED',
              error: isSuccess ? undefined : 'Número não encontrado no WhatsApp'
            }
          : result
      ));

      if (isSuccess) {
        toast.success('Mensagem enviada com sucesso!');
        setMessage('');
      } else {
        toast.error('Falha ao enviar mensagem');
      }

    } catch (error) {
      toast.error('Erro ao enviar mensagem');
      setTestResults(prev => prev.map(result => 
        result.id === testResult.id 
          ? {
              ...result,
              status: 'FAILED',
              error: 'Erro de conexão'
            }
          : result
      ));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'PENDING':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'Enviada';
      case 'FAILED':
        return 'Falhou';
      case 'PENDING':
        return 'Enviando...';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'badge-success';
      case 'FAILED':
        return 'badge-danger';
      case 'PENDING':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const connectedInstances = instances.filter(inst => inst.status === 'CONNECTED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Teste de Mensagens
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Teste o envio de mensagens através das suas instâncias conectadas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Teste */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Enviar Mensagem de Teste
          </h3>
          
          <div className="space-y-4">
            {/* Seleção de Instância */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Instância
              </label>
              <select
                value={selectedInstance}
                onChange={(e) => setSelectedInstance(e.target.value)}
                className="input"
                disabled={connectedInstances.length === 0}
              >
                <option value="">
                  {connectedInstances.length === 0 
                    ? 'Nenhuma instância conectada' 
                    : 'Selecione uma instância'
                  }
                </option>
                {connectedInstances.map((instance) => (
                  <option key={instance.id} value={instance.id}>
                    {instance.name} ({instance.phoneNumber})
                  </option>
                ))}
              </select>
              {connectedInstances.length === 0 && (
                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Conecte uma instância para enviar mensagens
                </p>
              )}
            </div>

            {/* Número de Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número do WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="11999999999 ou +5511999999999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`input pl-10 ${
                    phoneNumber && !phoneValidation.isValid 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : phoneValidation.isValid 
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                        : ''
                  }`}
                />
              </div>
              {phoneValidation.message && (
                <p className={`mt-1 text-sm ${
                  phoneValidation.isValid 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {phoneValidation.message}
                </p>
              )}
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mensagem
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  placeholder="Digite sua mensagem de teste..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="input pl-10 resize-none"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {message.length}/1000 caracteres
              </p>
            </div>

            {/* Botão de Envio */}
            <button
              onClick={handleSendMessage}
              disabled={loading || !selectedInstance || !phoneNumber || !message || !phoneValidation.isValid}
              className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
          </div>
        </div>

        {/* Histórico de Testes */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Histórico de Testes
          </h3>
          
          {testResults.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Nenhum teste realizado
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Envie uma mensagem de teste para ver o histórico aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.map((result) => {
                const instance = instances.find(inst => inst.id === result.instanceId);
                return (
                  <div key={result.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        {getStatusIcon(result.status)}
                        <span className={`ml-2 badge ${getStatusBadge(result.status)}`}>
                          {getStatusText(result.status)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(result.timestamp)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Smartphone className="h-4 w-4 mr-2" />
                        {instance?.name || 'Instância desconhecida'}
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="h-4 w-4 mr-2" />
                        {result.phoneNumber}
                      </div>
                      <div className="text-gray-900 dark:text-white">
                        "{result.message}"
                      </div>
                      {result.error && (
                        <div className="text-red-600 dark:text-red-400 text-xs">
                          Erro: {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dicas de Uso */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Dicas para Teste
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Formato do Número
            </h4>
            <ul className="space-y-1">
              <li>• Use o formato brasileiro: 11999999999</li>
              <li>• Ou formato internacional: +5511999999999</li>
              <li>• O número deve estar cadastrado no WhatsApp</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Instâncias
            </h4>
            <ul className="space-y-1">
              <li>• Apenas instâncias conectadas podem enviar mensagens</li>
              <li>• Verifique o status na página de Instâncias</li>
              <li>• Use o QR Code para conectar novas instâncias</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestMessage;