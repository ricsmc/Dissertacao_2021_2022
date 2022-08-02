var gdb = require("../utils/graphdb");

module.exports.classes = async function(){
    var myquery = `
    select ?id ?codigo ?titulo ?status (group_concat(distinct ?c2;separator=";") as ?filhos) where { 
        ?id ?p :Classe_N1 ;
            :codigo ?codigo;
             :titulo ?titulo;
              :classeStatus ?status;
             :temFilho ?c2.
    } group by ?id ?codigo ?titulo ?status
    order by ?id
    `
    var result = await gdb.execQuery(myquery);
	let dados = await Promise.all(result.results.bindings.map(async function (C1) {
		return {
            codigo: C1.codigo.value,
            titulo: C1.titulo.value,
			id: C1.id.value,
			status: C1.status.value,
            filhos: await Promise.all (C1.filhos.value.split(';').map(C2 => {
                let dados = getClass(C2,2)
                return dados.then()
            }))
		};
	}));
    return dados
}

async function getClass(elem,x) { 
    var e = elem.split('#')[1]
    var myquery = `
    select ?codigo ?titulo ?status (group_concat(distinct ?c2;separator=";") as ?filhos) where { 
        :${e} :codigo ?codigo;
             :titulo ?titulo;
              :classeStatus ?status;
             :temFilho ?c2.
    } group by ?id ?codigo ?titulo ?status
    `
    var myquery2 =  `
    select ?codigo ?titulo ?status where { 
        :${e} :codigo ?codigo;
            :titulo ?titulo;
            :classeStatus ?status.
    }
    `
    var dados = ''
    if(x >= 4) {
        var result = await gdb.execQuery(myquery2);
        var C1 = result.results.bindings[0]
        dados = {
                codigo: C1.codigo.value,
                titulo: C1.titulo.value,
                id: elem,
                status: C1.status.value
            }

    }
    
    else {
        var result = await gdb.execQuery(myquery);
        var C1 = result.results.bindings[0]
        if(C1 == undefined){
            result = await gdb.execQuery(myquery2);
            C1 = result.results.bindings[0]
            dados = {
                    codigo: C1.codigo.value,
                    titulo: C1.titulo.value,
                    id: elem,
                    status: C1.status.value,
                    filhos: []
                }
        }
        else {
            dados = {
                codigo: C1.codigo.value,
                titulo: C1.titulo.value,
                id: elem,
                status: C1.status.value,
                filhos: await Promise.all (C1.filhos.value.split(';').map(C2 => {
                    let dados = getClass(C2,x+1)
                    return dados
                }))
            };

        }
        
    }
    return dados
    
}

