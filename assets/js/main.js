import { loadConvidados, saveConvidados } from './assets/js/github-api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar se é a página de convite
    if (!window.location.pathname.includes('convite.html')) return;
    
    // Elementos da página de convite
    const conviteNome = document.getElementById('convite-nome');
    const conviteMesa = document.getElementById('convite-mesa');
    const rsvpForm = document.getElementById('rsvp-form');
    
    // Obter ID do convite da URL
    const urlParams = new URLSearchParams(window.location.search);
    const conviteId = urlParams.get('convite');
    
    if (!conviteId) {
        // Redirecionar para página principal se não houver ID
        window.location.href = '/';
        return;
    }
    
    try {
        // Carregar dados do convidado
        const convidados = await loadConvidados();
        const convidado = convidados.find(c => c.id === conviteId);
        
        if (!convidado) {
            alert('Convite não encontrado ou inválido.');
            window.location.href = '/';
            return;
        }
        
        // Preencher informações do convidado
        conviteNome.textContent = `Prezado(a) ${convidado.nome},`;
        conviteMesa.textContent = convidado.mesa || '--';
        
        // Marcar opção RSVP se já tiver respondido
        if (convidado.rsvp) {
            const radio = document.querySelector(`input[value="${convidado.rsvp}"]`);
            if (radio) radio.checked = true;
        }
        
        // Enviar RSVP
        rsvpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const rsvp = document.querySelector('input[name="rsvp"]:checked').value;
            const mensagem = document.getElementById('mensagem').value;
            
            // Atualizar convidado
            const updatedConvidados = convidados.map(c => {
                if (c.id === conviteId) {
                    return { ...c, rsvp, mensagem };
                }
                return c;
            });
            
            try {
                await saveConvidados(updatedConvidados);
                alert('Obrigado por confirmar sua presença!');
                window.location.reload();
            } catch (error) {
                alert('Erro ao enviar confirmação. Por favor, tente novamente.');
            }
        });
        
    } catch (error) {
        console.error('Erro ao carregar convite:', error);
        alert('Erro ao carregar convite. Por favor, tente novamente.');
    }
});
