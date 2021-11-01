const StatusProduto = {
    ATIVO: 1,
    EM_DEPRECIACAO: 2,
    OBSOLETO: 3,
}

const LS_HISTORICO_NOME = 'historico-part-numbers'

const divAvisoConsulta = document.getElementById('div-aviso-consulta')
const btnConsultar = document.getElementById('btn-consultar')
const inpPartNumber = document.getElementById('inp-part-number')
const divProgresso = document.getElementById('div-progresso')
const divResultadoConsulta = document.getElementById('div-resultado-consulta')
const tblHistorico = document.getElementById('tbl-historico')
const fldConsulta = document.getElementById('fld-consulta')

let idIntervalAtualizarHistorico

function obterDadosStatusTag(status) {
    switch (status) {
        case StatusProduto.ATIVO: {
            return { texto: 'ativo', classe: 'is-success' }
        }
        case StatusProduto.EM_DEPRECIACAO: {
            return { texto: 'em depreciação', classe: 'is-warning' }
        }
        case StatusProduto.OBSOLETO: {
            return { texto: 'obsoleto', classe: 'is-danger' }
        }
        default: {
            throw new Error('Status desconhecido:' + status)
        }
    }
}

function gerarTextoIntervalo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;

    if (interval > 1) {
        return Math.floor(interval) + ' anos';
    }

    interval = seconds / 2592000;

    if (interval > 1) {
        return Math.floor(interval) + ' meses';
    }

    interval = seconds / 86400;

    if (interval > 1) {
        return Math.floor(interval) + ' dias';
    }

    interval = seconds / 3600;

    if (interval > 1) {
        return Math.floor(interval) + ' horas';
    }

    interval = seconds / 60;

    if (interval > 1) {
        return Math.floor(interval) + ' minutos';
    }

    return Math.floor(seconds) + ' segundos';
}

function consultar(pn) {
    const resultado = [
        StatusProduto.ATIVO,
        StatusProduto.EM_DEPRECIACAO,
        StatusProduto.OBSOLETO
    ][Math.floor(Math.random() * 3)]

    return new Promise(resolve => {
        setTimeout(() => resolve(resultado), 1900)
    })
}

function exibirAlertaConsulta(mensagem) {
    divAvisoConsulta.children[1].textContent = mensagem
    divAvisoConsulta.classList.remove('is-hidden')
}

function esconderAlertaConsulta() {
    divAvisoConsulta.classList.add('is-hidden')
}

function exibirProgresso() {
    divProgresso.classList.remove('is-hidden')
}

function esconderProgresso() {
    divProgresso.classList.add('is-hidden')
}

function exibirResultadoConsulta(status) {
    const tag = divResultadoConsulta.querySelector('.tag')

    tag.classList.remove('is-success', 'is-warning', 'is-danger')

    const { texto, classe } = obterDadosStatusTag(status)

    tag.textContent = texto
    tag.classList.add(classe)

    divResultadoConsulta.classList.remove('is-hidden')
}

function esconderResultadoConsulta() {
    divResultadoConsulta.classList.add('is-hidden')
}

function iniciarAtualiacaoAutomaticaHistorico() {
    idIntervalAtualizarHistorico = setInterval(atualizarTabelaHistorico, 1001);
}

function pararAtualiacaoAutomaticaHistorico() {
    clearInterval(idIntervalAtualizarHistorico)
}

function liberarFormConsulta() {
    fldConsulta.removeAttribute('disabled')
}

function bloquearFormConsulta() {
    fldConsulta.setAttribute('disabled', '')
}

function atualizarTabelaHistorico() {
    const historico = JSON.parse(localStorage.getItem(LS_HISTORICO_NOME))

    const body = tblHistorico.querySelector('tbody')

    while (body.firstChild) {
        body.removeChild(body.lastChild)
    }

    Object.entries(historico)
        .map(([pn, dados]) => ({ pn, ...dados }))
        .sort((a, b) => a.data < b.data ? 1 : -1)
        .forEach(({ pn, status, data }) => {
            data = new Date(data)
            const dadosStatus = obterDadosStatusTag(status)

            // <tr>
            //     <th><a id="btn-refazer-consulta">123ABC</a></th>
            //     <th><span class="tag is-success">ativo</span></th>
            //     <th>04/10/2021 15:37</th>
            // </tr>

            const tr = document.createElement('tr')
            const tdPn = document.createElement('td')
            const tdStatus = document.createElement('td')
            const tdData = document.createElement('td')
            tr.appendChild(tdPn)
            tr.appendChild(tdStatus)
            tr.appendChild(tdData)
            const anchorPn = document.createElement('a')
            anchorPn.textContent = pn
            tdPn.appendChild(anchorPn)
            tdPn.addEventListener('click', function () {
                inpPartNumber.value = pn
                btnConsultar.click()
            })
            const spanStatus = document.createElement('span')
            spanStatus.classList.add('tag', dadosStatus.classe)
            spanStatus.textContent = dadosStatus.texto
            tdStatus.appendChild(spanStatus)
            tdData.textContent = 'Há ' + gerarTextoIntervalo(data)
            body.appendChild(tr)
        })
}

function gravarHistorico(pn, status) {
    const historico = JSON.parse(localStorage.getItem(LS_HISTORICO_NOME))

    const agora = new Date()
    agora.setMilliseconds(0)

    historico[pn] = {
        status,
        data: agora.toISOString()
    }

    localStorage.setItem(LS_HISTORICO_NOME, JSON.stringify(historico))
}

window.addEventListener('load', function () {
    const historico = JSON.parse(localStorage.getItem(LS_HISTORICO_NOME))

    if (!historico) {
        localStorage.setItem(LS_HISTORICO_NOME, '{}')
    }

    atualizarTabelaHistorico()

    iniciarAtualiacaoAutomaticaHistorico()
})

btnConsultar.addEventListener('click', function () {
    const pn = inpPartNumber.value

    if (!pn.trim()) {
        exibirAlertaConsulta('PN inválido')

        return
    }

    bloquearFormConsulta()
    pararAtualiacaoAutomaticaHistorico()
    esconderAlertaConsulta()
    esconderResultadoConsulta()

    exibirProgresso()

    consultar(pn)
        .then(status => {
            exibirResultadoConsulta(status)
            esconderProgresso()
            gravarHistorico(pn, status)
            atualizarTabelaHistorico()
            iniciarAtualiacaoAutomaticaHistorico()
            liberarFormConsulta()
        })
        .catch(err => {
            esconderProgresso()
            exibirAlertaConsulta('Erro ao consultar PN')
            console.error(err)
            iniciarAtualiacaoAutomaticaHistorico()
            liberarFormConsulta()
        })
})