module.exports.class = async function(id){
    var myquery = `
    select ?id ?class ?codigoPai ?tituloPai ?codigo ?titulo ?descricao ?status (group_concat(distinct ?c2;separator=";") as ?filhos) (group_concat(distinct ?c3;separator=";") as ?notasAp) (group_concat(distinct ?c4;separator=";") as ?exemplosNotasAp) (group_concat(distinct ?c5;separator=";") as ?notasEx) (group_concat(distinct ?c6;separator=";") as ?termosInd) ?tipoProc ?procTrans (group_concat(distinct ?c7;separator=";") as ?donos) (group_concat(distinct ?c8;separator=";") as ?participantes) (group_concat(distinct ?c9;separator=";") as ?temRelProc) (group_concat(distinct ?c10;separator=";") as ?temLegislacao) ?pca ?df where { 
        ?id :codigo ?codigo.
        :${id} :codigo ?codigo;
             :titulo ?titulo;
              :descricao ?descricao;
              rdf:type ?class.
        filter(?class!=owl:NamedIndividual)
    optional{:${id} :classeStatus ?status.}
    optional{:${id} :temFilho ?c2.}
    optional{:${id} :temNotaAplicacao ?c3.}
    optional{:${id} :temNotaExclusao ?c5.}
    optional{:${id} :temExemploNA ?c4.}
    optional{:${id} :temTI ?c6.}
    optional{:${id} :temDono ?c7.}
    optional{:${id} :temParticipante ?c8.}
    optional{:${id} :temRelProc ?c9.}
    optional{:${id} :temLegislacao ?c10.}
    optional{:${id} :temPai ?pai.
             ?pai :codigo ?codigoPai;
                  :titulo ?tituloPai.}
    optional{:${id} :processoTipo ?tipoProc.}
    optional{:${id} :processoUniform ?tipoProc.}
    optional{:${id} :processoTransversal ?procTrans.}
    optional{:${id} :temPCA ?pca.}
    optional{:${id} :temDF ?df.}
    } group by ?id ?class ?codigo ?titulo ?status ?codigoPai ?tituloPai ?descricao ?tipoProc ?procTrans ?pca ?df
    `
    var dados = {}
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados = {
        nivel : C1.class.value.slice(-1),
        pai : {
            codigo:C1.codigoPai.value,
            titulo:C1.tituloPai.value
        },
        codigo : C1.codigo.value,
        titulo : C1.titulo.value,
        descricao : C1.descricao.value,
        status : C1.status ? C1.status.value : "",
        filhos : C1.filhos.value.length > 0 ? await Promise.all(C1.filhos.value.split(';').map(Element =>  getChild(Element))) : [],
        notasAp : C1.notasAp.value.length > 0 ? await Promise.all(C1.notasAp.value.split(';').map(Element =>  getNotaAP_ExNAP(Element))) : [],
        exemplosNotasAp : C1.exemplosNotasAp.value.length > 0 ? await Promise.all(C1.exemplosNotasAp.value.split(';').map(Element =>  getNotaAP_ExNAP(Element))) : [],
        notasEx : C1.notasEx.value.length > 0 ? await Promise.all(C1.notasEx.value.split(';').map(Element =>  getNotaAP_ExNAP(Element))) : [],
        termosInd : C1.termosInd.value.length > 0 ? await Promise.all(C1.termosInd.value.split(';').map(Element =>  getTI(Element))) : [],
        tipoProc : C1.tipoProc ? (C1.tipoProc.value=='S' ? "Processo Comum" : "Processo Não Comum") : "",
        procTrans : C1.procTrans ? C1.procTrans.value : "",
        donos : C1.donos.value.length > 0 ? await Promise.all(C1.donos.value.split(';').map(Element => getDonos(Element,Element.split("#")[1].split("_")[0]))) : [],
        participantes : C1.participantes.value.length > 0 ? await Promise.all(C1.participantes.value.split(';').map(Element => getParticipantes(id,Element,Element.split("#")[1].split("_")[0]))) : [],
        temRelProc : C1.temRelProc.value.length > 0 ? await Promise.all(C1.temRelProc.value.split(';').map(Element => getRelacionados(id,Element))) : [],
        temLegislacao : C1.temLegislacao.value.length > 0 ? await Promise.all(C1.temLegislacao.value.split(';').map(Element => getLegislacao(Element))) : [],
        pca : C1.pca ? await (getPCA(C1.pca.value)) : {},
        df : C1.df ? await (getDF(C1.df.value)) : {},
        id : C1.id.value
    }
	
    return dados
}

async function getChild(elem) { 
    var e = elem.split('#')[1]
    var myquery =  `
    select ?codigo ?titulo where { 
        :${e} :codigo ?codigo;
            :titulo ?titulo.
    }
    `
    var dados = ''
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados = {
            codigo: C1.codigo.value,
            titulo: C1.titulo.value,
        }    
    
    return dados
    
}

async function getNotaAP_ExNAP(elem) { 
    var e = elem.split('#')[1]
    var myquery =  `
    select ?nota where { 
        :${e} :conteudo ?nota.
    }
    `
    var dados = ''
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados = {
            idNota: elem,
            nota: C1.nota.value,
        }    
    
    return dados
    
}

async function getTI(elem) { 
    var e = elem.split('#')[1]
    var myquery =  `
    select ?termo where { 
        :${e} :termo ?termo.
    }
    `
    var dados = ''
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados = {
            idTI: elem,
            termo: C1.termo.value,
        }    
    
    return dados
    
}

async function getDonos(elem,tipo) { 
    var e = elem.split('#')[1]
    var myquery =  `
    select ?tipo ?sigla ?designacao where { 
        :${e} rdf:type ?tipo;
                 :${tipo}Sigla ?sigla;
                 :${tipo}Designacao ?designacao.
        filter(?tipo!=owl:NamedIndividual)
    }
    `
    var dados = ''
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados = {
            tipo: C1.tipo.value,
            sigla: C1.sigla.value,
            idDono: e,
            idTipo: C1.tipo.value.split('#')[1],
            designacao:C1.designacao.value,
            id:elem,

        }    
    
    return dados
    
}

