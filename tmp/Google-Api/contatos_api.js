const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// Configurações Globais
const SCOPES = ['https://www.googleapis.com/auth/contacts'];
const TOKEN_PATH = 'tmp/Google-Api/token.json';
const CREDENCIAIS = 'tmp/Google-Api/credentials.json'
let peopleService = null;

/**
 * Função auxiliar para obter o token de acesso (usada na primeira execução).
**/
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        //redirect_uri: 'urn:ietf:wg:oauth:2.0:oob' //Tirar
    });
    console.log('Autorize este aplicativo visitando este URL:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Digite o código de autorização da página aqui: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Erro ao tentar recuperar o token de acesso:', err);

            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log('Token armazenado em', TOKEN_PATH);
            });

            peopleService = google.people({ version: 'v1', auth: oAuth2Client });
            callback();
        });
    });
};


/**
 * Carrega credenciais, autentica e inicializa o peopleService.
 * @returns {Promise<void>} Promessa que resolve quando o serviço está pronto.
**/
function initializeApi() {
    console.log("Iniciando autenticação com a Google API...");
    return new Promise((resolve, reject) => {
        const authCallback = () => {
            resolve();
            console.log("API inicializada e pronta para uso.");
        };

        fs.readFile(CREDENCIAIS, (err, content) => {
            if (err) return reject('Erro ao carregar o arquivo de credenciais: ' + err);

            const credentials = JSON.parse(content);
            const clientConfig = credentials.installed || credentials.web;

            const { client_secret, client_id, redirect_uris } = clientConfig;
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) return getNewToken(oAuth2Client, authCallback);

                oAuth2Client.setCredentials(JSON.parse(token));
                peopleService = google.people({ version: 'v1', auth: oAuth2Client });
                authCallback();
            });
        });
    });
};

/**
 * Lista todos os contatos.
**/
async function listarContatos() {
    if (!peopleService) throw new Error("Serviço da API não inicializado.");
    let CONTACTS_LIST = [];

    try {
        const res = await peopleService.people.connections.list({
            resourceName: 'people/me',
            pageSize: 2000,
            personFields: 'names,emailAddresses,phoneNumbers',
        });

        const connections = res.data.connections || [];

        if (connections.length === 0) {
            return { erro: 'Nenhuma conexão encontrada.' };
        };

        connections.forEach((person) => {
            const name = person.names && person.names.length > 0 ? person.names[0].displayName : 'Nome Ausente';
            const phone = person.phoneNumbers && person.phoneNumbers.length > 0 ? person.phoneNumbers[0].value : 'Telefone Ausente';
            //const email = person.emailAddresses && person.emailAddresses.length > 0 ? person.emailAddresses[0].value : 'Email Ausente';  | Email: ${email}
            CONTACTS_LIST.push(`${name}|${phone}`);//[${person.resourceName}]
        });

        return {
            response: {
                CONTACTS_LIST,
                size: CONTACTS_LIST.length
            }
        };

    } catch (error) {
        return { erro: `Erro ao listar contatos: ${error.message}` };
    };
};

/**
 * Busca um contato pelo seu nome (exato)
**/
async function encontrarContatoPorNome(nomeCompleto) {
    if (!peopleService) return null;

    const normalizedSearchName = nomeCompleto.trim().toLowerCase();

    try {
        const res = await peopleService.people.connections.list({
            resourceName: 'people/me',
            pageSize: 2000,
            personFields: 'names',
        });

        const connections = res.data.connections || [];

        const contatoEncontrado = connections.find(person => {
            const name = person.names && person.names.length > 0 ? person.names[0].displayName : '';
            return name.trim().toLowerCase() === normalizedSearchName;
        });

        if (contatoEncontrado) {
            return contatoEncontrado.resourceName;
        } else {
            console.log(`\n⚠️ Aviso: Contato com o nome "${nomeCompleto}" não encontrado.`);
            return null;
        }

    } catch (error) {
        console.error('Erro ao buscar contato:', error.message);
        return null;
    };
};

