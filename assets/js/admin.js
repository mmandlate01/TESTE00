import { loadConvidados, saveConvidados, generateId } from './github-api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Elementos da interface
    const loginContainer = document.getElementById('login-container');
    const adminContainer = document.getElementById('admin-container');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const convidadosList = document.getElementById('convidados-list');
    const rsvpList = document.getElementById('rsvp-list');
    const addConvidadoBtn = document.getElementById('add-convidado-btn');
    const searchConvidado = document.getElementById('search-convidado');
    const convidadoModal = document.getElementById('convidado-modal');
    const closeModal = document.querySelector('.close-modal');
    const convidadoForm = document.getElementById('convidado-form');
    const modalTitle = document.getElementById('modal-title');
    
    // Estatísticas RSVP
    const totalConfirmados = document.getElementById('total-confirmados');
    const totalPendentes = document.getElementById('total-pendentes');
    const totalRecusados = document.getElementById('total-recusados');
    
    // Senha de acesso (simples para demonstração)
    const ADMIN_PASSWORD = 'casamento2026';
    
    // Variável para armazenar convidados
    let convidados = [];
    
    // Verificar se já está logado
    if (sessionStorage.getItem('loggedIn') === 'true') {
        loginContainer.classList.add('hidden');
        adminContainer.classList.remove('hidden');
        loadData();
    }
    
    // Evento de login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const senha = document.getElementById('senha').value;
        
        if (senha === ADMIN_PASSWORD) {
            sessionStorage.setItem('loggedIn', 'true');
            loginContainer.classList.add('hidden');
            adminContainer.classList.remove('hidden');
            loadData();
        } else {
            alert('Senha incorreta!');
        }
    });
    
    // Evento de logout
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('loggedIn');
        adminContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });
    
    // Carregar dados
    async function loadData() {
        try {
            convidados = await loadConvidados();
            renderConvidadosList();
            renderRSVPList();
            updateStats();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar dados. Por favor, recarregue a página.');
        }
    }
    
    // Renderizar lista de convidados
    function renderConvidadosList(filter = '') {
        convidadosList.innerHTML = '';
        
        const filtered = filter 
            ? convidados.filter(c => c.nome.toLowerCase().includes(filter.toLowerCase()))
            : convidados;
        
        if (filtered.length === 0) {
            convidadosList.innerHTML = '<p class="no-results">Nenhum convidado encontrado</p>';
            return;
        }
        
        filtered.forEach(convidado => {
            const convidadoEl = document.createElement('div');
            convidadoEl.className = 'convidado-item';
            convidadoEl.innerHTML = `
                <div class="convidado-info">
                    <h3>${convidado.nome}</h3>
                    <p>Mesa: ${convidado.mesa || '--'}</p>
                    <p>Status: ${getStatusText(convidado.rsvp)}</p>
                </div>
                <div class="convidado-actions">
                    <button class="edit-btn" data-id="${convidado.id}">Editar</button>
                    <button class="delete-btn" data-id="${convidado.id}">Remover</button>
                    <button class="link-btn" data-id="${convidado.id}">Copiar Link</button>
                </div>
            `;
            
            convidadosList.appendChild(convidadoEl);
        });
        
        // Adicionar eventos aos botões
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteConvidado(btn.dataset.id));
        });
        
        document.querySelectorAll('.link-btn').forEach(btn => {
            btn.addEventListener('click', () => copyInviteLink(btn.dataset.id));
        });
    }
    
    // Renderizar lista RSVP
    function renderRSVPList() {
        rsvpList.innerHTML = '';
        
        // Ordenar por nome
        const sorted = [...convidados].sort((a, b) => a.nome.localeCompare(b.nome));
        
        sorted.forEach(convidado => {
            const rsvpEl = document.createElement('div');
            rsvpEl.className = `rsvp-item ${convidado.rsvp || 'pendente'}`;
            rsvpEl.innerHTML = `
                <div class="rsvp-info">
                    <h3>${convidado.nome}</h3>
                    <p>Mesa: ${convidado.mesa || '--'}</p>
                    ${convidado.mensagem ? `<p class="mensagem">"${convidado.mensagem}"</p>` : ''}
                </div>
                <div class="rsvp-status">
                    <span class="status-badge ${convidado.rsvp || 'pendente'}">
                        ${getStatusText(convidado.rsvp)}
                    </span>
                </div>
            `;
            
            rsvpList.appendChild(rsvpEl);
        });
    }
    
    // Atualizar estatísticas
    function updateStats() {
        const confirmados = convidados.filter(c => c.rsvp === 'confirmado').length;
        const pendentes = convidados.filter(c => !c.rsvp).length;
        const recusados = convidados.filter(c => c.rsvp === 'recusado').length;
        
        totalConfirmados.textContent = confirmados;
        totalPendentes.textContent = pendentes;
        totalRecusados.textContent = recusados;
    }
    
    // Helper para texto de status
    function getStatusText(rsvp) {
        switch(rsvp) {
            case 'confirmado': return 'Confirmado';
            case 'recusado': return 'Não vai comparecer';
            default: return 'Pendente';
        }
    }
    
    // Buscar convidados
    searchConvidado.addEventListener('input', (e) => {
        renderConvidadosList(e.target.value);
    });
    
    // Abrir modal para adicionar convidado
    addConvidadoBtn.addEventListener('click', () => {
        convidadoForm.reset();
        document.getElementById('convidado-id').value = '';
        modalTitle.textContent = 'Adicionar Convidado';
        convidadoModal.classList.remove('hidden');
    });
    
    // Fechar modal
    closeModal.addEventListener('click', () => {
        convidadoModal.classList.add('hidden');
    });
    
    // Abrir modal para editar convidado
    function openEditModal(id) {
        const convidado = convidados.find(c => c.id === id);
        if (!convidado) return;
        
        document.getElementById('convidado-id').value = convidado.id;
        document.getElementById('nome').value = convidado.nome;
        document.getElementById('mesa').value = convidado.mesa || '';
        document.getElementById('email').value = convidado.email || '';
        
        modalTitle.textContent = 'Editar Convidado';
        convidadoModal.classList.remove('hidden');
    }
    
    // Salvar convidado (adicionar ou editar)
    convidadoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('convidado-id').value;
        const nome = document.getElementById('nome').value;
        const mesa = document.getElementById('mesa').value;
        const email = document.getElementById('email').value;
        
        if (id) {
            // Editar convidado existente
            const index = convidados.findIndex(c => c.id === id);
            if (index !== -1) {
                convidados[index] = { ...convidados[index], nome, mesa, email };
            }
        } else {
            // Adicionar novo convidado
            const newId = generateId();
            convidados.push({
                id: newId,
                nome,
                mesa,
                email,
                rsvp: null,
                mensagem: null
            });
        }
        
        try {
            await saveConvidados(convidados);
            convidadoModal.classList.add('hidden');
            loadData();
        } catch (error) {
            alert('Erro ao salvar convidado. Por favor, tente novamente.');
        }
    });
    
    // Deletar convidado
    async function deleteConvidado(id) {
        if (!confirm('Tem certeza que deseja remover este convidado?')) return;
        
        convidados = convidados.filter(c => c.id !== id);
        
        try {
            await saveConvidados(convidados);
            loadData();
        } catch (error) {
            alert('Erro ao remover convidado. Por favor, tente novamente.');
        }
    }
    
    // Copiar link do convite
    function copyInviteLink(id) {
        const conviteUrl = `${window.location.origin}/convite.html?convite=${id}`;
        navigator.clipboard.writeText(conviteUrl)
            .then(() => alert('Link copiado para a área de transferência!'))
            .catch(() => prompt('Copie o link abaixo:', conviteUrl));
    }
});