async function getParticipantes(id,elem,tipo) { 
    var e = elem.split('#')[1]
    var myquery =  `
    select ?tipoPar ?tipo ?sigla ?designacao where { 
        :${e} rdf:type ?tipo;
                 :${tipo}Sigla ?sigla;
                 :${tipo}Designacao ?designacao;
                 ?tipoPar :${id}.
        filter(?tipoPar != owl:NamedIndividual && ?tipoPar != :participaEm && ?tipoPar != :eDonoProcesso && ?tipo != owl:NamedIndividual)
    }
    `
    var dados = ''
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    var tp = C1.tipoPar.value.split('#')[1]
    var tipoPar = ''
    if(tp=='participaEmApreciando') tipoPar = 'Apreciador'
    else if(tp=='participaEmAssessorando') tipoPar = 'Assessor'
    else if(tp=='participaEmComunicando') tipoPar = 'Comunicador'
    else if(tp=='participaEmDecidindo') tipoPar = 'Decisor'
    else if(tp=='participaEmExecutando') tipoPar = 'Executor'
    else if(tp=='participaEmIniciando') tipoPar = 'Iniciador'
    dados = {
            participLabel: tipoPar,
            sigla: C1.sigla.value,
            idDono: e,
            idTipo: C1.tipo.value.split('#')[1],
            designacao:C1.designacao.value,
            id:elem,

        }    
    
    return dados
    
}

async function getRelacionados(id,elem) { 
    var e = elem.split('#')[1]
    var myquery =  `
    select ?tipoRel ?codigo ?titulo ?status where { 
        :${e} :codigo ?codigo;
              :titulo ?titulo;
              ?tipoR :${id}.
        ?tipoR owl:inverseOf ?tipoRel.
        optional{:${e} :classeStatus ?status.}
        filter(?tipoRel != owl:NamedIndividual && ?tipoRel != :temRelProc )
    }
    `
    var dados = ''
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados = {
            codigo: C1.codigo.value,
            tipoRel: C1.tipoRel.value,
            idRel: C1.tipoRel.value.split('#')[1],
            titulo:C1.titulo.value,
            id:elem,
            status:C1.status.value

        }    
    
    return dados
    
}

async function getLegislacao(elem) { 
    var e = elem.split('#')[1]
    var myquery =  `
    select ?tipo ?sumario ?numero where { 
        :${e} :diplomaTipo ?tipo;
              :diplomaSumario ?sumario;
              :diplomaNumero ?numero.
    }
    `
    var dados = ''
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados = {
            tipo: C1.tipo.value,
            sumario: C1.sumario.value,
            numero: C1.numero.value,
            idLeg:e,
            id:elem,

        }    
    
    return dados
    
}

async function getPCA(elem) { 
    var e = elem.split('#')[1]
    var myquery =  `
    select ?formaContagem ?idJust ?notas ?valores (group_concat(distinct ?c;separator=";")as ?crit ) ?sub where { 
        :${e} :pcaValor ?valores;
              :pcaFormaContagemNormalizada ?vc;
              :temJustificacao ?idJust.
        ?vc skos:prefLabel ?formaContagem.
        ?idJust :temCriterio ?c.
        optional{:${e} :pcaSubFormaContagem ?s.
                 ?s skos:prefLabel ?sub.}
        optional{:${e} :pcaNota ?notas.}
    }group by ?formaContagem ?idJust ?notas ?valores ?sub
    `
    var dados = {}
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    
    dados = {
            idPCA: elem,
            idJust: C1.idJust.value.split('#')[1],
            notas:C1.notas ? C1.notas.value : "",
            valores:C1.valores.value,
            justificacao: C1.crit.value.length > 0 ? await Promise.all(C1.crit.value.split(';').map(Element => getJust(Element))) : [],
        }   
        result.results.bindings.forEach(element => {
            var objName = element.formaContagem['xml:lang']=="pt" ? 'formaContagem' : 'formaContagem_' + element.formaContagem['xml:lang'] 
            dados[objName] = element.formaContagem.value
        });
    if(C1.sub) dados['subFormaContagem'] = C1.sub.value
    return dados
    
}

