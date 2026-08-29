import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  Search,
  Filter,
  Award,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  Calendar,
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Edit3,
  X,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { StorageService } from '../services/storageService';

interface AdminUsersManagementViewProps {
  currentUser: UserProfile | null;
  onNavigateToUser: (identifier: string) => void;
  onBack?: () => void;
}

export const AdminUsersManagementView: React.FC<AdminUsersManagementViewProps> = ({
  currentUser,
  onNavigateToUser,
  onBack,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Admin Rename User Modal State (LGPD / Marco Civil)
  const [targetUserForRename, setTargetUserForRename] = useState<UserProfile | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const [renameJustification, setRenameJustification] = useState('Solicitação do Titular de Dados (Art. 18, III LGPD)');
  const [customJustification, setCustomJustification] = useState('');
  const [isProcessingRename, setIsProcessingRename] = useState(false);
  const [renameFeedback, setRenameFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const isRealAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.email === 'pedrohenriquecardonaperes@gmail.com';

  const loadUsers = async () => {
    setIsLoading(true);
    const communityUsers = await StorageService.getCommunityUsers();
    setUsers(communityUsers);
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenRenameModal = (u: UserProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetUserForRename(u);
    setNewNameInput(u.displayName || u.username || '');
    setRenameJustification('Solicitação do Titular de Dados (Art. 18, III LGPD)');
    setCustomJustification('');
    setRenameFeedback(null);
  };

  const handleExecuteRename = async () => {
    if (!targetUserForRename) return;
    const targetName = newNameInput.trim();
    if (!targetName) {
      setRenameFeedback({ msg: 'Informe o novo nome de exibição.', type: 'error' });
      return;
    }

    const justification = renameJustification === 'outros'
      ? (customJustification.trim() || 'Retificação Cadastral em conformidade com a LGPD e Marco Civil')
      : renameJustification;

    setIsProcessingRename(true);
    const result = await StorageService.adminUpdateUserName(
      targetUserForRename.uid,
      targetName,
      justification,
      currentUser
    );
    setIsProcessingRename(false);

    if (result.success && result.user) {
      setRenameFeedback({ msg: result.message, type: 'success' });
      await loadUsers();
      setTimeout(() => {
        setTargetUserForRename(null);
        setRenameFeedback(null);
      }, 1800);
    } else {
      setRenameFeedback({ msg: result.message, type: 'error' });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = (u.displayName || u.username || u.email || '').toLowerCase();
      const matchSearch = !searchQuery.trim() || name.includes(searchQuery.toLowerCase().trim());

      if (!matchSearch) return false;

      if (selectedRoleFilter === 'all') return true;
      if (selectedRoleFilter === 'banned') return u.isBanned;
      if (selectedRoleFilter === 'admin') return u.role === 'admin';
      if (selectedRoleFilter === 'moderador') return u.role === 'moderador';
      if (selectedRoleFilter === 'editor') return u.role === 'editor';
      if (selectedRoleFilter === 'leitor') return u.role === 'leitor';
      return true;
    });
  }, [users, searchQuery, selectedRoleFilter]);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'moderador';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-mono">
        <button onClick={onBack} className="hover:text-blue-600 dark:hover:text-blue-400 transition">
          WikiZero
        </button>
        <ChevronRight size={10} className="text-slate-400" />
        <span className="text-slate-700 dark:text-slate-300">Páginas Especiais</span>
        <ChevronRight size={10} className="text-slate-400" />
        <span className="font-semibold text-blue-600 dark:text-blue-400">Special:ListUsers</span>
      </div>

      {/* 2. Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-serif-heading font-bold text-slate-900 dark:text-white">
              Diretório de Usuários & Contribuidores
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Lista completa de editores, administradores, moderadores e contas registradas no projeto WikiZero.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold">
            Total de Usuários: {users.length}
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome de usuário..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'admin', label: '🛡️ Administradores' },
            { id: 'moderador', label: 'Moderadores' },
            { id: 'editor', label: '✍️ Editores' },
            { id: 'leitor', label: 'Leitores' },
            { id: 'banned', label: '🚫 Bloqueados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRoleFilter(tab.id)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                selectedRoleFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Users Grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-mono">Carregando usuários...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center text-slate-400">
          <Users size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum usuário encontrado</p>
          <p className="text-xs mt-1">Tente ajustar seus termos de pesquisa ou filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const roleLabels: Record<UserRole, { label: string; bg: string; text: string }> = {
              admin: { label: 'Administrador', bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300' },
              moderador: { label: 'Moderador', bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300' },
              editor: { label: 'Editor Verificado', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300' },
              leitor: { label: 'Leitor', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
              convidado: { label: 'Convidado', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300' },
            };
            const roleStyle = roleLabels[u.role] || roleLabels.leitor;

            return (
              <div
                key={u.uid}
                onClick={() => onNavigateToUser(u.displayName || u.username || u.uid)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-lg p-4 shadow-xs transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt={u.displayName}
                        className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold font-serif text-lg">
                        {u.displayName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {u.displayName || u.username}
                        </h3>
                        {u.isBanned ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950 text-red-600 font-bold uppercase">
                            Bloqueado
                          </span>
                        ) : (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${roleStyle.bg} ${roleStyle.text}`}>
                            {roleStyle.label}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                        User:{u.displayName || u.username}
                      </div>
                    </div>
                  </div>

                  {u.bio && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2 leading-snug">
                      {u.bio.replace(/[{}[\]=]/g, '').slice(0, 100)}...
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold flex items-center gap-0.5">
                      <Award size={11} /> {u.barnstars?.length || 0}
                    </span>
                    <span>•</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      {u.reputationScore || 100} pts
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isRealAdmin && (
                      <button
                        title="Retificação de Nome (LGPD / Marco Civil)"
                        onClick={(e) => handleOpenRenameModal(u, e)}
                        className="px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 font-bold flex items-center gap-1 border border-purple-200 dark:border-purple-800 transition"
                      >
                        <Edit3 size={10} />
                        <span>Nome (LGPD)</span>
                      </button>
                    )}
                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600 transition">
                      <span>Ver Perfil</span>
                      <ChevronRight size={10} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RETIFICAÇÃO DE NOME DO USUÁRIO (LGPD / MARCO CIVIL - ADMINISTRADOR) */}
      {/* ========================================================================= */}
      {targetUserForRename && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-serif-heading font-bold text-slate-900 dark:text-white">
                    Retificação Cadastral de Nome (LGPD)
                  </h3>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                    Art. 18, III LGPD & Marco Civil da Internet (Lei 12.965/2014)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTargetUserForRename(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={16} />
              </button>
            </div>

            {renameFeedback && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  renameFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                }`}
              >
                {renameFeedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                <span>{renameFeedback.msg}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Atual:
                </label>
                <input
                  type="text"
                  disabled
                  value={targetUserForRename.displayName || targetUserForRename.username || targetUserForRename.uid}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500 font-mono font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Novo Nome de Exibição / Identificador:
                </label>
                <input
                  type="text"
                  value={newNameInput}
                  onChange={(e) => setNewNameInput(e.target.value)}
                  placeholder="Ex: Carlos Eduardo ou EditorSenior"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Requisitos: Entre 3 e 50 caracteres alfanuméricos.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fundamento Legal / Motivo Cadastrado:
                </label>
                <select
                  value={renameJustification}
                  onChange={(e) => setRenameJustification(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                >
                  <option value="Solicitação do Titular de Dados (Art. 18, III LGPD)">
                    Solicitação do Titular de Dados (Art. 18, III LGPD - Retificação Cadastral)
                  </option>
                  <option value="Retificação de Prenome / Nome Social (Lei 14.382/2022)">
                    Retificação de Prenome / Nome Social (Lei 14.382/2022)
                  </option>
                  <option value="Correção de Erro Material ou Grafia Inexata">
                    Correção de Erro Material ou Grafia Inexata
                  </option>
                  <option value="Proteção de Identidade e Privacidade do Titular">
                    Proteção de Identidade e Privacidade do Titular
                  </option>
                  <option value="Decisão Administrativa ou Judicial">
                    Cumprimento de Decisão Administrativa ou Judicial
                  </option>
                  <option value="outros">Outra Motivação Específica</option>
                </select>
              </div>

              {renameJustification === 'outros' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descreva o fundamento:
                  </label>
                  <input
                    type="text"
                    value={customJustification}
                    onChange={(e) => setCustomJustification(e.target.value)}
                    placeholder="Descreva a razão e número de protocolo"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded text-[11px] text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 leading-relaxed">
              <strong>Nota de Conformidade:</strong> A alteração registrará um log imutável de auditoria com seu usuário administrador ({currentUser?.displayName || currentUser?.email}) e emitirá aviso na página de discussão do usuário.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setTargetUserForRename(null)}
                className="px-3 py-1.5 rounded text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteRename}
                disabled={isProcessingRename || !newNameInput.trim()}
                className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                {isProcessingRename ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={14} />
                    <span>Salvar Retificação</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