/**
 * Busca um contato pelo seu numero (exato)
**/
async function encontrarPorContato(param) {
    if (!peopleService) return null;
    const contactQuery = param.replace(/\D+/gi, '');

    try {
        const res = await peopleService.people.connections.list({
            resourceName: 'people/me',
            pageSize: 2000,
            personFields: 'phoneNumbers',
        });

        const connections = res.data.connections || [];
        let contatoEncontrado = [];

        connections.forEach((person) => {
            const name = person.phoneNumbers?.find(contact => contact);
            contatoEncontrado.push({
                resourceName: person.resourceName,
                contact: (name?.value || name?.canonicalForm)?.replace(/\D+/gi, '')
            });
        });


        contatoEncontrado = contatoEncontrado.find(e => e.contact === contactQuery);

        if (contatoEncontrado) {
            return {
                response: {
                    resourceName: contatoEncontrado.resourceName,
                    contact: contatoEncontrado.contact
                }
            };
        } else {
            return {
                erro: `Aviso: Contato com o nome "${param}" não encontrado.`
            };
        };

    } catch (error) {
        return {
            erro: `Erro ao buscar contato2: ${error.message}`
        };
    };
};

/**
 * Adiciona um novo contato.
**/
async function adicionarContato(phone, fullName) {
    if (!peopleService) throw new Error("Serviço da API não inicializado.");

    const [givenName, ...familyNameParts] = fullName.split(' ');
    const familyName = familyNameParts.join(' ');

    const newContact = {
        names: [{
            givenName: givenName || '',
            familyName: familyName || '',
            displayName: fullName,
        }],
        phoneNumbers: [{
            value: phone,
            type: 'mobile',
        }],
    };

    try {
        const res = await peopleService.people.createContact({
            requestBody: newContact,
            personFields: 'names,phoneNumbers',
        });

        return {
            response: `*✅ Contato Adicionado:*\n\n- *Nome:* ${res.data.names[0].displayName}\n|\n- *Contato:* ${res.data.phoneNumbers[0].value}` //| ID: ${res.data.resourceName}
        };
    } catch (error) {
        return {
            erro: `❌ Erro ao adicionar contato ${fullName}: ${error.message}`
        };
    };
};

/**
 * Altera o nome de um contato, buscando-o pelo nome.
**/
async function alterarContato(TELEFONE, newFullName) {
    if (!peopleService) throw new Error("Serviço da API não inicializado.");

    // 1. Encontra o ID (ResourceName) usando o contato
    const { response, erro } = await encontrarPorContato(TELEFONE);

    if (erro) return { erro };

    try {
        // 2. Obter o contato para obter o ETag (necessário para o update)
        const getRes = await peopleService.people.get({
            resourceName: response.resourceName,
            personFields: 'names'
        });

        const existingContact = getRes.data;
        //console.log(getRes)

        // Cria o novo objeto 'names'
        const updatedNames = [{
            metadata: existingContact?.names[0]?.metadata, // Mantém o metadata original
            givenName: newFullName,
            displayName: newFullName,
        }];

        // 4. Chamar o método de update
        const res = await peopleService.people.updateContact({
            resourceName: response.resourceName,
            requestBody: {
                etag: existingContact.etag,
                names: updatedNames,
            },
            updatePersonFields: 'names',
        });

        return { response: `*✏️ Contato Alterado:*\n\n- *Antigo Nome:* ${existingContact.names[0].displayName}\n|\n- *Novo Nome:* ${res.data.names[0].displayName}` }; // ID ${resourceName}

    } catch (error) {
        return { erro: `❌ Erro ao alterar contato ${response.resourceName}: ${error.message}` };
    };
};

/**
 * Deleta um contato, buscando-o pelo nome.
**/
async function deletarContato(CONTACT) {
    if (!peopleService) throw new Error("Serviço da API não inicializado.");

    // 1. Encontra o ID (ResourceName) usando o nome
    const { response, erro } = await encontrarPorContato(CONTACT);

    if (erro) return { erro };

    // 2. Deleta usando o ID encontrado
    try {
        await peopleService.people.deleteContact({
            resourceName: response.resourceName,
        });

        return {
            response: `*🗑️ Contato Deletado:*\n\n- *Telefone: ${response.contact} deletado com sucesso!!*`
        };
    } catch (error) {
        return {
            erro: `❌ Erro ao deletar contato ${response.resourceName}: ${error.message}`
        };
    };
};


module.exports = {
    initializeApi,
    listarContatos,
    adicionarContato,
    alterarContato,
    deletarContato,
};