async function getJust(elem) { 
    var e = elem.split('#')[1]
    var myquery =  `
    select ?tipoId ?conteudo (group_concat(distinct ?p;separator=";")as ?processos ) (group_concat(distinct ?l;separator=";")as ?legislacao ) where { 
        :${e} rdf:type ?tipoId;
                 :conteudo ?conteudo.
        optional{:${e} :critTemProcRel ?p.}         
        optional{:${e} :critTemLegAssoc ?l.}
        filter(?tipoId != owl:NamedIndividual && ?tipoId != :AtributoComposto && ?tipoId != :CriterioJustificacao)
    }group by ?tipoId ?conteudo
    `
    var dados = {}
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    
    dados = {
            tipoId: C1.tipoId.value.split('#')[1],
            conteudo: C1.conteudo.value,
            criterio:elem,
            processos:C1.processos.value.length > 0 ? C1.processos.value.split(';').map(Element => { return {procId:Element.split('#')[1]}}) : [],
            legislacao:C1.legislacao.value.length > 0 ? C1.legislacao.value.split(';').map(Element => {return {legId:Element.split('#')[1]}}) : []
        }   
    return dados

    
}

async function getDF(elem) { 
    var e = elem.split('#')[1]
    var myquery =  `
    select ?idJust ?valor (group_concat(distinct ?c;separator=";")as ?crit ) where { 
        :${e} :dfValor ?valor;
              :temJustificacao ?idJust.
        ?idJust :temCriterio ?c.
    }group by ?idJust ?valor
    `
    var dados = {}
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    
    dados = {
            idJust: C1.idJust.value.split('#')[1],
            valor:C1.valor.value,
            idDF:elem,
            justificacao: C1.crit.value.length > 0 ? await Promise.all(C1.crit.value.split(';').map(Element => getJust(Element))) : [],
        }   
    return dados
    
}

module.exports.classChildren = async function(id){
    var myquery = `
    select (group_concat(distinct ?c2;separator=";") as ?filhos) where { 
        select ?c2 where { 
            :${id} :temFilho ?c2.
        }order by asc(?c2)
     }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    if (C1.filhos.value != '') {
        dados = await Promise.all (C1.filhos.value.split(';').map(C2 => {
            let dados = getClass_noChildren(C2)
            return dados
        })) 
    }
	
    return dados
}


async function getClass_noChildren(elem) { 
    var e = elem.split('#')[1]
    var myquery = `
    select ?codigo ?titulo ?status where { 
        :${e} :codigo ?codigo;
             :titulo ?titulo;
              :classeStatus ?status.
    }
    `
    var dados = ''

    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]

    dados = {
        codigo: C1.codigo.value,
        titulo: C1.titulo.value,
        id: elem,
        status: C1.status.value,
    };


    return await dados
    
}

module.exports.classDF = async function(id){
    var myquery = `
    select ?df ?idJust ?valor where { 
        :${id} :temDF ?df.
        ?df :temJustificacao ?idJust;
            :dfValor ?valor;
     }
    `
    var dados = {}
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    dados = {
        idJust : C1.idJust.value.split('#')[1],
        valor : C1.valor.value,
        idDF : C1.df.value
    }
	
    return dados
}

module.exports.classDono = async function(id){
    var myquery = `
    select distinct ?id ?tipo ?sigla ?designacao where { 
        {:${id} :temDono ?id.
        ?id rdf:type ?tipo;
            :entSigla ?sigla;
            :entDesignacao ?designacao}
        union
        {:${id} :temDono ?id.
        ?id rdf:type ?tipo;
            :tipSigla ?sigla;
            :tipDesignacao ?designacao}
        filter( ?tipo != owl:NamedIndividual )
    
    }order by asc(?id)
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
		return {
            tipo: C1.tipo.value,
            sigla: C1.sigla.value,
			idDono: C1.id.value.split('#')[1],
            idTipo: C1.tipo.value.split('#')[1],
			designacao: C1.designacao.value,
            id: C1.id.value
		};
	}));
	
    return dados
}

