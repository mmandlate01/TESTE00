// Configurações do repositório
const REPO_OWNER = 'seu-usuario';
const REPO_NAME = 'casamento-milton-teresa';
const DATA_FILE = 'data/convidados.json';
const TOKEN = 'seu-token-de-acesso'; // Gerar token com permissões de repo

// Função para carregar dados dos convidados
async function loadConvidados() {
    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE}`);
        const data = await response.json();
        const content = atob(data.content);
        return JSON.parse(content);
    } catch (error) {
        console.error('Erro ao carregar convidados:', error);
        return [];
    }
}

// Função para salvar dados dos convidados
async function saveConvidados(convidados) {
    try {
        // Primeiro obtemos o SHA do arquivo atual para atualização
        const getResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE}`);
        const getData = await getResponse.json();
        
        const content = JSON.stringify(convidados, null, 2);
        const contentEncoded = btoa(unescape(encodeURIComponent(content)));
        
        const updateResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Atualização da lista de convidados',
                content: contentEncoded,
                sha: getData.sha
            })
        });
        
        return await updateResponse.json();
    } catch (error) {
        console.error('Erro ao salvar convidados:', error);
        throw error;
    }
}

// Função para gerar um ID único para convidados
function generateId() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

// Exportar funções
export { loadConvidados, saveConvidados, generateId };