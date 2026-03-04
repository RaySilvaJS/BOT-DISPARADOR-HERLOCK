const contatos = require("./contatos_api");

function extrairTodosData(lista) {
  return lista
    .filter((item) => /\d{2}\/\d{2}/.test(item))
    .map((item) => {
      //let match = item.match(/(\d{2}\/\d{2})\s*[- ]*\s*(.*?)\|(\+?\d[\d\s-]+)/);
      let match = item.match(
        /^(\p{Emoji}|\p{Emoji_Presentation}|\p{Extended_Pictographic})?\s*(\d{2})\/(\d{2})(?:\/\d{4})?\s*(.*?)(?:\|(\+?\d[\d\s-]+))?$/u
      );
      if (!match) return null;

      if (match) {
        return {
          emoji: match[1] ? match[1].trim() : "",
          dia: match[2],
          mes: match[3], //parseInt(match[3]),
          nome: match[4].trim(),
          telefone: match[5] ? match[5].trim() : null,
          completo: match[0],
        };
      } else {
        return null;
      }
    })
    .filter(Boolean);
}

function extrairMesDia(lista, mes, dia) {
  return lista
    .map((item) => {
      //let match = item.match(/(\d{2})\/(\d{2})\s*[- ]*\s*(.*?)(?:\|(\+?\d[\d\s-]+))?$/);
      let match = item.match(
        /^(\p{Emoji}|\p{Emoji_Presentation}|\p{Extended_Pictographic})?\s*(\d{2})\/(\d{2})(?:\/\d{4})?\s*(.*?)(?:\|(\+?\d[\d\s-]+))?$/u
      );
      if (!match) return null;

      if (match) {
        return {
          emoji: match[1] ? match[1].trim() : "",
          dia: match[2],
          mes: match[3], //parseInt(match[3]),
          nome: match[4].trim(),
          telefone: match[5] ? match[5].trim() : null,
          completo: match[0],
        };
      }
      return null;
    })
    .filter(
      (obj) =>
        obj &&
        parseInt(obj.mes) === parseInt(mes) &&
        parseInt(obj.dia) <= parseInt(dia)
    );
}

async function googleApiContats(TYPE, QUERY = []) {
  try {
    // A. Inicializa e espera a API estar pronta
    await contatos.initializeApi();

    // Mostra os contatos atuais
    //await contatos.listarContatos();

    let message;

    // 1. ADICIONAR CONTATO
    if (TYPE === 1) {
      message = await contatos.adicionarContato(QUERY[0], QUERY[1]);
    }

    // 2. ALTERAR CONTATO
    if (TYPE === 2) {
      message = await contatos.alterarContato(QUERY[0], QUERY[1]);
    }

    // 3. DELETAR CONTATO
    if (TYPE === 3) {
      message = await contatos.deletarContato(QUERY[0]);
    }

    // Mostra os contatos após
    if (TYPE === 4) {
      message = await contatos.listarContatos().then(({ response, erro }) => {
        if (erro) return { erro };

        if (QUERY[0] == 1) {
          let resultado = extrairTodosData(response.CONTACTS_LIST);
          if (resultado.length === 0)
            return {
              erro: `Nenhum contato encontrado no formato de data: 00/00`,
            };
          return {
            response: {
              size: resultado.length,
              resultado,
            },
          };
        }

        if (QUERY[0] == 2) {
          let resultado = extrairMesDia(
            response.CONTACTS_LIST,
            QUERY[1],
            QUERY[2]
          );
          if (resultado.length === 0)
            return {
              erro: `Nenhum contato encontrado na data de: ${QUERY[2]}/${QUERY[1]}`,
            };
          return {
            response: {
              size: resultado.length,
              resultado,
            },
          };
        }
      });
    }

    return message;
  } catch (error) {
    console.error("\n❌ Ocorreu um erro fatal:", error);
  }
}

module.exports = { googleApiContats };