module.exports.exemplosNotasAp = async function(id){
    var myquery = `
    select ?id ?exemplo where { 
        :${id} :temExemploNA ?id.
        ?id :conteudo ?exemplo.
    }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
		return {
            idExemplo: C1.id.value,
            exemplo: C1.exemplo.value
		};
	}));
	
    return dados
}

module.exports.legislacao = async function(id){
    var myquery = `
    select ?id ?tipo ?sumario ?numero where { 
        :${id} :temLegislacao ?id.
        ?id :diplomaTipo ?tipo;
            :diplomaSumario ?sumario;
            :diplomaNumero ?numero;
    }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
		return {
            tipo: C1.tipo.value,
            sumario: C1.sumario.value,
            numero: C1.numero.value,
            idLeg: C1.id.value.split('#')[1],
            id: C1.id.value,
		};
	}));
	
    return dados
}

module.exports.meta = async function(id){
    var myquery = `
    select ?codigo ?pai ?desc ?pt ?procTrans ?status ?titulo ?tituloPai ?codigoPai ?procTipo (lang(?procTipo) as ?lang) where { 
        :${id} :codigo ?codigo;
                     :temPai ?pai;
                     :descricao ?desc;
                     :processoTipoVC ?pt;
                     :processoTransversal ?procTrans;
                     :classeStatus ?status;
                     :titulo ?titulo.
        ?pai :titulo ?tituloPai;
             :codigo ?codigoPai.
        ?pt skos:prefLabel ?procTipo.      
    }
    `
    var dados = {}
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
	dados = {
            codigo:C1.codigo.value,
            codigoPai:C1.codigoPai.value,
            desc:C1.desc.value,
            id:id,
            pai:C1.pai.value,
            procTrans:C1.procTrans.value,
            pt:C1.pt.value,
            status:C1.status.value,
            titulo:C1.titulo.value,
            tituloPai:C1.tituloPai.value
		}
    
    result.results.bindings.forEach(element => {
        var objName = 'procTipo_' + element.lang.value
        dados[objName] = element.procTipo.value
    });
	
    return dados
}

module.exports.notasApEx = async function(id,ap_ex){
    var myquery = `
    select ?idNota ?nota where { 
        :${id} :temNota${ap_ex} ?idNota.
        ?idNota :conteudo ?nota.
    }
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
		return {
            idNota: C1.idNota.value,
            nota: C1.nota.value,
		};
	}));
	
    return dados
}

module.exports.participante = async function(id){
    var myquery = `
    select (group_concat(distinct ?lang;separator=";") as ?langs) (group_concat(distinct ?participLabel;separator=";") as ?participLabels) ?sigla ?designacao ?id ?idTipo where {
        select (lang(?participLabel) as ?lang) ?participLabel ?sigla ?designacao ?id ?idTipo where { 
        {:${id} :temParticipante ?id.
        ?id rdf:type ?idTipo;
            ?obj :${id};
            :entDesignacao ?designacao;
            :entSigla ?sigla.
        ?obj rdfs:subPropertyOf :participaEm;
             rdfs:label ?participLabel.}
        union
        {:${id} :temParticipante ?id.
        ?id rdf:type ?idTipo;
            ?obj :${id};
            :tipDesignacao ?designacao;
            :tipSigla ?sigla.
        ?obj rdfs:subPropertyOf :participaEm;
             rdfs:label ?participLabel.}
        filter( ?idTipo != owl:NamedIndividual && ?obj != :participaEm)
    } order by asc(?id)
    }group by ?sigla ?designacao ?id ?idTipo
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
        var langs = C1.langs.value.split(';')
        var participLabel = C1.participLabels.value.split(';')
		return {
            ['participLabel_' + langs[0]] : participLabel[0].split(' ')[3],
            ['participLabel_' + langs[1]] : participLabel[1].split(' ')[2],
            sigla: C1.sigla.value,
            designacao: C1.designacao.value,
            idTipo: C1.idTipo.value.split('#')[1],
            id: C1.id.value,
            idParticipante: C1.id.value.split('#')[1]
		};
	}));
	
    return dados
}

