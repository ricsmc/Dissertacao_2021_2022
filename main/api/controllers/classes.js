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

module.exports.classDF = async function(id){
    var myquery = `
    select ?df ?idDF ?valor where { 
        :${id} :temDF ?df.
        ?df :temJustificacao ?idDF;
            :dfValor ?valor;
     }
    `
    var dados = {}
    var result = await gdb.execQuery(myquery);
    var C1 = result.results.bindings[0]
    if (C1.filhos.value != '') {
        dados = {
            idJust : C1.df,
            valor : C1.valor,
            idDF : C1.idDF
        } 
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
    select ?codigo ?pai ?desc ?pt ?procTrans ?status ?titulo ?tituloPai ?codigoPai ?procTipo where { 
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
    
    console.log(dados)
    result.results.bindings.forEach(element => {
        var objName = 'procTipo_' + element.procTipo['xml:lang']
        dados[objName] = element.procTipo.value
    });
	
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
                    let dados = getC(C2,x+1)
                    return dados
                }))
            };

        }
        
    }
    return await dados
    
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