module.exports.pca = async function(id){
    var myquery = `
    select (group_concat(distinct ?lang;separator=";") as ?langs) (group_concat(distinct ?formaContagem;separator=";") as ?formaContagens) ?idPCA ?idJust ?notas ?valores where {
        select (lang(?formaContagem) as ?lang) ?formaContagem ?idPCA ?idJust ?notas ?valores where{
        :${id} :temPCA ?idPCA.
        ?idPCA :temJustificacao ?idJust;
               :pcaValor ?valores.
        optional{?idPCA :pcaNota ?notas.}
        ?idPCA :pcaFormaContagemNormalizada ?fc.
        ?fc skos:prefLabel ?formaContagem.  
    }
    } group by ?idPCA ?idJust ?notas ?valores
    `
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    console.log(C1)
    var notas = ''
    if(C1.notas !== undefined){
        notas = C1.notas.value
    }
    var dados = {
        ['formaContagem_' + C1.langs.value.split(';')[0]] : C1.formaContagens.value.split(';')[0],
        ['formaContagem_' + C1.langs.value.split(';')[1]] : C1.formaContagens.value.split(';')[1],
        idPCA : C1.idPCA.value,
        idJust : C1.idJust.value,
        notas: notas,
        valores : C1.valores.value
    }
	
    return dados
}

module.exports.procRel = async function(id,relacao){
    relacao = relacao || 'temRelProc'
    var myquery = `
    select ?id ?codigo ?rel ?titulo ?status where{
        :${id} :${relacao} ?id;
                     ?rel ?id.
        ?id :codigo ?codigo;
            :titulo ?titulo;
            :classeStatus ?status.
        filter(?rel != :temRelProc)
    } order by asc(?id)
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
		return {
            codigo: C1.codigo.value,
            tipoRel: C1.rel.value,
            idRel: C1.rel.value.split('#')[1],
            titulo: C1.titulo.value,
            id: C1.id.value,
            status: C1.status.value
		};
	}));
	
    return dados
}

module.exports.ti = async function(id){
    var myquery = `
    select ?idTI ?termo where{
        :${id} :temTI ?idTI.
        ?idTI :termo ?termo.
    } order by asc(?idTI)
    `
    var dados = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
		return {
            idTI: C1.idTI.value,
            termo: C1.termo.value,
		};
	}));
	
    return dados
}

module.exports.codigo = async function(id){
    var myquery = `
    select ?pred ?subj where{
        :${id} ?pred ?subj.
    }
    `
    var result = await gdb.execQuery(myquery);
    if(result.results.bindings.length > 0) return true;
    else return false;
}

module.exports.justificacao = async function(id){
    var myquery = `
    select ?tipoId ?conteudo ?criterio (group_concat(distinct ?p;separator=";") as ?processos) (group_concat(distinct ?l;separator=";") as ?legislacao) where{
        {
           :${id} :temCriterio ?criterio.
       ?criterio :conteudo ?conteudo;
                 rdf:type ?tipoId;
       optional{?criterio :critTemLegAssoc ?l;}}
       union
       {
           :${id} :temCriterio ?criterio.
       ?criterio :conteudo ?conteudo;
                 rdf:type ?tipoId;
       optional{?criterio :critTemProcRel ?p;}}
       filter(?tipoId != owl:NamedIndividual && ?tipoId != :CriterioJustificacao && ?tipoId != :AtributoComposto)
   } group by ?tipoId ?conteudo ?criterio
    `
    var dados = []
    var l = []
    var result = await gdb.execQuery(myquery);
	dados = await Promise.all(result.results.bindings.map(C1 => {
        var legislacao = C1.legislacao.value
        var processos = C1.processos.value
        if(legislacao != '') legislacao = legislacao.split(';').map(l => {
            return {
                ledId : l.split('#')[1]
            }
        });
        else legislacao = []
        if(processos != '') processos = processos.split(';').map(p => {
            return {
                ledId : p.split('#')[1]
            }
        });
        else processos = []
		return {
            tipoId: C1.tipoId.value.split('#')[1],
            conteudo: C1.conteudo.value,
            criterio: C1.criterio.value,
            processos: processos,
            legislacao: legislacao
		};
	}));
	
    return dados
}

module.exports.titulo = async function(title){
    var myquery = `
    select ?id ?title where{
        {?id rdf:type :Classe_N1;
            :titulo "${title}".}
        union
        {?id rdf:type :Classe_N2;
            :titulo "${title}".}
        union
        {?id rdf:type :Classe_N3;
            :titulo "${title}".}
        union
        {?id rdf:type :Classe_N4;
            :titulo "${title}".}
        
    }
    `
    var result = await gdb.execQuery(myquery);
    if(result.results.bindings.length > 0) return true;
    else return false;
}

